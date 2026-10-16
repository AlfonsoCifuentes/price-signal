# Pricing Demo — website

Static site: `index.html`, `styles.css`, `site.js`, with no build step, no framework, no third-party requests, cookies or trackers. Fonts (Archivo, Martian Mono; SIL OFL, licences in `public/fonts/`) are self-hosted.

Every number in the page is written into the HTML, so the case reads without JavaScript and search engines see it. Each one is bound to `public/data/analysis.json` with a `data-k` attribute. JavaScript adds the interactive parts: strip plot, series explorer (with the as-recorded / reporting-view switch), exception small multiples and the two deferred video players. Spanish numbers use the es-ES format (44,04 €, 90,0 %).

## Run locally

```bash
python -m http.server 8000      # from this folder, then open http://localhost:8000
```

## Keep it in sync with the data

```bash
python tools/sync_site_data.py           # copies data, downloads and media; rewrites bound numbers
python tools/sync_site_data.py --check   # changes nothing; fails if anything is stale
```

## Deploy (Vercel, static)

Project root: this folder. Framework preset: *Other*. No build command; output directory `.`. `vercel.json` sets security headers (strict CSP, no framing) and caching; `.vercelignore` keeps `tools/` out of the deployment.

Canonical, hreflang (en, es, x-default), og:url and og:image are absolute and point to https://pricingdemo-alfonsocifuentes.vercel.app/. `robots.txt` and `sitemap.xml` list both editions. Old URLs from the earlier brand (media and documents) are redirected in `vercel.json`.

## Accessibility and motion

Skip link, landmark structure, keyboard-operable explorer (radio group with arrow keys) and register (`<details>`), visible focus, text alternatives for every chart, and `prefers-reduced-motion` support. The videos load only when the visitor presses play (never autoplay) and ship with caption tracks; the labels show the real durations, written by the sync tool from the MP4 files.
