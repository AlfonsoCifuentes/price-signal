#!/usr/bin/env python3
"""Copy the public analysis + site fonts into the Remotion project and rebuild the timeline.
The film never reads private material: its only data input is public_analysis.json."""
from pathlib import Path
import json, shutil, subprocess, sys

HERE = Path(__file__).resolve().parents[1]
ROOT = HERE.parent
REM = HERE / 'remotion'
a = json.loads((ROOT / '02_PUBLIC_CASE_STUDY' / 'public_analysis.json').read_text(encoding='utf-8'))
slim = {k: a[k] for k in ('headline', 'exceptions', 'starter', 'type_stats')}
slim['traps'] = {k: a['traps'][k] for k in ('series_mismatch', 'split_volumes', 'tb_outlier', 'answer_support', 'ebook_substring')}
slim['series'] = [{'series': s['series'], 'records': s['records'], 'level_system': s['level_system']} for s in a['explorer']]
(REM / 'src' / 'data.json').write_text(json.dumps(slim, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
fonts = REM / 'public' / 'fonts'
fonts.mkdir(parents=True, exist_ok=True)
for f in (ROOT / '03_WEBSITE' / 'public' / 'fonts').glob('*.woff2'):
    shutil.copyfile(f, fonts / f.name)
subprocess.run([sys.executable, str(HERE / 'tools' / 'build_timeline.py')], check=True)
print('film data synced')
