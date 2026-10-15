# PRICE / SIGNAL — website

Static site: `index.html`, `styles.css`, `site.js`, with no build step, no framework, no third-party requests, cookies or trackers. Fonts (Archivo, Martian Mono; SIL OFL, licences in `public/fonts/`) are self-hosted.

Every number in the page is written into the HTML, so the case reads without JavaScript and search engines see it. Each one is bound to `public/data/analysis.json` with a `data-k` attribute. JavaScript adds the interactive parts: strip plot, series explorer, exception small multiples and the deferred video player.

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

Once a real domain exists:

```bash
python tools/set_site_url.py https://your-domain.example   # canonical, og:url, absolute og:image, robots.txt, sitemap.xml
```

## Accessibility and motion

Skip link, landmark structure, keyboard-operable explorer (radio group with arrow keys) and register (`<details>`), visible focus, text alternatives for every chart, and `prefers-reduced-motion` support. The film loads only when the visitor presses play and ships with a captions track.
