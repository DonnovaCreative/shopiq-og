// api/pdf-og.js
//
// Generates an Open Graph / listing card image from any CMS attachment.
//
// Routing:
//   application/pdf       → render page 1 of the PDF
//   image/* (jpeg/png/…)  → load and composite the image
//   anything else / fail  → text fallback card with filename
//
// USAGE:
//   /api/pdf-og?url=<encoded-file-url>
//   /api/pdf-og?url=<encoded-file-url>&title=<document-title>
//
// Optional params:
//   ?bg=<hex>    Override the background color
//   ?w=<int>     Output width (default: 1200)
//   ?h=<int>     Output height (default: 630)
//
// Runtime: Node.js (NOT edge — pdfjs-dist needs canvas).

import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { createRequire } from "module";
import { pathToFileURL } from "url";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

// ============================================================
// Brand config
// ============================================================
const BRAND = {
  bg: "#0A4FA8",
  cardBg: "#FFFFFF",
  cardShadow: "rgba(0, 0, 0, 0.18)",
  width: 1200,
  height: 630,
  // Preview area (PDF or image) sizing
  previewMaxHeightRatio: 0.78,
  previewMaxWidthRatio: 0.85,
  previewShadowBlur: 32,
  previewShadowOffsetY: 12,
  // Fallback card colors
  fallbackText: "#FFFFFF",
  fallbackSubtext: "rgba(255, 255, 255, 0.7)",
};

// ============================================================
// Lazy-load pdfjs-dist (only when actually rendering a PDF)
// ============================================================
let pdfjsCache = null;
async function loadPdfjs() {
  if (pdfjsCache) return pdfjsCache;

  const canvasModule = await import("@napi-rs/canvas");
  if (!globalThis.DOMMatrix) globalThis.DOMMatrix = canvasModule.DOMMatrix;
  if (!globalThis.ImageData) globalThis.ImageData = canvasModule.ImageData;
  if (!globalThis.Path2D)    globalThis.Path2D    = canvasModule.Path2D;

  const require = createRequire(`${process.cwd()}/`);
  const modPath = require.resolve("pdfjs-dist/legacy/build/pdf.mjs");
  const modUrl = pathToFileURL(modPath).href;
  const runtimeImport = new Function("u", "return import(u);");
  const pdfjs = await runtimeImport(modUrl);

  const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  pdfjsCache = pdfjs;
  return pdfjs;
}

// ============================================================
// File type detection
// ============================================================
function detectKind(contentType, url) {
  const ct = (contentType || "").toLowerCase().split(";")[0].trim();

  // Trust content-type first
  if (ct === "application/pdf") return "pdf";
  if (ct.startsWith("image/")) return "image";

  // Fall back to URL extension if content-type is missing/wrong
  // (Webflow's CDN sometimes serves with generic application/octet-stream)
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const ext = pathname.split(".").pop();
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) return "image";
  } catch {}

  return "other";
}

function getFilenameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const raw = pathname.split("/").pop() || "";
    return decodeURIComponent(raw);
  } catch {
    return "";
  }
}

// ============================================================
// Render PDF page 1 to a buffer
// ============================================================
async function renderPdfFirstPage(pdfBytes, targetHeight) {
  const pdfjs = await loadPdfjs();

  const loadingTask = pdfjs.getDocument({
    data: pdfBytes,
    disableFontFace: true,
    useSystemFonts: false,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const baseViewport = page.getViewport({ scale: 1 });
  const scale = targetHeight / baseViewport.height;
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  await page.render({ canvasContext: ctx, viewport, intent: "print" }).promise;

  return canvas.toBuffer("image/png");
}

// ============================================================
// Compose final OG image with a centered preview on the brand bg
// ============================================================
function composeWithPreview(previewImage, width, height, bgColor) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Fit preview into the available area, preserving aspect ratio.
  // Constrained by both max height AND max width — important for landscape images.
  const maxH = height * BRAND.previewMaxHeightRatio;
  const maxW = width * BRAND.previewMaxWidthRatio;
  const aspect = previewImage.width / previewImage.height;

  let finalH = maxH;
  let finalW = finalH * aspect;
  if (finalW > maxW) {
    finalW = maxW;
    finalH = finalW / aspect;
  }
  const finalX = (width - finalW) / 2;
  const finalY = (height - finalH) / 2;

  // Drop shadow underneath
  ctx.save();
  ctx.shadowColor = BRAND.cardShadow;
  ctx.shadowBlur = BRAND.previewShadowBlur;
  ctx.shadowOffsetY = BRAND.previewShadowOffsetY;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(finalX, finalY, finalW, finalH);
  ctx.restore();

  // Preview itself
  ctx.drawImage(previewImage, finalX, finalY, finalW, finalH);

  return canvas.toBuffer("image/png");
}

// ============================================================
// Fallback card: brand bg with document icon + title/filename
// ============================================================
function composeFallback(width, height, bgColor, title) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Centered document icon (drawn in SVG-ish path)
  const iconSize = 120;
  const iconX = width / 2 - iconSize / 2;
  const iconY = height / 2 - iconSize / 2 - 40;

  ctx.save();
  ctx.translate(iconX, iconY);
  drawDocumentIcon(ctx, iconSize);
  ctx.restore();

  // Title text
  if (title) {
    const text = title.length > 80 ? title.slice(0, 77) + "…" : title;
    ctx.fillStyle = BRAND.fallbackText;
    ctx.font = "600 36px system-ui, -apple-system, 'Helvetica Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Wrap to two lines if needed (very simple word-wrap)
    const lines = wrapText(ctx, text, width * 0.75);
    const baselineY = iconY + iconSize + 60;
    lines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, width / 2, baselineY + i * 44);
    });
  }

  return canvas.toBuffer("image/png");
}

