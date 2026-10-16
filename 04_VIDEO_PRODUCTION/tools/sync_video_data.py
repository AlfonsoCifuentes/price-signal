#!/usr/bin/env python3
"""Copy what the four videos show from the public analysis into remotion/src/v3/data.json, plus the site fonts.

    python tools/sync_video_data.py

The videos never read private material: their only data input is 02_PUBLIC_CASE_STUDY/public_analysis.json.
Every number on screen comes from this file, so a change in the analysis reaches the videos on the next render.
"""
from pathlib import Path
import json, shutil

HERE = Path(__file__).resolve().parents[1]
ROOT = HERE.parent
REM = HERE / 'remotion'
a = json.loads((ROOT / '02_PUBLIC_CASE_STUDY' / 'public_analysis.json').read_text(encoding='utf-8'))
t = a['traps']
slim = {
    'headline': a['headline'],
    'exceptions': a['exceptions'],
    'starter': a['starter'],
    'traps': {k: t[k] for k in ('series_mismatch', 'split_volumes', 'split_volume_levels', 'tb_outlier', 'ebook_substring',
                                 'edition_alias', 'access_duration', 'answer_support')},
    'series': [{'series': s['series'], 'records': s['records'], 'level_system': s['level_system']} for s in a['explorer']],
    # the three series the root-cause scenes walk through, cell by cell
    'focus': {s['series']: {'levels': s['levels'], 'lines': s['lines']} for s in a['explorer']
              if s['series'] in ('Glasshouse English', 'Mosaic English', 'Kindred Horizons')},
}
out = REM / 'src' / 'v3' / 'data.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(slim, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
fonts = REM / 'public' / 'fonts'
fonts.mkdir(parents=True, exist_ok=True)
for f in (ROOT / '03_WEBSITE' / 'public' / 'fonts').glob('*.woff2'):
    shutil.copyfile(f, fonts / f.name)
print('video data synced:', out.relative_to(HERE))
