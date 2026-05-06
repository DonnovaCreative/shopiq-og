import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

// ---------- shopiq brand tokens ----------
const C = {
  blue:   { 50:'#e0efff', 200:'#9bcbfe', 400:'#51a3fd', 600:'#2170d8', 700:'#1750b4' },
  green:  { 50:'#f3fae0', 200:'#d4eb97', 400:'#abd635', 500:'#97cc04', 700:'#5b7a02' },
  orange: { 50:'#feefe6', 200:'#fbbe99', 400:'#f67d34', 500:'#f45d01', 700:'#923801' },
  teal:   { 50:'#f0fdf9', 200:'#99f6e0', 400:'#2ed3b7', 600:'#0e9384', 800:'#125d56' },
  shop:   { 50:'#dbffca', 600:'#2f7f08', 700:'#206300', 800:'#133801', 900:'#0c2600' },
  grey:   { 50:'#f8fafc', 100:'#eef2f6', 400:'#9aa4b2', 700:'#364152', 800:'#202939', 900:'#121926', 950:'#0d121c' },
  zinc:   { 50:'#fafafa', 100:'#f4f4f5', 200:'#e4e4e7', 400:'#a1a1aa', 600:'#52525b', 800:'#27272a', 900:'#18181b' }
};

const palettes = [
  { name:'ocean',   bg:C.grey[950], blobs:[C.blue[400], C.teal[400], C.blue[200]] },
  { name:'meadow',  bg:C.shop[900], blobs:[C.green[400], C.shop[600], C.green[200]] },
  { name:'sunrise', bg:C.grey[950], blobs:[C.orange[400], C.green[400], C.orange[200]] },
  { name:'lagoon',  bg:C.grey[950], blobs:[C.teal[400], C.blue[400], C.teal[200]] },
  { name:'citrus',  bg:C.grey[950], blobs:[C.green[500], C.orange[400], C.green[200]] },
  { name:'aurora',  bg:C.grey[950], blobs:[C.blue[400], C.teal[400], C.green[400]] },
  { name:'embers',  bg:C.grey[950], blobs:[C.orange[500], C.orange[200], C.green[400]] },
  { name:'ice',     bg:C.grey[900], blobs:[C.blue[200], C.teal[200], C.zinc[100]] }
];

const cardThemes = [
  { name:'dark-grey',  fill:C.grey[900], stroke:C.grey[800], text:C.zinc[50],   sub:C.grey[400], logo:C.zinc[50] },
  { name:'dark-zinc',  fill:C.zinc[900], stroke:C.zinc[800], text:C.zinc[50],   sub:C.zinc[400], logo:C.zinc[50] },
  { name:'light-grey', fill:C.grey[50],  stroke:C.grey[100], text:C.grey[900],  sub:C.grey[700], logo:C.grey[900] },
  { name:'light-zinc', fill:C.zinc[50],  stroke:C.zinc[200], text:C.zinc[900],  sub:C.zinc[600], logo:C.zinc[900] }
];

