#!/usr/bin/env python3
"""Browser QA for the PRICE / SIGNAL site, both languages (Playwright + axe-core).

    python 07_OPERATIONS_AND_QA/qa_site.py            # local, with the production headers from vercel.json
    python 07_OPERATIONS_AND_QA/qa_site.py https://…  # against a deployed URL (the Spanish page is at …/es/)

Checks, for the English page and the Spanish page (es/): HTTP 200 for every local reference, console/CSP errors,
horizontal overflow at 320–1920 px, keyboard use of the explorer and the register, deferred video loading and playback,
reduced motion, no-JavaScript reading, the language switch, axe-core WCAG 2.2 A/AA.
Screenshots go to 07_OPERATIONS_AND_QA/screenshots/ (English: site_*, Spanish: site_es_*).
Exit code 1 on any failure.
"""
from pathlib import Path
from urllib.parse import urljoin
import asyncio, json, re, sys, threading, http.server, functools, socketserver
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
SITE, OUT = ROOT / '03_WEBSITE', Path(__file__).resolve().parent / 'screenshots'
AXE = Path(__file__).resolve().parent / 'node_modules' / 'axe-core' / 'axe.min.js'
WIDTHS = [320, 390, 768, 1024, 1440, 1920]
results = []

# what differs between the two languages; everything else is the same page
PAGES = {
    'en': dict(path='', prefix='site', lang='en', other=('es/', 'es'),
               film='public/media/price-signal-film.mp4', vtt='public/media/price-signal-film.en.vtt',
               poster='public/media/film-poster.jpg', og='public/media/og-cover.png',
               nojs=('Ten things that', 'Ten things that'), film_label='Watch the video'),
    'es': dict(path='es/', prefix='site_es', lang='es', other=('../', 'en'),
               film='public/media/price-signal-film-es.mp4', vtt='public/media/price-signal-film.es.vtt',
               poster='public/media/film-poster-es.jpg', og='public/media/og-cover-es.png',
               nojs=('Diez cosas que', 'Diez cosas que'), film_label='Ver el vídeo'),
}


def check(ok, name, detail=''):
    results.append((bool(ok), name, detail))


