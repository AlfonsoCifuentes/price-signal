#!/usr/bin/env python3
"""Export the stills that accompany the four videos into final/stills/.

    python tools/export_media_assets.py

* Remotion stills (one bundle per call): YouTube thumbnails 1280×720, Open Graph cards 1200×630,
  LinkedIn squares 1080×1080 and vertical posters 1080×1920, in English and Spanish.
* Horizontal posters: a frame of each mastered film where the origin is on screen (both cards and the
  «fictional data» stamp), so the poster introduces the case instead of showing a number.
"""
from pathlib import Path
import json, subprocess, sys

HERE = Path(__file__).resolve().parents[1]
REM, OUT = HERE / 'remotion', HERE / 'final' / 'stills'
OUT.mkdir(parents=True, exist_ok=True)
TL = json.loads((REM / 'src' / 'timeline_v3.json').read_text(encoding='utf-8'))
npx = 'npx.cmd' if sys.platform == 'win32' else 'npx'

STILLS = []
for L, l in (('En', 'en'), ('Es', 'es')):
    STILLS += [(f'Thumbnail{L}', f'youtube-thumbnail-{l}.png'), (f'OgCover{L}', f'og-pricing-demo-{l}.png'),
               (f'Square{L}', f'linkedin-square-{l}.png'), (f'VerticalPoster{L}', f'poster-vertical-{l}.png')]
for comp, name in STILLS:
    r = subprocess.run([npx, 'remotion', 'still', 'src/index.ts', comp, str(OUT / name), '--log=error'], cwd=REM, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-600:])
    print('still', name)

for vid in ('horizontal_es', 'horizontal_en'):
    origin = TL[vid]['scenes'][0]
    frame = origin['anchors']['fictional'] + 40
    mp4 = HERE / 'final' / f"pricing-demo-{vid.replace('_', '-')}.mp4"
    png = OUT / f"poster-{vid.replace('_', '-')}.png"
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{frame / 30:.3f}', '-i', str(mp4), '-frames:v', '1', str(png)], check=True)
    print('poster', png.name, 'frame', frame)