function drawDocumentIcon(ctx, size) {
  // Simple document/page icon — white outlined rect with folded corner + 3 lines
  const stroke = 6;
  const folded = size * 0.28;

  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = stroke;
  ctx.lineJoin = "round";

  // Page outline with folded corner
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size - folded, 0);
  ctx.lineTo(size, folded);
  ctx.lineTo(size, size);
  ctx.lineTo(0, size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Folded corner triangle
  ctx.beginPath();
  ctx.moveTo(size - folded, 0);
  ctx.lineTo(size - folded, folded);
  ctx.lineTo(size, folded);
  ctx.stroke();

  // Three text lines inside the icon
  ctx.lineWidth = stroke * 0.7;
  ctx.lineCap = "round";
  const lineY = [size * 0.55, size * 0.7, size * 0.85];
  const inset = size * 0.18;
  lineY.forEach((y, i) => {
    ctx.beginPath();
    ctx.moveTo(inset, y);
    ctx.lineTo(size - inset - (i === 2 ? size * 0.2 : 0), y);
    ctx.stroke();
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    const test = current ? current + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ============================================================
// Handler
// ============================================================
export default async function handler(req, res) {
  const { url, bg, w, h, title } = req.query || {};

  const width  = parseInt(w, 10) || BRAND.width;
  const height = parseInt(h, 10) || BRAND.height;
  const bgColor = bg ? `#${bg.replace(/^#/, "")}` : BRAND.bg;

  // Cache headers — applied to all responses, including fallbacks
  const setCacheHeaders = () => {
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
    );
  };

  // Helper: send fallback image
  const sendFallback = (fallbackTitle) => {
    const out = composeFallback(width, height, bgColor, fallbackTitle || "Document");
    setCacheHeaders();
    return res.status(200).send(out);
  };

  // No URL? Show fallback rather than 400 — keeps listing cards from breaking
  // when a CMS item just hasn't been given an attachment yet.
  if (!url) return sendFallback(title);

  let fileUrl;
  try {
    fileUrl = new URL(url);
    if (!/^https?:$/.test(fileUrl.protocol)) throw new Error("Invalid protocol");
  } catch {
    return sendFallback(title);
  }

  // Use filename as fallback title if no explicit ?title= given
  const fallbackTitle = title || getFilenameFromUrl(fileUrl.href) || "Document";

  try {
    // 1. Fetch the file
    const fileRes = await fetch(fileUrl.href, {
      headers: { "User-Agent": "shopiq-og/1.0" },
    });
    if (!fileRes.ok) return sendFallback(fallbackTitle);

    const contentType = fileRes.headers.get("content-type") || "";
    const kind = detectKind(contentType, fileUrl.href);
    const bytes = new Uint8Array(await fileRes.arrayBuffer());

    // 2. Route based on file kind
    if (kind === "pdf") {
      const targetH = Math.round(height * BRAND.previewMaxHeightRatio);
      const pageBuffer = await renderPdfFirstPage(bytes, targetH * 2);
      const pageImage = await loadImage(pageBuffer);
      const out = composeWithPreview(pageImage, width, height, bgColor);
      setCacheHeaders();
      return res.status(200).send(out);
    }

    if (kind === "image") {
      const img = await loadImage(Buffer.from(bytes));
      const out = composeWithPreview(img, width, height, bgColor);
      setCacheHeaders();
      return res.status(200).send(out);
    }

    // Unknown / unsupported file type → fallback
    return sendFallback(fallbackTitle);
  } catch (err) {
    // Render or fetch failure → fallback (don't surface 500 to listing cards)
    console.error("pdf-og error:", err);
    return sendFallback(fallbackTitle);
  }
}