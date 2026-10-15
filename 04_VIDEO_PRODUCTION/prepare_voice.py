#!/usr/bin/env python3
"""Prepare the author's own recorded narration for Remotion (requires ffmpeg).

Record one take per scene, as SCRIPT_EN_RECORD_THIS.md suggests, and name the files so they sort
in scene order, e.g. 01.wav ... 13.wav for the film and v01.wav ... v05.wav for the vertical cut
(any audio format ffmpeg reads: wav, m4a, mp3...). Then:

    python prepare_voice.py path/to/takes            # film takes 01-13 and/or vertical takes v01-v05
    python tools/build_timeline.py                   # re-time scenes + captions to the takes
    cd remotion && npm run render:film-voice && npm run render:vertical-voice

Each take is converted to 48 kHz mono WAV, leading/trailing silence trimmed, loudness-normalised to
-16 LUFS (true peak -1.5 dBTP), and written to remotion/public/voice/film-NN.wav / vertical-NN.wav.
No voice is generated or altered beyond trimming and level; this script never synthesises speech.
"""
from pathlib import Path
import re, subprocess, sys

HERE = Path(__file__).resolve().parent
OUT = HERE / 'remotion' / 'public' / 'voice'
AUDIO = {'.wav', '.m4a', '.mp3', '.aif', '.aiff', '.flac', '.ogg'}
FILTER = ('silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,'
          'areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse,'
          'highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11')

if len(sys.argv) != 2 or not Path(sys.argv[1]).is_dir():
    sys.exit(__doc__)
takes = sorted(p for p in Path(sys.argv[1]).iterdir() if p.suffix.lower() in AUDIO)
if not takes:
    sys.exit('No audio files found in that folder.')
OUT.mkdir(parents=True, exist_ok=True)
done = {'film': [], 'vertical': []}
for p in takes:
    m = re.match(r'(?i)(v)?0*(\d+)', p.stem)
    if not m:
        print('skip (name must start with a scene number):', p.name)
        continue
    kind, n = ('vertical', int(m.group(2))) if m.group(1) else ('film', int(m.group(2)))
    limit = 5 if kind == 'vertical' else 13
    if not 1 <= n <= limit:
        print(f'skip {p.name}: {kind} has scenes 1-{limit}')
        continue
    dst = OUT / f'{kind}-{n:02d}.wav'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(p), '-ac', '1', '-ar', '48000',
                    '-af', FILTER, str(dst)], check=True)
    done[kind].append(n)
    print(f'{p.name} -> {dst.relative_to(HERE)}')
for kind, limit in (('film', 13), ('vertical', 5)):
    missing = [n for n in range(1, limit + 1) if n not in done[kind]]
    if done[kind] and missing:
        print(f'{kind}: scenes without a take keep their silent base length: {missing}')
print('Next: python tools/build_timeline.py')
