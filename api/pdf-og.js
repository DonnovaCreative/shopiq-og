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
// Bundling: pdfjs-dist must be in serverExternalPackages (see vercel.json).

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createRequire } from "module";
import { pathToFileURL } from "url";

export const config = {
  runtime: "nodejs",
  // Generous so cold-start + PDF download + render fit comfortably
  maxDuration: 30,
};

// ============================================================
// Brand config — adjust these to match shopiq exactly
// ============================================================
const BRAND = {
  bg: "#0A4FA8",            // lacoreblue (replace with your exact hex)
  // The card behind the PDF preview (subtle, just enough to lift it)
  cardBg: "#FFFFFF",
  cardShadow: "rgba(0, 0, 0, 0.18)",
  // Output dimensions — Open Graph spec recommends 1200x630
  width: 1200,
  height: 630,
  // PDF preview sizing within the canvas
  // The PDF is rendered tall (portrait), so we cap by height
  pdfMaxHeightRatio: 0.78,  // 78% of canvas height
  pdfShadowBlur: 32,
  pdfShadowOffsetY: 12,
  cardPadding: 0,           // 0 = the PDF page IS the card. Bump to 16/24 for a white border around it.
};

// ============================================================
// Lazy-load pdfjs-dist (runtime import to dodge bundler analysis)
// ============================================================
let pdfjsCache = null;
async function loadPdfjs() {
  if (pdfjsCache) return pdfjsCache;

  // pdfjs-dist accesses DOMMatrix / ImageData at module load time on Node.
  // @napi-rs/canvas exposes these globally on the canvas instance, but we
  // need them on globalThis BEFORE pdfjs-dist evaluates.
  const canvasModule = await import("@napi-rs/canvas");
  if (!globalThis.DOMMatrix) globalThis.DOMMatrix = canvasModule.DOMMatrix;
  if (!globalThis.ImageData) globalThis.ImageData = canvasModule.ImageData;
  if (!globalThis.Path2D)    globalThis.Path2D    = canvasModule.Path2D;

  // Dynamically resolve pdfjs-dist's legacy build path at runtime.
  // The legacy build is the Node-friendly variant.
  const require = createRequire(`${process.cwd()}/`);
  const modPath = require.resolve("pdfjs-dist/legacy/build/pdf.mjs");
  const modUrl = pathToFileURL(modPath).href;
  // new Function dodges static import analysis so the bundler doesn't
  // try to inline pdfjs-dist (which would fail).
  const runtimeImport = new Function("u", "return import(u);");
  const pdfjs = await runtimeImport(modUrl);

  // Disable workers in serverless context — single-threaded is fine here
  pdfjs.GlobalWorkerOptions.workerSrc = false;

  pdfjsCache = pdfjs;
  return pdfjs;
}

// ============================================================
// Render PDF page 1 to a canvas buffer
// ============================================================
async function renderPdfFirstPage(pdfBytes, targetHeight) {
  const pdfjs = await loadPdfjs();

  const loadingTask = pdfjs.getDocument({
    data: pdfBytes,
    disableFontFace: true,        // Avoids font-loading hiccups in serverless
    useSystemFonts: false,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // Compute scale so the rendered page is exactly targetHeight px tall
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = targetHeight / baseViewport.height;
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");

  // White background behind the page (PDFs without explicit bg render transparent)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  await page.render({
    canvasContext: ctx,
    viewport,
    // Disable annotations and forms — pure visual render
    intent: "print",
  }).promise;

  return { buffer: canvas.toBuffer("image/png"), width: viewport.width, height: viewport.height };
}

// ============================================================
// Main handler
// ============================================================
export default async function handler(req, res) {
  try {
    const { url, bg, w, h } = req.query || {};

    if (!url) {
      return res.status(400).json({ error: "Missing required ?url= parameter" });
    }

    // Basic URL validation — only allow http(s)
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

    // 1. Fetch PDF bytes
    const pdfRes = await fetch(pdfUrl.href, {
      headers: { "User-Agent": "shopiq-og/1.0" },
    });
    if (!pdfRes.ok) {
      return res.status(502).json({ error: `Could not fetch PDF (HTTP ${pdfRes.status})` });
    }
    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());

    // 2. Render PDF page 1 to a buffer
    // Render at 2x the target on-canvas height for crisp downsampling
    const targetPdfHeight = Math.round(height * BRAND.pdfMaxHeightRatio);
    const { buffer: pageBuffer } = await renderPdfFirstPage(pdfBytes, targetPdfHeight * 2);
    const pageImage = await loadImage(pageBuffer);

    // 3. Compose the OG image
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Compute final placement of the PDF preview
    // Maintain aspect ratio of the rendered page
    const pageAspect = pageImage.width / pageImage.height;
    const finalHeight = targetPdfHeight;
    const finalWidth = finalHeight * pageAspect;
    const finalX = (width - finalWidth) / 2;
    const finalY = (height - finalHeight) / 2;

    // Optional: white card background behind the PDF (if cardPadding > 0)
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
      // Drop shadow drawn directly under the PDF page
      ctx.save();
      ctx.shadowColor = BRAND.cardShadow;
      ctx.shadowBlur = BRAND.pdfShadowBlur;
      ctx.shadowOffsetY = BRAND.pdfShadowOffsetY;
      // Draw a same-size rect first so the shadow renders cleanly,
      // then layer the page on top with no shadow
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(finalX, finalY, finalWidth, finalHeight);
      ctx.restore();
    }

    // The PDF preview itself
    ctx.drawImage(pageImage, finalX, finalY, finalWidth, finalHeight);

    // 4. Output as PNG with cache headers
    const out = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    // Cache aggressively — these are deterministic per PDF URL.
    // s-maxage is for Vercel's edge cache; max-age for the client.
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
