#!/usr/bin/env python3
"""Copy public data + downloads into the site and keep every bound number in index.html true.

    python tools/sync_site_data.py           # copy files, rewrite data-k values in index.html
    python tools/sync_site_data.py --check   # change nothing; exit 1 if any value or file is stale

A bound number looks like <b data-k="headline.consistent">54</b>, optionally with data-f="eur|pct1|pctp|eurneg".
"""
from pathlib import Path
import json, re, sys, shutil, hashlib

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
DATA, PRES = ROOT / '02_PUBLIC_CASE_STUDY', ROOT / '05_PRESENTATIONS'
CHECK = '--check' in sys.argv

A = json.loads((DATA / 'public_analysis.json').read_text(encoding='utf-8'))
T = A['traps']
VALUES = {f'headline.{k}': v for k, v in A['headline'].items()}
VALUES.update({f'type.{t["type"]}.mean': t['mean'] for t in A['type_stats']})
for s in T['split_volumes']:
    VALUES.update({f'split.{s["series"]}.{k}': v for k, v in s.items() if k != 'series'})
for i, s in enumerate(A['starter']):
    VALUES.update({f'starter.{i}.{k}': v for k, v in s.items()})
VALUES.update({
    'traps.ebook_naive': len(T['ebook_substring']['naive_hits']),
    'traps.ebook_bounded': len(T['ebook_substring']['word_boundary_hits']),
    'traps.answer_parity': T['answer_support']['parity'],
    'traps.answer_pairs': T['answer_support']['pairs'],
    'traps.series_mismatch': len(T['series_mismatch']),
    'trap.tb_price': T['tb_outlier']['price'],
    'trap.access_stated': T['access_duration']['stated_18_months'],
    'trap.access_total': T['access_duration']['digital_workbooks'],
})


def fmt(v, f):
    if f == 'eur':
        return f'€{v:,.2f}'
    if f == 'eurneg':
        return ('−' if v < 0 else '+') + f'€{abs(v):,.2f}'
    if f == 'pct1':
        return f'{v:.1f}%'
    if f == 'pctp':
        return f'+{v:.1f}%' if v >= 0 else f'−{abs(v):.1f}%'
    return f'{v:,}' if isinstance(v, int) else str(v)


COPIES = {
    DATA / 'public_summary.json': SITE / 'public/data/summary.json',
    DATA / 'public_findings.json': SITE / 'public/data/challenges.json',
    DATA / 'public_enriched_catalogue.csv': SITE / 'public/data/catalogue.csv',
    DATA / 'public_raw_catalogue.csv': SITE / 'public/data/catalogue_raw.csv',
    PRES / 'PRICE_SIGNAL_Independent_Synthetic_Analysis.xlsx': SITE / 'public/downloads/PRICE_SIGNAL_Independent_Synthetic_Analysis.xlsx',
    PRES / 'PRICE_SIGNAL_Public_Case_EN.pdf': SITE / 'public/downloads/PRICE_SIGNAL_Public_Case_EN.pdf',
    PRES / 'PRICE_SIGNAL_Caso_Publico_ES.pdf': SITE / 'public/downloads/PRICE_SIGNAL_Caso_Publico_ES.pdf',
    PRES / 'PRICE_SIGNAL_Public_Case_EN.pptx': SITE / 'public/downloads/PRICE_SIGNAL_Public_Case_EN.pptx',
}
FILM = ROOT / '04_VIDEO_PRODUCTION'


def render(name):
    """The narrated render wins once it exists, so a later sync never puts the silent cut back."""
    voiced = FILM / 'remotion/out' / name.replace('.mp4', '-voice.mp4')
    return voiced if voiced.exists() else FILM / 'remotion/out' / name


