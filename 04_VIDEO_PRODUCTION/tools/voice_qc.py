#!/usr/bin/env python3
"""Automated listening check for the narration takes: transcribe each take back and compare it with the script.

    EL_KEY=... python tools/voice_qc.py [--only horizontal_es] [--scenes origin]

For every take in narration/manifest.json:
  * speech-to-text with ElevenLabs Scribe, then word error rate against the spoken script text
    (a mispronounced name, a swallowed number or a repeated phrase shows up as an error);
  * ffmpeg: duration, peak level, longest internal silence (truncations and stalls), clipping.
Writes narration/voice_qc.json. This complements, and does not replace, a human listening pass.
"""
from pathlib import Path
import argparse, json, os, re, subprocess, sys, unicodedata, urllib.request, uuid

HERE = Path(__file__).resolve().parents[1]
MAN = HERE / 'narration' / 'manifest.json'
OUT = HERE / 'narration' / 'voice_qc.json'

NUM_ES = {'trescientos sesenta y dos': '362', 'cincuenta y cuatro': '54', 'cincuenta y seis': '56', 'sesenta': '60', 'seis': '6', 'doce': '12'}


def norm(s, lang):
    s = unicodedata.normalize('NFKD', s.lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^\w\s'-]", ' ', s).replace('-', ' ')
    return s.split()


def wer(ref, hyp):
    d = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        prev, d[0] = d[0], i
        for j, h in enumerate(hyp, 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r != h))
            prev, d[j] = d[j], cur
    return d[len(hyp)] / max(1, len(ref))


def diff(ref, hyp):
    import difflib
    out = []
    for op, a1, a2, b1, b2 in difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False).get_opcodes():
        if op != 'equal':
            out.append(f"{op}: {' '.join(ref[a1:a2])!r} -> {' '.join(hyp[b1:b2])!r}")
    return out


def stt(path, key, lang):
    boundary = uuid.uuid4().hex
    parts = []
    for name, val in (('model_id', 'scribe_v1'), ('language_code', 'spa' if lang == 'es' else 'eng'), ('tag_audio_events', 'false')):
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode())
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{path.name}"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode()
                 + path.read_bytes() + b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode())
    req = urllib.request.Request('https://api.elevenlabs.io/v1/speech-to-text', data=b''.join(parts), method='POST',
                                 headers={'xi-api-key': key, 'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read())['text']


def acoustics(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af',
                        'silencedetect=noise=-40dB:d=0.25,volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    dur = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', r).groups()[2]) + 60 * int(re.search(r'Duration: (\d+):(\d+)', r).group(2))
    peak = float(re.search(r'max_volume: ([-\d.]+) dB', r).group(1))
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    internal = [e - s for s, e in zip(starts, ends) if s > 0.3 and e < dur - 0.3]
    return {'duration_s': round(dur, 2), 'peak_db': peak, 'longest_internal_pause_s': round(max(internal, default=0), 2),
            'clipping': peak >= -0.1}


SPELLING = {('catalogue', 'catalog'), ('licence', 'license'), ('analyse', 'analyze'), ('dataset', 'data set'),
            ('e book', 'ebook'), ('i book', 'ibook'), ('i', 'e')}


def blocking(diffs):
    bad = []
    for d in diffs:
        op, rest = d.split(': ', 1)
        a, b = [x.strip().strip("'\"") for x in rest.split(' -> ')]
        if op == 'replace' and ((a, b) in SPELLING or a.replace(' ', '').isdigit() or b.replace(' ', '').isdigit()
                                or any(ch.isdigit() for ch in a + b)):
            continue
        bad.append(d)
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', action='append')
    ap.add_argument('--scenes', nargs='*')
    a = ap.parse_args()
    key = os.environ.get('EL_KEY')
    if not key:
        sys.exit('EL_KEY is not set')
    takes = json.loads(MAN.read_text(encoding='utf-8'))['takes']
    report = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    for name, t in sorted(takes.items()):
        video, scene = name.split('/')
        if (a.only and video not in a.only) or (a.scenes and scene not in a.scenes):
            continue
        if report.get(name, {}).get('hash') == t['hash']:
            print(f'cached {name}: WER {report[name]["wer"]:.3f}')
            continue
        mp3 = HERE / t['file']
        align = json.loads(mp3.with_name(mp3.name.replace('.mp3', '.align.json')).read_text(encoding='utf-8'))
        heard = stt(mp3, key, t['lang'])
        ref, hyp = norm(align['text'], t['lang']), norm(heard, t['lang'])
        if t['lang'] == 'es':  # Scribe writes numbers as digits
            joined = ' '.join(ref)
            for words, digits in NUM_ES.items():
                joined = re.sub(rf'\b{words}\b', digits, joined)
            ref = joined.split()
        report[name] = {'hash': t['hash'], 'wer': round(wer(ref, hyp), 3), 'heard': heard, 'differences': diff(ref, hyp), **acoustics(mp3)}
        r = report[name]
        print(f"{name}: WER {r['wer']:.3f} · {r['duration_s']} s · peak {r['peak_db']} dB · longest pause {r['longest_internal_pause_s']} s")
        for d in r['differences']:
            print('   ', d)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=1, sort_keys=True) + '\n', encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