const LOGO_PATH = 'M67.9951 11.1734C68.1149 10.6508 68.3482 10.1627 68.6827 9.73965C68.7366 9.67152 68.8349 9.65722 68.9071 9.70562C69.1171 9.84632 69.412 10.0365 69.8262 10.3009C69.9359 10.371 69.9281 10.5346 69.811 10.5918L68.2331 11.3632C68.1058 11.4254 67.9636 11.3112 67.9951 11.1734ZM67.8078 12.6663H70.0376C70.123 12.6663 70.1947 12.6022 70.2038 12.5176L70.3287 11.3662C70.3429 11.2357 70.2071 11.1409 70.0887 11.1987L67.7341 12.35C67.5751 12.4278 67.6306 12.6663 67.8078 12.6663ZM99.585 38.6123C100.293 37.9163 100.683 36.9886 100.683 35.9997V11.9997C100.683 11.1226 100.376 10.2911 99.8117 9.62749C99.769 9.57719 99.699 9.55719 99.6354 9.57529L95.8116 10.6622C95.6519 10.7076 95.5498 10.8628 95.5718 11.0269L96.2914 16.3923L96.2943 16.4378C96.3217 16.6491 96.3345 16.8281 96.3345 16.9997V40.9997C96.3345 41.325 96.2984 41.646 96.2283 41.9572L99.585 38.6123ZM94.8307 10.4689C94.8434 10.3319 94.9393 10.2168 95.072 10.1791L98.7939 9.12132C98.9372 9.08059 98.9597 8.88689 98.8304 8.81312C98.2807 8.49982 97.6552 8.33299 97.0035 8.33299H84.9567C84.831 8.33299 84.7536 8.46442 84.8101 8.57635C85.2395 9.42705 85.4634 10.3653 85.4634 11.333V12.4997C85.4634 12.5917 85.5383 12.6663 85.6307 12.6663H91.9861C92.8234 12.6663 93.6249 12.9002 94.3151 13.337C94.4225 13.405 94.5634 13.3413 94.5751 13.215L94.8307 10.4689ZM82.9547 12.6663C83.047 12.6663 83.1219 12.5917 83.1219 12.4997V11.333C83.1219 10.1726 82.6101 9.10279 81.7119 8.37169C81.6811 8.34659 81.6417 8.33299 81.6019 8.33299H76.9486C76.9088 8.33299 76.8694 8.34659 76.8386 8.37169C75.9404 9.10279 75.4286 10.1727 75.4286 11.333V12.4997C75.4286 12.5917 75.5035 12.6663 75.5958 12.6663H82.9547ZM71.0469 12.6663H72.9198C73.0122 12.6663 73.0871 12.5917 73.0871 12.4997V11.333C73.0871 10.3653 73.311 9.42705 73.7405 8.57635C73.797 8.46442 73.7196 8.33299 73.5938 8.33299H71.5819C70.8069 8.33299 70.0711 8.56839 69.4554 9.00535C69.3611 9.07229 69.3678 9.21525 69.4652 9.27762C69.8864 9.54729 70.6105 10.0092 70.9407 10.2197C71.0476 10.2879 71.1052 10.4096 71.0915 10.5354L70.8806 12.4818C70.87 12.5803 70.9474 12.6663 71.0469 12.6663ZM82.0072 23.102C79.1283 23.102 76.1699 25.1033 76.1699 29.3164C76.1699 33.5295 79.1282 35.5306 82.0072 35.5306C82.826 35.5306 83.6712 35.3726 84.4109 35.0566L81.479 31.8442L81.4904 31.8345C82.834 30.6843 84.8541 30.8164 86.0352 32.1319L86.8409 33.0291C87.4748 32.0812 87.871 30.8436 87.871 29.3164C87.871 25.1033 84.9127 23.102 82.0072 23.102ZM91.9861 13.333H66.5644C64.5356 13.333 62.885 14.9779 62.885 16.9997V40.9997C62.885 43.0215 64.5356 44.6663 66.5644 44.6663H91.9861C94.0149 44.6663 95.6655 43.0215 95.6655 40.9997V16.9997C95.6655 14.9779 94.0149 13.333 91.9861 13.333ZM89.666 16.7386H91.1915V17.1631H90.6695V18.5823H90.1931V17.1631H89.666V16.7386ZM70.5967 34.9792C70.5967 37.0143 68.9412 38.6641 66.8989 38.6641V23.6799C66.8989 21.6448 68.5545 19.995 70.5967 19.995V34.9792ZM91.5952 38.269C90.2573 39.4123 88.2492 39.2862 87.0659 37.9846L86.8937 37.7951C85.441 38.6113 83.7506 39.0591 82.0072 39.0591C76.9359 39.0591 72.3928 35.3463 72.3928 29.3426C72.3928 23.3128 76.9359 19.5999 82.0072 19.5999C87.105 19.5999 91.648 23.3128 91.648 29.3426C91.648 31.9759 90.7765 34.1613 89.3501 35.7939L91.5952 38.269ZM93.6345 18.5824H93.1733V17.4609L92.7222 18.5824H92.3775L91.9214 17.4762V18.5824H91.4601V16.7386H92.1089L92.56 17.8197L92.9959 16.7386H93.6345V18.5824ZM84.3863 0.833752C81.5109 0.785852 79.1245 3.05655 78.8108 5.85435C75.9835 6.10439 73.7561 8.58989 73.7561 11.4787V12.4997C73.7561 12.5917 73.831 12.6663 73.9233 12.6663H74.5923C74.6847 12.6663 74.7596 12.5917 74.7596 12.4997V11.333C74.7596 9.02129 76.5197 7.11702 78.7735 6.86672V7.49965C78.7735 7.59169 78.8484 7.66632 78.9408 7.66632H79.6097C79.7021 7.66632 79.777 7.59169 79.777 7.49965V6.86615C82.0665 7.12329 83.7909 9.13595 83.7909 11.4636V12.4997C83.7909 12.5917 83.8658 12.6663 83.9582 12.6663H84.6272C84.7195 12.6663 84.7944 12.5917 84.7944 12.4997V11.333C84.7944 8.47762 82.5984 6.12819 79.8016 5.86262C80.0461 3.52839 82.0885 1.71902 84.5202 1.83862C86.9459 1.95789 88.8084 4.04339 88.8084 6.46355V7.49965C88.8084 7.59169 88.8832 7.66632 88.9756 7.66632H89.6446C89.7369 7.66632 89.8118 7.59169 89.8118 7.49965V6.33299C89.8118 3.33145 87.3866 0.883752 84.3863 0.833752ZM10.8255 25.4456C10.6406 24.4186 9.7954 22.8125 7.41818 22.8125C5.64853 22.8125 4.48646 23.9447 4.48646 25.1823C4.48646 26.2092 5.14679 27.0256 6.52023 27.2887L9.13511 27.7891C12.5424 28.4474 14.3649 30.6592 14.3649 33.2925C14.3649 36.1626 11.9614 39.0591 7.60312 39.0591C2.63748 39.0591 0.4453 35.8729 0.154724 33.2134L3.5356 32.3182C3.69401 34.1613 4.98824 35.8203 7.62958 35.8203C9.58413 35.8203 10.6672 34.846 10.6672 33.5295C10.6672 32.4499 9.84825 31.6073 8.3956 31.3176L5.78073 30.7909C2.79606 30.1852 0.867834 28.263 0.867834 25.4457C0.867834 22.1278 3.8525 19.6 7.39195 19.6C11.9349 19.6 13.6783 22.3386 14.1008 24.445L10.8255 25.4456ZM16.3724 38.6641V23.1006C16.3724 21.1672 17.9452 19.6 19.8853 19.6V26.7886C20.7305 25.7879 22.1568 25.3666 23.3983 25.3666C26.6999 25.3666 28.2319 27.6574 28.2319 30.5013V35.1634C28.2319 37.0968 26.6592 38.6641 24.7191 38.6641L24.7189 31.1069C24.7189 29.6587 24.0059 28.5264 22.3154 28.5264C20.8362 28.5264 19.9647 29.6323 19.8853 31.0542V35.1634C19.8853 37.0968 18.3125 38.6641 16.3724 38.6641ZM43.6834 32.1865C43.6834 36.1626 40.7515 39.0591 36.8689 39.0591C32.9862 39.0591 30.0542 36.1626 30.0542 32.1865C30.0542 28.1841 32.9861 25.314 36.8689 25.314C40.7517 25.314 43.6834 28.1841 43.6834 32.1865ZM40.1706 32.1865C40.1706 29.7376 38.5856 28.5 36.8689 28.5C35.1522 28.5 33.5672 29.7376 33.5672 32.1865C33.5672 34.6091 35.152 35.8729 36.8689 35.8729C38.5858 35.8729 40.1706 34.6353 40.1706 32.1865ZM45.6381 43.667V29.1045C45.6381 27.2292 47.1636 25.709 49.0455 25.709V27.2888C49.6264 26.2883 51.0792 25.4193 53.0337 25.4193C56.8373 25.4193 59.0295 28.3158 59.0295 32.1602C59.0295 36.0835 56.573 38.98 52.9018 38.98C51.1057 38.98 49.785 38.2691 49.1509 37.4001V40.1664C49.1509 42.0998 47.5782 43.667 45.6381 43.667ZM52.3469 28.5527C50.551 28.5527 49.0982 29.8957 49.0982 32.1865C49.0982 34.4774 50.551 35.8465 52.3469 35.8465C54.1429 35.8465 55.5694 34.5038 55.5694 32.1865C55.5694 29.8957 54.1431 28.5527 52.3469 28.5527Z';