COPIES.update({
    render('price-signal-film.mp4'): SITE / 'public/media/price-signal-film.mp4',
    render('price-signal-vertical.mp4'): SITE / 'public/media/price-signal-vertical.mp4',
    FILM / 'remotion/out/og-cover.png': SITE / 'public/media/og-cover.png',
    FILM / 'captions/price-signal-film.en.vtt': SITE / 'public/media/price-signal-film.en.vtt',
    # Spanish edition: same cut and timing, Spanish on-screen text and captions
    FILM / 'remotion/out/price-signal-film-es.mp4': SITE / 'public/media/price-signal-film-es.mp4',
    FILM / 'remotion/out/price-signal-vertical-es.mp4': SITE / 'public/media/price-signal-vertical-es.mp4',
    FILM / 'remotion/out/og-cover-es.png': SITE / 'public/media/og-cover-es.png',
    FILM / 'captions/price-signal-film.es.vtt': SITE / 'public/media/price-signal-film.es.vtt',
    # documents: every downloadable exists in both languages
    PRES / 'PRICE_SIGNAL_Caso_Publico_ES.pptx': SITE / 'public/downloads/PRICE_SIGNAL_Caso_Publico_ES.pptx',
    PRES / 'documents/Alfonso-Cifuentes-CV-EN.pdf': SITE / 'public/downloads/Alfonso-Cifuentes-CV-EN.pdf',
    PRES / 'documents/Alfonso-Cifuentes-Cover-Letter-EN.pdf': SITE / 'public/downloads/Alfonso-Cifuentes-Cover-Letter-EN.pdf',
    ROOT / 'ALFONSO CIFUENTES ALONSO - Data & AI, Business Intelligence.pdf': SITE / 'public/downloads/Alfonso-Cifuentes-CV-ES.pdf',
    ROOT / 'Alfonso Cifuentes - Carta de presentacion.pdf': SITE / 'public/downloads/Alfonso-Cifuentes-Carta-ES.pdf',
})
# the Spanish poster is a still of the Spanish film, converted the same way as the English one
POSTERS = {FILM / 'remotion/out/film-poster-es.png': SITE / 'public/media/film-poster-es.jpg'}
problems = []
POSTERS[FILM / 'remotion/out/film-poster.png'] = SITE / 'public/media/film-poster.jpg'
for poster_src, poster in POSTERS.items():
    if poster_src.exists():
        # Compare bytes, not mtimes: unzipping or copying can reorder timestamps without changing content.
        # The ffmpeg conversion is deterministic (same bytes on every run), so a fresh conversion is the reference.
        import subprocess, tempfile
        with tempfile.TemporaryDirectory() as tmp:
            fresh = Path(tmp) / poster.name
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(poster_src), '-q:v', '3', str(fresh)], check=True)
            if not poster.exists() or poster.read_bytes() != fresh.read_bytes():
                if CHECK:
                    problems.append(f'stale public/media/{poster.name}')
                else:
                    shutil.copyfile(fresh, poster)
for src, dst in COPIES.items():
    if not src.exists():
        if dst.exists() and FILM in src.parents:
            continue  # renders aren't versioned; the published copy in the site is the reference
        problems.append(f'missing source {src.relative_to(ROOT)}')
        continue
    same = dst.exists() and hashlib.sha256(src.read_bytes()).digest() == hashlib.sha256(dst.read_bytes()).digest()
    if not same:
        if CHECK:
            problems.append(f'stale copy {dst.relative_to(SITE)}')
        else:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, dst)

compact = json.dumps(A, ensure_ascii=False, separators=(',', ':'))
target = SITE / 'public/data/analysis.json'
if not target.exists() or target.read_text(encoding='utf-8') != compact:
    if CHECK:
        problems.append('stale public/data/analysis.json')
    else:
        target.write_text(compact, encoding='utf-8', newline='\n')

pat =re.compile(r'(<(\w+)\b[^>]*\bdata-k="([^"]+)"(?:[^>]*\bdata-f="([^"]+)")?[^>]*>)([^<]*)(</\2>)')
seen = 0


def sub(m):
    global seen
    key, f, cur = m.group(3), m.group(4), m.group(5)
    if key not in VALUES:
        problems.append(f'unknown data-k "{key}"')
        return m.group(0)
    seen += 1
    want = fmt(VALUES[key], f)
    if cur != want:
        problems.append(f'{key}: page says "{cur}", data says "{want}"') if CHECK else None
    return m.group(1) + want + m.group(6)


for html_path in (SITE / 'index.html', SITE / 'es/index.html'):  # both languages bind the same numbers
    html = html_path.read_text(encoding='utf-8')
    new = pat.sub(sub, html)
    if not CHECK and new != html:
        html_path.write_text(new, encoding='utf-8', newline='\n')
print(f'{seen} bound values checked on both pages, {len(COPIES) + 1} data/download files {"verified" if CHECK else "synced"}')
for p in problems:
    print('FAIL', p)
sys.exit(1 if problems else 0)
