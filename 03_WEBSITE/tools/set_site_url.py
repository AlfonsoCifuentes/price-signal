#!/usr/bin/env python3
"""Insert the real, verified site URL once a domain exists (never before).

    python tools/set_site_url.py https://price-signal.example.com

Adds canonical + og:url, makes og:image and the JSON-LD download URLs absolute, and writes
robots.txt and sitemap.xml. Re-running with a different URL replaces the previous one.
"""
from pathlib import Path
import re, sys
from datetime import date

SITE = Path(__file__).resolve().parents[1]
if len(sys.argv) != 2 or not re.match(r'^https://[a-z0-9.-]+(/[^\s]*)?$', sys.argv[1]):
    sys.exit(__doc__)
url = sys.argv[1].rstrip('/')
p = SITE / 'index.html'
html = p.read_text(encoding='utf-8')
html = re.sub(r'\s*<link rel="canonical"[^>]*>\s*<meta property="og:url"[^>]*>', '', html)
marker = re.search(r'\s*<!-- SITE_URL_TAGS:.*?-->', html)
tags = f'\n  <link rel="canonical" href="{url}/">\n  <meta property="og:url" content="{url}/">'
if marker:
    html = html[:marker.start()] + tags + html[marker.end():]
else:
    html = html.replace('<meta name="twitter:card"', tags.strip() + '\n  <meta name="twitter:card"', 1)
html = re.sub(r'(<meta property="og:image" content=")[^"]*(og-cover\.png")', rf'\g<1>{url}/public/media/\g<2>', html)
html = re.sub(r'("contentUrl": ")(?:https://[^"]*/)?(public/data/[^"]+")', rf'\g<1>{url}/\g<2>', html)
p.write_text(html, encoding='utf-8', newline='\n')
(SITE / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {url}/sitemap.xml\n', encoding='utf-8', newline='\n')
(SITE / 'sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f'  <url><loc>{url}/</loc><lastmod>{date.today().isoformat()}</lastmod></url>\n</urlset>\n', encoding='utf-8', newline='\n')
print('site URL set to', url)
