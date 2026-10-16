#!/usr/bin/env python3
"""Copy public data, documents and media into the site and keep every bound value in both pages true.

    python tools/sync_site_data.py           # copy files, rewrite bound values in index.html and es/index.html
    python tools/sync_site_data.py --check   # change nothing; exit 1 if any value or file is stale

Bound values:
  <b data-k="headline.consistent">54</b>, optionally data-f="eur|eurneg|pct1|pctp|dur", formatted per page language
  (English: €44.04, 90.0%; Spanish: 44,04 €, 90,0 %). media.<video> keys are the real durations of the delivered MP4s.
  <span data-size="public/downloads/x.pdf">250 KB</span> is the real size of that file.
"""
from pathlib import Path
import json, re, sys, shutil, hashlib, subprocess, tempfile

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
DATA, PRES, FILM = ROOT / '02_PUBLIC_CASE_STUDY', ROOT / '05_PRESENTATIONS', ROOT / '04_VIDEO_PRODUCTION'
CHECK = '--check' in sys.argv
VIDEOS = ('horizontal_es', 'horizontal_en', 'vertical_es', 'vertical_en')

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


def fmt(v, f, es):
    dec = (lambda x: x.replace(',', ' ').replace('.', ',').replace(' ', '.')) if es else (lambda x: x)
    if f == 'eur':
        return f'{dec(f"{v:,.2f}")} €' if es else f'€{v:,.2f}'
    if f == 'eurneg':
        sign = '−' if v < 0 else '+'
        return f'{sign}{dec(f"{abs(v):,.2f}")} €' if es else f'{sign}€{abs(v):,.2f}'
    if f == 'pct1':
        return f'{dec(f"{v:.1f}")} %' if es else f'{v:.1f}%'
    if f == 'pctp':
        sign = '+' if v >= 0 else '−'
        return f'{sign}{dec(f"{abs(v):.1f}")} %' if es else f'{sign}{abs(v):.1f}%'
    if f == 'dur':
        s = int(round(v))
        return f'{s // 60}:{s % 60:02d}'
    return f'{v:,}'.replace(',', '.' if es else ',') if isinstance(v, int) else str(v)


def size(n, es):
    if n < 1024 * 1024:
        return f'{max(1, round(n / 1024))} KB'
    t = f'{n / 1024 / 1024:.1f}'
    return f'{t.replace(".", ",") if es else t} MB'


COPIES = {
    DATA / 'public_summary.json': SITE / 'public/data/summary.json',
    DATA / 'public_findings.json': SITE / 'public/data/challenges.json',
    DATA / 'public_enriched_catalogue.csv': SITE / 'public/data/catalogue.csv',
    DATA / 'public_raw_catalogue.csv': SITE / 'public/data/catalogue_raw.csv',
}
for name in ('Pricing_Demo_Analysis_Workbook.xlsx', 'Pricing_Demo_Case_Study_EN.pdf', 'Pricing_Demo_Caso_de_Estudio_ES.pdf',
             'Pricing_Demo_Case_Study_EN.pptx', 'Pricing_Demo_Caso_de_Estudio_ES.pptx'):
    COPIES[PRES / name] = SITE / 'public/downloads' / name
for v in VIDEOS:
    slug = v.replace('_', '-')
    COPIES[FILM / 'final' / f'pricing-demo-{slug}.mp4'] = SITE / f'public/media/pricing-demo-{slug}.mp4'
    COPIES[FILM / 'subtitles' / f'{v}.vtt'] = SITE / f'public/media/pricing-demo-{slug}.vtt'
# stills are converted to JPEG for the posters (smaller), Open Graph cards stay PNG
STILLS = FILM / 'final' / 'stills'
JPEGS = {STILLS / f'poster-{k}.png': SITE / f'public/media/poster-{k}.jpg' for k in ('horizontal-es', 'horizontal-en', 'vertical-es', 'vertical-en')}
for l in ('en', 'es'):
    COPIES[STILLS / f'og-pricing-demo-{l}.png'] = SITE / f'public/media/og-pricing-demo-{l}.png'
KEEP_MEDIA = {'favicon.svg'}

