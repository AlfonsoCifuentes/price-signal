#!/usr/bin/env python3
"""Re-take one scene until the listening check is clean (no inserted, repeated or missing words).

    EL_KEY=... python tools/retake.py horizontal_es problem [--max 4]

Increments the scene's "take" (a new seed for the same sentence), generates it with narrate.py and checks it
with voice_qc.py. Differences that are only spelling (digits vs words, catalog/catalogue) do not count.
Stops at the first clean take; otherwise leaves the take with the lowest word error rate.
"""
from pathlib import Path
import json, subprocess, sys

HERE = Path(__file__).resolve().parents[1]
video, scene = sys.argv[1], sys.argv[2]
limit = int(sys.argv[sys.argv.index('--max') + 1]) if '--max' in sys.argv else 4
script_path = HERE / 'scripts' / f'{video}.json'
sys.path.insert(0, str(HERE / 'tools'))
from voice_qc import blocking  # noqa: E402


def run(*args):
    subprocess.run([sys.executable, *args], cwd=HERE, check=True)


best = None
for _ in range(limit):
    run('tools/narrate.py', '--only', video, '--scenes', scene)
    run('tools/voice_qc.py', '--only', video, '--scenes', scene)
    r = json.loads((HERE / 'narration' / 'voice_qc.json').read_text(encoding='utf-8'))[f'{video}/{scene}']
    d = json.loads(script_path.read_text(encoding='utf-8'))
    s = next(x for x in d['scenes'] if x['id'] == scene)
    take = int(s.get('take', 1))
    if best is None or r['wer'] < best[1]:
        best = (take, r['wer'])
    if not blocking(r['differences']):
        print(f'{video}/{scene}: take {take} is clean')
        break
    print(f'{video}/{scene}: take {take} blocked by {blocking(r["differences"])}')
    s['take'] = take + 1
    script_path.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
else:
    d = json.loads(script_path.read_text(encoding='utf-8'))
    s = next(x for x in d['scenes'] if x['id'] == scene)
    s['take'] = best[0]
    if best[0] == 1:
        s.pop('take')
    script_path.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'{video}/{scene}: no clean take in {limit}; kept take {best[0]} (WER {best[1]})')
    sys.exit(2)
