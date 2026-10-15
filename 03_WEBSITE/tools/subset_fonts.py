#!/usr/bin/env python3
"""Subset the site's web fonts to the characters and axis ranges the page actually uses.

    python tools/subset_fonts.py           # write public/fonts/*.woff2 from the full masters
    python tools/subset_fonts.py --check   # fail if any character on the page has no glyph

Masters: 04_VIDEO_PRODUCTION/remotion/public/fonts/ (full Google Fonts "latin" builds, SIL OFL 1.1,
no Reserved Font Name, so a subset may keep the family name). The film keeps the masters.
Requires: pip install fonttools brotli
"""
from pathlib import Path
import re, sys, json
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SITE = Path(__file__).resolve().parents[1]
MASTERS = SITE.parent / '04_VIDEO_PRODUCTION' / 'remotion' / 'public' / 'fonts'
OUT = SITE / 'public' / 'fonts'
CHECK = '--check' in sys.argv

# axis ranges used by styles.css (font-weight / font-stretch); defaults stay inside each range
FONTS = {
    'archivo-latin-wdth-normal.woff2': {'wght': (300, 600, 900), 'wdth': (62, 100, 125)},
    'martian-mono-latin-wdth-normal.woff2': {'wght': (400, 400, 700)},
}
FEATURES = ['kern', 'liga', 'calt', 'ccmp', 'locl', 'rvrn', 'tnum', 'pnum', 'mark', 'mkmk']


def page_text():
    """Every character the page can render: markup, script strings, CSS content, data."""
    # Latin-1 in full, so Spanish accents (á é í ó ú ñ ü ¿ ¡ « »), and anything else a translation needs, are never missing
    text = ''.join(chr(c) for c in list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)))
    text += '“”‘’—–…€−→≠×✓'
    for page in ('index.html', 'es/index.html'):  # both languages must render from the same subset
        html = (SITE / page).read_text(encoding='utf-8')
        html = re.sub(r'<script type="application/ld\+json">.*?</script>', '', html, flags=re.S)
        text += re.sub(r'&[a-z]+;', '', html)
    text += (SITE / 'site.js').read_text(encoding='utf-8')
    text += ''.join(re.findall(r'content:\s*"([^"]*)"', (SITE / 'styles.css').read_text(encoding='utf-8')))
    A = json.loads((SITE / 'public' / 'data' / 'analysis.json').read_text(encoding='utf-8'))
    text += json.dumps(A, ensure_ascii=False)
    return {c for c in text if ord(c) >= 0x20}


chars = page_text()
problems = []
for name, axes in FONTS.items():
    if CHECK:
        master, cmap = TTFont(MASTERS / name).getBestCmap(), TTFont(OUT / name).getBestCmap()
        lost = sorted(c for c in chars if ord(c) in master and ord(c) not in cmap)
        if lost:
            problems.append(f'{name}: subset dropped {ascii("".join(lost))}')
        gaps = sorted(c for c in chars if ord(c) not in master and not c.isspace())
        if gaps:  # the family never had these; the CSS fallback stack draws them
            print(f'note {name}: not in the master either {ascii("".join(gaps))}')
        continue
    font = TTFont(MASTERS / name, lazy=False)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = FEATURES
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    opts.drop_tables += ['DSIG']
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=[ord(c) for c in chars])
    sub.subset(font)
    font = instancer.instantiateVariableFont(font, axes)  # after subsetting: fewer glyph deltas to rewrite
    font.flavor = 'woff2'
    font.save(OUT / name)
    print(f'{name}: {(MASTERS / name).stat().st_size / 1024:.0f} KB -> {(OUT / name).stat().st_size / 1024:.0f} KB')

if CHECK:
    print(f'{len(chars)} characters checked against {len(FONTS)} fonts')
    for p in problems:
        print('FAIL', p)
    sys.exit(1 if problems else 0)