problems = []
for src, dst in JPEGS.items():
    if not src.exists():
        if not dst.exists():  # renders and stills aren't versioned; in the public repo the site copy is the reference
            problems.append(f'missing source {src.relative_to(ROOT)}')
        continue
    with tempfile.TemporaryDirectory() as tmp:
        fresh = Path(tmp) / dst.name
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-q:v', '3', str(fresh)], check=True)
        if not dst.exists() or dst.read_bytes() != fresh.read_bytes():
            if CHECK:
                problems.append(f'stale {dst.relative_to(SITE)}')
            else:
                shutil.copyfile(fresh, dst)
for src, dst in COPIES.items():
    if not src.exists():
        if not (dst.exists() and FILM in src.parents):
            problems.append(f'missing source {src.relative_to(ROOT)}')
        continue
    if not (dst.exists() and hashlib.sha256(src.read_bytes()).digest() == hashlib.sha256(dst.read_bytes()).digest()):
        if CHECK:
            problems.append(f'stale copy {dst.relative_to(SITE)}')
        else:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, dst)

# anything else in media/ or downloads/ is a leftover of the old brand or an old cut
wanted = {d.resolve() for d in list(COPIES.values()) + list(JPEGS.values())}
for folder in ('public/media', 'public/downloads'):
    for f in (SITE / folder).iterdir():
        if f.name in KEEP_MEDIA or f.resolve() in wanted:
            continue
        if CHECK:
            problems.append(f'unexpected file {f.relative_to(SITE)}')
        else:
            f.unlink()
            print('removed', f.relative_to(SITE))

compact = json.dumps(A, ensure_ascii=False, separators=(',', ':'))
target = SITE / 'public/data/analysis.json'
if not target.exists() or target.read_text(encoding='utf-8') != compact:
    if CHECK:
        problems.append('stale public/data/analysis.json')
    else:
        target.write_text(compact, encoding='utf-8', newline='\n')

for v in VIDEOS:
    mp4 = SITE / f"public/media/pricing-demo-{v.replace('_', '-')}.mp4"
    if mp4.exists():
        out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(mp4)], capture_output=True, text=True).stdout
        VALUES[f'media.{v}'] = float(out)

K = re.compile(r'(<(\w+)\b[^>]*\bdata-k="([^"]+)"(?:[^>]*\bdata-f="([^"]+)")?[^>]*>)([^<]*)(</\2>)')
S = re.compile(r'(<span data-size="([^"]+)">)([^<]*)(</span>)')
seen = 0
for html_path in (SITE / 'index.html', SITE / 'es/index.html'):
    es = html_path.parent.name == 'es'
    html = html_path.read_text(encoding='utf-8')

    def sub(m):
        global seen
        key, f, cur = m.group(3), m.group(4), m.group(5)
        if key not in VALUES:
            problems.append(f'unknown data-k "{key}"')
            return m.group(0)
        seen += 1
        want = fmt(VALUES[key], f, es)
        if cur != want and CHECK:
            problems.append(f'{html_path.relative_to(SITE)} {key}: page says "{cur}", data says "{want}"')
        return m.group(1) + want + m.group(6)

    def sub_size(m):
        global seen
        f = SITE / m.group(2)
        if not f.exists():
            problems.append(f'data-size points to missing {m.group(2)}')
            return m.group(0)
        seen += 1
        want = size(f.stat().st_size, es)
        if m.group(3) != want and CHECK:
            problems.append(f'{html_path.relative_to(SITE)} size of {m.group(2)}: page says "{m.group(3)}", file is "{want}"')
        return m.group(1) + want + m.group(4)

    new = S.sub(sub_size, K.sub(sub, html))
    # every local link and asset the page references must exist
    for ref in re.findall(r'(?:href|src|data-video|data-poster|data-vtt)="([^"#:]+)"', new):
        if ref.endswith('/') or ref.startswith('mailto'):
            continue
        base = html_path.parent
        if ref.startswith('pricing-demo-') or ref.startswith('poster-'):
            base = SITE / 'public/media'
        if not (base / ref).resolve().exists():
            problems.append(f'{html_path.relative_to(SITE)} references missing {ref}')
    if not CHECK and new != html:
        html_path.write_text(new, encoding='utf-8', newline='\n')
print(f'{seen} bound values checked on both pages, {len(COPIES) + len(JPEGS) + 1} data/document/media files {"verified" if CHECK else "synced"}')
for p in problems:
    print('FAIL', p)
sys.exit(1 if problems else 0)
