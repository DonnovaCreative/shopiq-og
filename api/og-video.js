// api/og-video.js
// Edge function that returns the right OG image for a video post.
// Logic mirrors the Webflow CMS schema:
//   - override-video-thumbnail (Bool) + custom-thumbnail (Image): editor's override wins
//   - video-source (Option: "YouTube" | "Vimeo") + video-id (PlainText): resolve from platform
//   - fallback: static brand image

export const config = {
  runtime: 'edge',
};

const FALLBACK_IMAGE = 'https://cdn.prod.website-files.com/68712201eff36d5a054b7791/695b3fd459f0a3332bea09ea_shopiq-primary-og.png';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const source = (searchParams.get('source') || '').toLowerCase();
  const id = searchParams.get('id');
  const override = isTruthy(searchParams.get('override'));
  const customUrl = searchParams.get('custom');

  try {
    // 1. Editor flagged the override AND uploaded an image — use it
    if (override && customUrl) {
      return redirectTo(customUrl);
    }

    // 2. Resolve from video source
    if (id && isValidId(id)) {
      if (source === 'youtube') {
        return redirectTo(await resolveYouTubeThumb(id));
      }
      if (source === 'vimeo') {
        const vimeoUrl = await resolveVimeoThumb(id);
        if (vimeoUrl) return redirectTo(vimeoUrl);
      }
    }

    // 3. Fallback
    return redirectTo(FALLBACK_IMAGE);
  } catch (err) {
    // Never 500 on a crawler — always return something
    return redirectTo(FALLBACK_IMAGE);
  }
}

function redirectTo(url) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      ...CACHE_HEADERS,
    },
  });
}

function isTruthy(val) {
  if (!val) return false;
  const v = val.toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

// Basic safety: alphanumerics, dashes, underscores only, reasonable length
function isValidId(id) {
  return /^[a-zA-Z0-9_-]{1,32}$/.test(id);
}

async function resolveYouTubeThumb(id) {
  // YouTube returns 200 with a tiny placeholder when maxresdefault doesn't exist.
  // Detect via content-length: real thumbs are ~50KB+, placeholders are ~1-2KB.
  const maxres = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  const hq = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  try {
    const res = await fetch(maxres, { method: 'HEAD' });
    const len = parseInt(res.headers.get('content-length') || '0', 10);
    if (res.ok && len > 5000) return maxres;
  } catch {
    // fall through to hqdefault
  }
  return hq;
}

async function resolveVimeoThumb(id) {
  const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`;
  const res = await fetch(oembedUrl, {
    headers: { 'User-Agent': 'shopiq-og/1.0' },
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.thumbnail_url) return null;

  // Strip size suffix (e.g. _1280x720) to get the original full-size image
  return data.thumbnail_url.replace(/_\d+x\d+(?=\.\w+$)/, '');
}