def serve():
    """Static server that applies the header rules from vercel.json, like production."""
    rules = json.loads((SITE / 'vercel.json').read_text(encoding='utf-8'))['headers']

    class H(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def end_headers(self):
            path = self.path.split('?')[0]
            for r in rules:
                pat = '^' + re.sub(r'\(\.\*\)', '.*', r['source'].replace('(data|downloads)', '(?:data|downloads)')) + '$'
                if re.match(pat, path):
                    for h in r['headers']:
                        self.send_header(h['key'], h['value'])
            super().end_headers()

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(H, directory=str(SITE)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return f'http://127.0.0.1:{httpd.server_address[1]}/'


async def run_page(b, base, cfg):
    url = urljoin(base, cfg['path'])
    tag = cfg['lang'].upper()
    OUT.mkdir(exist_ok=True)

    # ---------- every width: overflow, console, screenshots
    for w in WIDTHS:
        ctx = await b.new_context(viewport={'width': w, 'height': 844 if w < 600 else 900}, reduced_motion='reduce')
        pg = await ctx.new_page()
        errs = []
        pg.on('console', lambda m: m.type in ('error', 'warning') and errs.append(m.text))
        pg.on('pageerror', lambda e: errs.append(str(e)))
        bad = []
        pg.on('response', lambda r: r.status >= 400 and bad.append(f'{r.status} {r.url}'))
        await pg.goto(url, wait_until='networkidle')
        await pg.wait_for_selector('#matrix tbody tr')
        ov = await pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
        check(ov == 0, f'[{tag}] {w}px: no horizontal overflow', f'{ov}px')
        check(not errs, f'[{tag}] {w}px: no console errors or CSP violations', '; '.join(errs[:3]))
        check(not bad, f'[{tag}] {w}px: no failed requests', '; '.join(bad[:3]))
        small = await pg.evaluate('''() => [...document.querySelectorAll('a, button, summary')].filter(e => {
            const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 24 && !e.closest('.nav, .files, p, li:not(.files li), td, .legend');
          }).map(e => e.textContent.trim().slice(0, 30))''')
        check(not small, f'[{tag}] {w}px: interactive targets at least 24px tall', ', '.join(small[:5]))
        await pg.screenshot(path=str(OUT / f'{cfg["prefix"]}_{w}_top.png'))
        await pg.screenshot(path=str(OUT / f'{cfg["prefix"]}_{w}_full.png'), full_page=True)
        await ctx.close()

    # ---------- functional checks (desktop, motion allowed)
    ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
    pg = await ctx.new_page()
    await pg.goto(url, wait_until='networkidle')
    await pg.wait_for_selector('#matrix tbody tr')
    check(await pg.evaluate('document.documentElement.lang') == cfg['lang'], f'[{tag}] html lang matches the page language')
    other_href, other_lang = cfg['other']
    sw = await pg.locator(f'.lang a[hreflang="{other_lang}"]').get_attribute('href')
    check(sw == other_href, f'[{tag}] language switch points to the other edition', f'{sw!r}')
    check(await pg.locator('.lang [aria-current="page"]').count() == 1, f'[{tag}] language switch marks the current page')
    # every local href/src resolves
    refs = await pg.evaluate('''() => [...document.querySelectorAll('a[href], link[href], img[src], script[src]')]
        .map(e => e.getAttribute('href') || e.getAttribute('src'))''')
    anchors = [r for r in refs if r.startswith('#')]
    for a in set(anchors):
        check(a == '#' or await pg.locator(a).count() == 1, f'[{tag}] anchor {a} exists')
    # resources named from the site root, requested relative to this page
    extra = [cfg['film'], cfg['vtt'], cfg['poster'], cfg['og'], 'public/data/analysis.json']
    local = sorted({r for r in refs if not r.startswith(('#', 'http', 'mailto'))} | {r if cfg['path'] == '' else '../' + r for r in extra})
    for r in local:
        resp = await pg.request.get(urljoin(url, r))
        check(resp.status == 200, f'[{tag}] GET {r} = 200', str(resp.status))
    ext = [r for r in refs if r.startswith('http')]
    allowed = ('https://github.com/AlfonsoCifuentes', 'https://alfonsocifuentes.vercel.app/',
               'https://www.linkedin.com/in/alfonsocifuentesalonso/')
    check(all(r.startswith(allowed) for r in ext) and len(set(ext)) == len(allowed), f'[{tag}] only verified external links (GitHub, portfolio, LinkedIn)', ', '.join(ext))
    # explorer radio group via keyboard
    before = await pg.locator('#picker [aria-checked="true"]').inner_text()
    await pg.locator('#picker [aria-checked="true"]').focus()
    await pg.keyboard.press('ArrowRight')
    after = await pg.locator('#picker [aria-checked="true"]').inner_text()
    focused = await pg.evaluate('document.activeElement.getAttribute("aria-checked")')
    meta = await pg.locator('#picker-meta').inner_text()
    check(before != after and focused == 'true' and after.split('\n')[0] in meta, f'[{tag}] explorer: arrow keys move selection and update the grid', f'{before!r} → {after!r}')
    await pg.locator('#picker button', has_text='Kindred Horizons').click()
    cells = await pg.locator('#matrix .off').count()
    check(cells >= 1, f'[{tag}] explorer: Kindred Horizons shows the misfiled C1 study pack highlighted', str(cells))
    await pg.locator('#picker button', has_text='Glasshouse English').click()
    moved = await pg.locator('#matrix .moved').all_inner_texts()
    check(any('155' in m and 'Kindred' in m for m in moved), f'[{tag}] explorer: missing cell points to where row 155 was filed', '; '.join(moved))
    # register accordion via keyboard
    first = pg.locator('.register summary').first
    await first.focus()
    await pg.keyboard.press('Enter')
    check(await pg.locator('.register details').first.get_attribute('open') is not None, f'[{tag}] register: Enter opens a finding')
    # charts rendered
    check(await pg.locator('#strip circle').count() == 362, f'[{tag}] strip plot draws 362 dots')
    check(await pg.locator('#multiples .mult').count() == 6, f'[{tag}] six exception small multiples')
    # video loads only on request, then plays
    check(await pg.locator('video').count() == 0, f'[{tag}] film: no video element before the visitor asks')
    await pg.locator('#player-start').click()
    for _ in range(100):
        if await pg.evaluate('!!document.querySelector("video") && document.querySelector("video").readyState >= 2'):
            break
        await pg.wait_for_timeout(200)
    dur = await pg.evaluate('document.querySelector("video").duration')
    tracks = await pg.evaluate('document.querySelector("video").textTracks.length')
    src = await pg.evaluate('document.querySelector("video source").getAttribute("src")')
    tl = json.loads((ROOT / '04_VIDEO_PRODUCTION' / 'remotion' / 'src' / 'timeline.json').read_text(encoding='utf-8'))
    want = tl['film']['frames'] / tl['fps']  # narrated film, length from the timeline
    check(abs(dur - want) < 0.2 and tracks == 1 and src == ('' if cfg['path'] == '' else '../') + cfg['film'],
          f'[{tag}] film: loads on click, {want:.0f} s, one caption track ({src})', f'{dur:.2f}s, {tracks} track, {src}')
    await ctx.close()

    # ---------- reduced motion: nothing hidden
    ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    pg = await ctx.new_page()
    await pg.goto(url, wait_until='networkidle')
    await pg.wait_for_timeout(300)
    op = await pg.evaluate('[...document.querySelectorAll(".h-narrow,.h-wide,.proof-note,.sec h2")].map(e => +getComputedStyle(e).opacity)')
    check(min(op) == 1, f'[{tag}] reduced motion: headings and notes fully visible without animation', str(min(op)))
    await ctx.close()

    # ---------- no JavaScript: the case still reads
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, java_script_enabled=False)
    pg = await ctx.new_page()
    await pg.goto(url)
    text = await pg.inner_text('main')
    vis = await pg.evaluate('+getComputedStyle(document.querySelector(".h-narrow")).opacity')
    head = cfg['nojs'][0]
    check(vis == 1 and '54' in text and '56' in text and head in text, f'[{tag}] no JavaScript: headline, findings and register readable')
    await pg.screenshot(path=str(OUT / f'{cfg["prefix"]}_390_nojs.png'))
    await ctx.close()

    # ---------- axe-core
    for w in (390, 1440):
        ctx = await b.new_context(viewport={'width': w, 'height': 900}, reduced_motion='reduce', bypass_csp=True)  # axe is injected inline
        pg = await ctx.new_page()
        await pg.goto(url, wait_until='networkidle')
        await pg.wait_for_selector('#matrix tbody tr')
        await pg.evaluate('document.querySelectorAll("details").forEach(d => d.open = true)')
        await pg.add_script_tag(content=AXE.read_text(encoding='utf-8'))
        res = await pg.evaluate('''async () => (await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}))
            .violations.map(v => `${v.impact} ${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(' ')}`)''')
        check(not res, f'[{tag}] axe-core WCAG 2.2 AA + best practice at {w}px: 0 violations', ' | '.join(res))
        await ctx.close()


async def main(base):
    async with async_playwright() as p:
        b = None
        for ch in ('chrome', 'msedge'):  # branded builds include the H.264 decoder; Playwright's Chromium does not
            try:
                b = await p.chromium.launch(channel=ch)
                break
            except Exception:
                pass
        b = b or await p.chromium.launch()
        check(True, f'browser: {b.browser_type.name} {b.version}')
        for cfg in PAGES.values():
            await run_page(b, base, cfg)
        await b.close()


base = sys.argv[1] if len(sys.argv) > 1 else serve()
asyncio.run(main(base))
fails = [r for r in results if not r[0]]
print(f'SITE QA ({base}) — {len(results) - len(fails)} passed, {len(fails)} failed')
for ok, name, detail in results:
    print('PASS' if ok else 'FAIL', name, f'[{detail}]' if detail and not ok else '')
sys.exit(1 if fails else 0)