// ---------- seeded RNG ----------
function hashSlug(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

// ---------- aurora background using radial gradients (Satori-compatible) ----------
// Note: Satori doesn't support feGaussianBlur, so we simulate the aurora effect
// with overlapping radial gradients. Visual is very close to the inline cover.
function auroraBackground(rand, palette, w, h) {
  const blobs = palette.blobs.map((c) => ({
    cx: rand() * w,
    cy: rand() * h,
    r: h * (0.5 + rand() * 0.3),
    color: c,
  }));

  const gradients = blobs
    .map(
      (b) =>
        `radial-gradient(circle at ${((b.cx / w) * 100).toFixed(1)}% ${(
          (b.cy / h) *
          100
        ).toFixed(1)}%, ${b.color}cc 0%, ${b.color}66 25%, transparent 50%)`
    )
    .join(', ');

  return {
    backgroundColor: palette.bg,
    backgroundImage: gradients,
  };
}

// ---------- pattern as SVG ----------
function patternSvg(rand, theme, palette, size) {
  const isDark = theme.name.startsWith('dark');
  const lineCol = isDark ? 'rgba(250,250,250,0.20)' : 'rgba(15,17,21,0.20)';
  const accentCol = palette.blobs[Math.floor(rand() * palette.blobs.length)];
  const type = Math.floor(rand() * 5);
  let inner = '';

  if (type === 0) {
    // dot matrix
    const cols = 12, rows = 12;
    const cw = size / cols, ch = size / rows;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const isAccent = rand() > 0.85;
        const r = isAccent ? 2.4 : 1.4;
        inner += `<circle cx="${(j*cw + cw/2).toFixed(1)}" cy="${(i*ch + ch/2).toFixed(1)}" r="${r}" fill="${isAccent ? accentCol : lineCol}"/>`;
      }
    }
  } else if (type === 1) {
    // isometric
    const step = 18;
    for (let i = -size; i < size + size; i += step) {
      inner += `<line x1="${i}" y1="${size}" x2="${i + size*0.577}" y2="0" stroke="${lineCol}" stroke-width="0.5"/>`;
      inner += `<line x1="${i}" y1="0" x2="${i + size*0.577}" y2="${size}" stroke="${lineCol}" stroke-width="0.5"/>`;
    }
  } else if (type === 2) {
    // concentric squares
    const cx = size/2, cy = size/2;
    for (let i = 1; i <= 8; i++) {
      const sz = size * (i / 9);
      const isAccent = i === 3;
      inner += `<rect x="${(cx - sz/2).toFixed(1)}" y="${(cy - sz/2).toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" rx="3" stroke="${isAccent ? accentCol : lineCol}" fill="none" stroke-width="${isAccent ? 1.2 : 0.5}"/>`;
    }
  } else if (type === 3) {
    // topographic waves
    const lines = 10;
    for (let i = 0; i < lines; i++) {
      const yBase = (size / lines) * i + (size / lines) / 2;
      const amp = 6 + (i % 3) * 2;
      const freq = 0.04 + (i % 2) * 0.01;
      let d = `M 0 ${yBase.toFixed(1)}`;
      for (let xx = 0; xx <= size; xx += 4) {
        const yy = yBase + Math.sin((xx + i * 20) * freq) * amp;
        d += ` L ${xx.toFixed(1)} ${yy.toFixed(1)}`;
      }
      const isAccent = i === Math.floor(lines / 2);
      inner += `<path d="${d}" stroke="${isAccent ? accentCol : lineCol}" stroke-width="${isAccent ? 1.2 : 0.5}" fill="none"/>`;
    }
  } else {
    // staggered bricks
    const cols = 6, rows = 8;
    const cw = size / cols, ch = size / rows;
    for (let i = 0; i < rows; i++) {
      const offset = (i % 2) * (cw / 2);
      for (let j = -1; j < cols + 1; j++) {
        const isAccent = rand() > 0.92;
        const op = (rand() * 0.18 + 0.04).toFixed(2);
        inner += `<rect x="${(j*cw + offset).toFixed(1)}" y="${(i*ch).toFixed(1)}" width="${(cw - 2).toFixed(1)}" height="${(ch - 2).toFixed(1)}" rx="2" fill="${isAccent ? accentCol : (isDark ? '#FFFFFF' : '#000000')}" opacity="${isAccent ? 0.65 : op}"/>`;
      }
    }
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${inner}</svg>`
  )}`;
}

