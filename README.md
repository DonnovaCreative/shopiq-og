# shopiq-og

Open Graph image generator for shopiq guides. Renders branded ebook covers
as PNG at the edge.

## What this does

Endpoint: `/api/cover?slug=...&title=...&desc=...`

Returns a 1200×630 PNG that visually matches your inline Webflow cover.
Same slug always produces the same image (deterministic seed). Cached for
a year — first request takes ~300ms, subsequent requests are instant CDN
hits.

## Project structure

```
shopiq-og/
├── api/
│   └── cover.jsx       # The edge function — does all the work
├── package.json        # @vercel/og dependency
├── vercel.json         # Caching headers
└── README.md
```

## Deploy

Two options. Pick whichever feels less painful.

### Option 1: GitHub + Vercel UI (recommended)

1. Create a new GitHub repo called `shopiq-og`
2. Initialize locally:
   ```bash
   cd shopiq-og
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin git@github.com:YOUR_GH_USERNAME/shopiq-og.git
   git push -u origin main
   ```
3. Go to https://vercel.com/new
4. Import the `shopiq-og` repo
5. Click Deploy. No env vars needed.
6. After deploy, you'll get a URL like `https://shopiq-og.vercel.app`

### Option 2: Vercel CLI

```bash
npm install -g vercel
cd shopiq-og
vercel
# answer the prompts (yes to setup, accept defaults)
vercel --prod
```

## Test the endpoint

Once deployed, hit it in a browser:

```
https://YOUR-DEPLOYMENT-URL.vercel.app/api/cover?slug=test&title=The%20Ultimate%20Guide%20to%20Direct%20Selling&desc=Explore%20the%20essentials%20of%20direct%20selling
```

You should see a PNG cover identical in style to your inline Webflow cover.

Try a few different slugs — each should produce a different-looking cover
because the slug seeds the random generator.

## Wire it up in Webflow

See `3-webflow-og-setup.html` for the step-by-step. TL;DR:

In your Guide CMS template's Page Settings → Open Graph → Image URL:

```
https://YOUR-DEPLOYMENT-URL.vercel.app/api/cover?slug={{slug}}&title={{name}}&desc={{subtitle}}
```

Bind the placeholders to CMS fields. Publish. Done.

## Verify it's working

Test with these tools after publishing a guide post:

- **OpenGraph.xyz** — https://www.opengraph.xyz/
  Paste your guide URL, see the rendered preview as if shared.
- **Twitter Card Validator** — https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector** — https://www.linkedin.com/post-inspector/
  Important: LinkedIn caches aggressively. If you update an OG image for
  an existing post, you have to force a refresh here.

## Differences vs. the inline Webflow cover

The OG endpoint produces a visually equivalent cover with two technical
differences worth knowing:

1. **No Gaussian blur.** Satori (the renderer) doesn't support
   feGaussianBlur. The aurora effect is recreated using overlapping
   radial gradients, which look near-identical at OG scale but use
   different machinery.

2. **No system fonts.** Edge runtimes don't have system fonts available.
   This deployment uses the default Satori sans-serif. If you want to
   embed a specific brand font (e.g. Inter), drop a `.woff2` file in a
   `fonts/` folder and load it with `fetch()` at the top of `cover.jsx`.
   Doc: https://vercel.com/docs/og-image-generation/og-image-examples#using-a-custom-font

## Cost

This endpoint is essentially free at any reasonable shopiq scale.

- Vercel Hobby tier: 100 GB-hours of edge function invocations / month
- An OG image generation = ~50ms = 0.014 GB-hours
- That's ~7 million generations / month before you hit the limit
- Cached responses don't count

You will not pay for this until shopiq is enormous.

## When you migrate to Next.js

This entire project becomes one route file in your Next.js app:
`app/api/cover/route.jsx` with the same code. The endpoint URL changes
from `shopiq-og.vercel.app/api/cover` to `shopiq.com/api/cover`, and
you can delete this standalone repo.

For now, keeping it separate means it works with Webflow today without
disturbing your future Next.js plans.

## Adding a custom subdomain later

When you're ready for `og.shopiq.com`:

1. Vercel Dashboard → your shopiq-og project → Settings → Domains
2. Add `og.shopiq.com`
3. Vercel shows you a CNAME record to add in your DNS provider
4. Add it, wait a few minutes, done
5. Update the Webflow OG image URL to use `og.shopiq.com`

About 5 minutes of work when you're ready.
