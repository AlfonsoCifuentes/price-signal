#!/usr/bin/env python3
"""Turn ElevenLabs character alignments into word timings for the prepared takes.

    python tools/align_takes.py path/to/takes            # EN takes: 01.align.json ... v05.align.json
    python tools/align_takes.py path/to/takes/es --lang es

Reads <take>.align.json (written by tools/elevenlabs_takes.js) and writes
remotion/public/voice[/es]/<film|vertical>-NN.words.json: [{"word", "start", "end"}, ...] in seconds,
measured from the start of the prepared WAV. tools/build_timeline.py then places every caption on the
word it belongs to, so subtitles follow the spoken audio instead of being spread evenly.

prepare_voice.py trims leading silence down to 0.08 s; the offset of that trim is measured on the
original MP3 and subtracted, so the timings match the WAV that Remotion plays.
"""
from pathlib import Path
import json, re, subprocess, sys

HERE = Path(__file__).resolve().parents[1]
VOICE = HERE / 'remotion' / 'public' / 'voice'
KEEP_LEAD = 0.08  # silence kept before speech by prepare_voice.py
args = sys.argv[1:]
lang = 'en'
if '--lang' in args:
    i = args.index('--lang')
    lang = args[i + 1]
    del args[i:i + 2]
if len(args) != 1 or not Path(args[0]).is_dir() or lang not in ('en', 'es'):
    sys.exit(__doc__)
src_dir = Path(args[0])
out_dir = VOICE / 'es' if lang == 'es' else VOICE
out_dir.mkdir(parents=True, exist_ok=True)


def speech_start(mp3):
    """Seconds of leading silence in the original take, or 0 if the take opens with speech (same threshold as prepare_voice)."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(mp3), '-af', 'silencedetect=noise=-45dB:d=0.08', '-f', 'null', '-'],
                       capture_output=True, text=True)
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r.stderr)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r.stderr)]
    if starts and starts[0] <= 0.01 and ends:
        return ends[0]
    return 0.0


def words_with_times(text, alignment):
    starts, ends = alignment['character_start_times_seconds'], alignment['character_end_times_seconds']
    chars = alignment['characters']
    out = []
    for m in re.finditer(r'\S+', text):
        idx = [k for k in range(m.start(), m.end()) if k < len(chars)]
        if not idx:
            continue
        out.append({'word': m.group(0), 'start': starts[idx[0]], 'end': ends[idx[-1]]})
    return out


count = 0
for align in sorted(src_dir.glob('*.align.json')):
    base = align.name.split('.')[0]          # 01 or v01
    kind, n = ('vertical', int(base.lstrip('v'))) if base.startswith('v') else ('film', int(base))
    mp3 = align.with_name(f'{base}.mp3')
    data = json.loads(align.read_text(encoding='utf-8'))
    words = words_with_times(data['text'], data['alignment'])
    if len(words) != len(data['text'].split()):
        sys.exit(f'{align.name}: word count mismatch')
    # The alignment's clock can start at the text, not at the sound: anchor the first word to the measured
    # onset of speech in the MP3 so every word lands on the audio that Remotion plays.
    onset = speech_start(mp3)
    delta = onset - words[0]['start']
    offset = max(0.0, onset - KEEP_LEAD)     # what prepare_voice.py trims from the front
    shifted = [{'word': w['word'], 'start': round(max(0.0, w['start'] + delta - offset), 3),
                'end': round(max(0.0, w['end'] + delta - offset), 3)} for w in words]
    target = out_dir / f'{kind}-{n:02d}.words.json'
    target.write_text(json.dumps(shifted, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    print(f'{align.name} -> {target.relative_to(HERE)} ({len(shifted)} words, trim {offset:.3f}s)')
    count += 1
print(f'{count} word timing files written')