function logoDataUri(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="101" height="45" viewBox="0 0 101 45"><path d="${LOGO_PATH}" fill="${color}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ---------- title wrapping (manual, Satori doesn't auto-wrap reliably) ----------
function wrapText(text, charsPerLine, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > charsPerLine && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const truncated = lines.slice(0, maxLines);
    let last = truncated[maxLines - 1];
    while (last.length > charsPerLine - 1) last = last.slice(0, -1);
    truncated[maxLines - 1] = last.replace(/\s+\S*$/, '') + '…';
    return truncated;
  }
  return lines;
}

// ---------- main handler ----------
export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const title = (searchParams.get('title') || 'Untitled guide').slice(0, 200);
    const desc = (searchParams.get('desc') || '').slice(0, 300);
    const slug = (searchParams.get('slug') || title).slice(0, 200);

    const seed = hashSlug(slug);
    const rand = rng(seed);
    const palette = pick(rand, palettes);
    const theme = pick(rand, cardThemes);
    rand(); rand();

    const titleLines = wrapText(title, 18, 3);
    const descLines = desc ? wrapText(desc, 38, 2) : [];

    const auroraStyle = auroraBackground(rand, palette, 1200, 630);
    const patSide = rand() > 0.5 ? 'br' : 'tl';
    const patternUri = patternSvg(rand, theme, palette, 200);
    const isDark = theme.name.startsWith('dark');

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...auroraStyle,
          }}
        >
          {/* Stack effect — sheets behind the card */}
          <div
            style={{
              position: 'absolute',
              left: '378px',
              top: '41px',
              width: '480px',
              height: '560px',
              background: 'rgba(255,255,255,0.45)',
              borderRadius: '14px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '369px',
              top: '28px',
              width: '480px',
              height: '560px',
              background: 'rgba(255,255,255,0.78)',
              borderRadius: '14px',
            }}
          />

          {/* Main card */}
          <div
            style={{
              position: 'absolute',
              left: '360px',
              top: '15px',
              width: '480px',
              height: '600px',
              background: theme.fill,
              border: `0.5px solid ${theme.stroke}`,
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              padding: '36px 32px 32px 32px',
            }}
          >
            {/* Logo */}
            <img
              src={logoDataUri(theme.logo)}
              width="131"
              height="58"
              style={{ marginBottom: '0px' }}
            />

            {/* Pattern — positioned absolutely within card */}
            <div
              style={{
                position: 'absolute',
                left: patSide === 'br' ? '248px' : '32px',
                top: patSide === 'br' ? '320px' : '90px',
                width: '200px',
                height: '200px',
                borderRadius: '8px',
                background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)',
                display: 'flex',
              }}
            >
              <img src={patternUri} width="200" height="200" />
            </div>

            {/* Title — positioned to sit centered vertically */}
            <div
              style={{
                position: 'absolute',
                left: '32px',
                top: '230px',
                width: '416px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {titleLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: theme.text,
                    fontSize: '44px',
                    fontWeight: 600,
                    letterSpacing: '-1px',
                    lineHeight: '52px',
                    fontFamily: 'sans-serif',
                  }}
                >
                  {line}
                </div>
              ))}

              {descLines.length > 0 && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column' }}>
                  {descLines.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        color: theme.sub,
                        fontSize: '16px',
                        lineHeight: '22px',
                        fontFamily: 'sans-serif',
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* URL bottom-right */}
            <div
              style={{
                position: 'absolute',
                right: '32px',
                bottom: '32px',
                color: theme.sub,
                fontSize: '13px',
                letterSpacing: '0.4px',
                fontFamily: 'sans-serif',
              }}
            >
              shopiq.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new Response(`Failed to generate cover: ${e.message}`, { status: 500 });
  }
}
