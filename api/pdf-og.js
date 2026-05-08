// api/pdf-og.js
//
// Generates an Open Graph image: PDF first page rendered as an image,
// centered on a solid brand background, with subtle drop shadow.
//
// USAGE:
//   /api/pdf-og?url=<encoded-pdf-url>
//
// Optional params:
//   ?bg=<hex>    Override the background color (default: shopiq lacoreblue)
//   ?w=<int>     Output width (default: 1200)
//   ?h=<int>     Output height (default: 630)
//
// Runtime: Node.js (NOT edge — pdfjs-dist needs canvas).

import { createCanvas, loadImage } from "@napi-rs/canvas";
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
  pdfMaxHeightRatio: 0.78,
  pdfShadowBlur: 32,
  pdfShadowOffsetY: 12,
  cardPadding: 0,
};

// ============================================================
// Lazy-load pdfjs-dist
// ============================================================
let pdfjsCache = null;
async function loadPdfjs() {
  if (pdfjsCache) return pdfjsCache;

  // Polyfill canvas globals BEFORE pdfjs-dist evaluates
  const canvasModule = await import("@napi-rs/canvas");
  if (!globalThis.DOMMatrix) globalThis.DOMMatrix = canvasModule.DOMMatrix;
  if (!globalThis.ImageData) globalThis.ImageData = canvasModule.ImageData;
  if (!globalThis.Path2D)    globalThis.Path2D    = canvasModule.Path2D;

  // Resolve pdfjs-dist legacy build at runtime (dodges bundler analysis)
  const require = createRequire(`${process.cwd()}/`);
  const modPath = require.resolve("pdfjs-dist/legacy/build/pdf.mjs");
  const modUrl = pathToFileURL(modPath).href;
  const runtimeImport = new Function("u", "return import(u);");
  const pdfjs = await runtimeImport(modUrl);

  // pdfjs-dist v4 requires workerSrc to be a string path, not a boolean.
  // Point it at the legacy worker file. pdfjs-dist will fall back to
  // running the worker on the main thread in Node, since there's no Worker global.
  const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  pdfjsCache = pdfjs;
  return pdfjs;
}

// ============================================================
// Render PDF page 1
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

  await page.render({
    canvasContext: ctx,
    viewport,
    intent: "print",
  }).promise;

  return { buffer: canvas.toBuffer("image/png"), width: viewport.width, height: viewport.height };
}

// ============================================================
// Handler
// ============================================================
export default async function handler(req, res) {
  try {
    const { url, bg, w, h } = req.query || {};

    if (!url) {
      return res.status(400).json({ error: "Missing required ?url= parameter" });
    }

    let pdfUrl;
    try {
      pdfUrl = new URL(url);
      if (!/^https?:$/.test(pdfUrl.protocol)) throw new Error("Invalid protocol");
    } catch {
      return res.status(400).json({ error: "Invalid url parameter" });
    }

    const width  = parseInt(w, 10) || BRAND.width;
    const height = parseInt(h, 10) || BRAND.height;
    const bgColor = bg ? `#${bg.replace(/^#/, "")}` : BRAND.bg;

    const pdfRes = await fetch(pdfUrl.href, {
      headers: { "User-Agent": "shopiq-og/1.0" },
    });
    if (!pdfRes.ok) {
      return res.status(502).json({ error: `Could not fetch PDF (HTTP ${pdfRes.status})` });
    }
    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());

    const targetPdfHeight = Math.round(height * BRAND.pdfMaxHeightRatio);
    const { buffer: pageBuffer } = await renderPdfFirstPage(pdfBytes, targetPdfHeight * 2);
    const pageImage = await loadImage(pageBuffer);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const pageAspect = pageImage.width / pageImage.height;
    const finalHeight = targetPdfHeight;
    const finalWidth = finalHeight * pageAspect;
    const finalX = (width - finalWidth) / 2;
    const finalY = (height - finalHeight) / 2;

    if (BRAND.cardPadding > 0) {
      const pad = BRAND.cardPadding;
      ctx.save();
      ctx.shadowColor = BRAND.cardShadow;
      ctx.shadowBlur = BRAND.pdfShadowBlur;
      ctx.shadowOffsetY = BRAND.pdfShadowOffsetY;
      ctx.fillStyle = BRAND.cardBg;
      ctx.fillRect(finalX - pad, finalY - pad, finalWidth + pad * 2, finalHeight + pad * 2);
      ctx.restore();
    } else {
      ctx.save();
      ctx.shadowColor = BRAND.cardShadow;
      ctx.shadowBlur = BRAND.pdfShadowBlur;
      ctx.shadowOffsetY = BRAND.pdfShadowOffsetY;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(finalX, finalY, finalWidth, finalHeight);
      ctx.restore();
    }

    ctx.drawImage(pageImage, finalX, finalY, finalWidth, finalHeight);

    const out = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
    );
    return res.status(200).send(out);
  } catch (err) {
    console.error("pdf-og error:", err);
    return res.status(500).json({ error: "Failed to generate OG image", detail: String(err?.message || err) });
  }
}