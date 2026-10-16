#!/usr/bin/env python3
"""Build the timeline of the four Pricing Demo videos from the real narration (no hand-written seconds).

    python tools/build_timeline_v3.py

For each video in scripts/ and each scene, takes the cached ElevenLabs take (tools/narrate.py):
  1. trims the take to its speech (ffmpeg silencedetect) and evens its loudness to -18 LUFS → remotion/public/narration/<video>/<scene>.wav
  2. turns the character alignment into word times, maps spoken words back to caption words
     ("cincuenta y cuatro" -> "54") and resolves the {#anchors} that drive the animation
  3. sizes the scene as lead + speech + tail, so the picture follows the voice
  4. cuts semantic captions that never cross a scene boundary
Writes remotion/src/timeline_v3.json, subtitles/<video>.srt|.vtt|.txt and scripts/<video>.md.
"""
from pathlib import Path
import json, math, re, subprocess, sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from script_text import parse  # noqa: E402
import narrate  # noqa: E402

HERE = Path(__file__).resolve().parents[1]
PUB = HERE / 'remotion' / 'public'
SUBS = HERE / 'subtitles'
FPS = 30
FORMAT = {'horizontal': {'width': 1920, 'height': 1080, 'lead': 0.5, 'first_lead': 2.4, 'tail': 1.0, 'last_tail': 4.0, 'cue_chars': 84},
          'vertical': {'width': 1080, 'height': 1920, 'lead': 0.35, 'first_lead': 1.2, 'tail': 0.7, 'last_tail': 3.2, 'cue_chars': 52}}
KEEP_HEAD, KEEP_TAIL = 0.06, 0.14
TARGET_LUFS = -18.0


def ff(args):
    return subprocess.run(['ffmpeg', '-hide_banner', '-nostats', *args], capture_output=True, text=True)


def speech_bounds(mp3):
    r = ff(['-i', str(mp3), '-af', 'silencedetect=noise=-45dB:d=0.06', '-f', 'null', '-']).stderr
    dur = sum(float(x) * m for x, m in zip(re.search(r'Duration: (\d+):(\d+):([\d.]+)', r).groups(), (3600, 60, 1)))
    starts = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', r)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    onset = ends[0] if starts and starts[0] <= 0.01 and ends else 0.0
    offset = starts[-1] if starts and (len(ends) < len(starts) or ends[-1] >= dur - 0.01) and starts[-1] > onset else dur
    return onset, offset, dur


def prepare(mp3, wav):
    onset, offset, _ = speech_bounds(mp3)
    a, b = max(0.0, onset - KEEP_HEAD), offset + KEEP_TAIL
    r = ff(['-i', str(mp3), '-af', f'atrim={a}:{b},loudnorm=I={TARGET_LUFS}:TP=-2:print_format=json', '-f', 'null', '-']).stderr
    m = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', r, re.S).group(0))
    gain = TARGET_LUFS - float(m['input_i'])
    gain = min(gain, -1.5 - float(m['input_tp']))  # never push a peak above -1.5 dBTP
    wav.parent.mkdir(parents=True, exist_ok=True)
    out = ff(['-y', '-i', str(mp3), '-af', f'atrim={a}:{b},asetpts=N/SR/TB,volume={gain:.2f}dB,afade=t=in:d=0.02,afade=t=out:st={b - a - 0.05:.3f}:d=0.05',
              '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', str(wav)])
    if out.returncode:
        raise SystemExit(out.stderr[-400:])
    return a, b - a


def word_times(align, trim):
    text, al = align['text'], align['alignment']
    chars, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    if ''.join(chars) != text:
        raise SystemExit('alignment text mismatch')
    out = []
    for m in re.finditer(r'\S+', text):
        out.append((max(0.0, st[m.start()] - trim), max(0.0, en[m.end() - 1] - trim)))
    return out


def cut_cues(tokens, max_chars):
    """Group caption words into cues. Each cue ends at the best-scoring breakpoint that fits:
    a sentence end beats a clause break beats a bare word; a sentence may overflow by 12 % rather than
    leave one orphaned word for the next cue; very short cues are avoided unless they close a sentence."""
    def sentence_end(d):
        return bool(re.search(r'[.!?…:]["»”]?$', d))
    def clause(d):
        return bool(re.search(r'[,;—]["»”]?$', d))
    cues, i, n = [], 0, len(tokens)
    while i < n:
        best, length, inner = None, -1, 0
        for e in range(i, n):
            length += len(tokens[e]['display']) + 1
            d = tokens[e]['display']
            if e > i and sentence_end(tokens[e - 1]['display']):
                inner += 1  # this cue would carry the tail of one sentence and the start of another
            limit = max_chars * (1.12 if sentence_end(d) else 1.0)
            if length > limit and e > i:
                if length > max_chars * 1.12:
                    break
                continue
            fill = length / max_chars
            if e == n - 1 or sentence_end(d):
                score = 80 + 10 * fill - (25 if length < 14 else 0)
            elif clause(d):
                score = 50 + 20 * fill - (30 if fill < .4 else 0)
            else:
                score = 30 * fill - (40 if fill < .5 else 0)
            score -= 12 * inner
            # do not strand a short sentence tail ("calcular.") in the next cue
            rem, k = 0, e + 1
            while k < n and not sentence_end(tokens[k - 1]['display']) if k > e + 1 else k < n:
                rem += len(tokens[k]['display']) + 1
                if sentence_end(tokens[k]['display']):
                    break
                k += 1
            if not sentence_end(d) and 0 < rem < 16:
                score -= 30
            if best is None or score >= best[0]:
                best = (score, e)
        cues.append(tokens[i:best[1] + 1])
        i = best[1] + 1
    return cues


def two_lines(text, max_chars):
    """Split a cue over two lines: balanced lengths, but a break after punctuation wins when it is close."""
    if len(text) <= max_chars // 2 + 6:
        return text
    words, best = text.split(' '), None
    for k in range(1, len(words)):
        a, b = ' '.join(words[:k]), ' '.join(words[k:])
        if max(len(a), len(b)) > max_chars // 2 + 10:
            continue
        score = abs(len(a) - len(b)) - (14 if re.search(r'[.!?:,;]["»”]?$', words[k - 1]) else 0)
        if best is None or score < best[0]:
            best = (score, a, b)
    if best is None:
        k = len(words) // 2
        return ' '.join(words[:k]) + '\n' + ' '.join(words[k:])
    return best[1] + '\n' + best[2]


def ts(sec, vtt):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d}{"." if vtt else ","}{ms:03d}'


def build(video):
    script = json.loads((HERE / 'scripts' / f'{video}.json').read_text(encoding='utf-8'))
    fmt = FORMAT[script['format']]
    jobs = {j['scene']: j for j in narrate.plan(video)}
    scenes, cursor, all_cues, spans = [], 0, [], []
    for i, s in enumerate(script['scenes']):
        job = jobs[s['id']]
        if not job['mp3'].exists():
            raise SystemExit(f'missing take for {video}/{s["id"]}: run tools/narrate.py')
        wav = PUB / 'narration' / video / f"{s['id']}.wav"
        trim, speech = prepare(job['mp3'], wav)
        align = json.loads(job['align'].read_text(encoding='utf-8'))
        spoken, tokens, anchors = parse(s['narration'])
        if spoken != align['text']:
            raise SystemExit(f'{video}/{s["id"]}: script changed since the take was made; run tools/narrate.py')
        wt = word_times(align, trim)
        k = 0
        for t in tokens:  # caption word spans the spoken words it stands for
            n = len(t['spoken_words'])
            t['start'], t['end'] = wt[k][0], wt[k + n - 1][1]
            k += n
        lead = s.get('lead', fmt['first_lead'] if i == 0 else fmt['lead'])
        tail = s.get('tail', fmt['last_tail'] if i == len(script['scenes']) - 1 else fmt['tail'])
        frames = math.ceil((lead + speech + tail) * FPS)
        to_f = lambda sec: round((lead + sec) * FPS)
        cues = []
        groups = cut_cues(tokens, fmt['cue_chars'])
        for g_i, g in enumerate(groups):
            start = g[0]['start']
            nxt = groups[g_i + 1][0]['start'] if g_i + 1 < len(groups) else None
            end = g[-1]['end'] + 0.35
            if nxt is not None:
                end = min(end, nxt - 0.03)
            end = max(end, start + 0.9 if nxt is None or nxt - start > 0.95 else nxt - start - 0.03)
            text = ' '.join(t['display'] for t in g)
            cues.append({'text': two_lines(text, fmt['cue_chars']), 'from': to_f(start), 'to': min(frames - 6, to_f(end))})
        scenes.append({
            'id': s['id'], 'kicker': s['kicker'], 'from': cursor, 'frames': frames,
            'audio': f'narration/{video}/{s["id"]}.wav', 'audioFrom': round(lead * FPS),
            'speechFrames': round(speech * FPS),
            'anchors': {name: to_f(tokens[idx]['start']) for name, idx in anchors.items()},
            'cues': cues,
            'words': [{'w': t['display'], 'f': to_f(t['start']), 't': to_f(t['end'])} for t in tokens],
        })
        spans.append({'from': cursor + round(lead * FPS), 'to': cursor + round((lead + speech) * FPS)})
        for c in cues:
            all_cues.append({'text': c['text'], 'start': (cursor + c['from']) / FPS, 'end': (cursor + c['to']) / FPS})
        cursor += frames
    SUBS.mkdir(exist_ok=True)
    srt = '\n'.join(f"{n}\n{ts(c['start'], False)} --> {ts(c['end'], False)}\n{c['text']}\n" for n, c in enumerate(all_cues, 1))
    vtt = 'WEBVTT\n\n' + '\n'.join(f"{ts(c['start'], True)} --> {ts(c['end'], True)}\n{c['text']}\n" for c in all_cues)
    (SUBS / f'{video}.srt').write_text(srt, encoding='utf-8', newline='\n')
    (SUBS / f'{video}.vtt').write_text(vtt, encoding='utf-8', newline='\n')
    plain = '\n\n'.join(' '.join(t['display'] for t in parse(s['narration'])[1]) for s in script['scenes'])
    (SUBS / f'{video}.txt').write_text(f"{script['title']}\n\n{plain}\n", encoding='utf-8', newline='\n')
    md = [f"# {script['title']} ({video})", '', f"Versión del guion {script['version']} · duración real {cursor / FPS:.1f} s · voz ElevenLabs ({script['lang']})", '']
    for sc, s in zip(scenes, script['scenes']):
        md += [f"## {sc['id']} · {s['kicker']} · {sc['from'] / FPS:.1f}–{(sc['from'] + sc['frames']) / FPS:.1f} s", '',
               '**Locución:** ' + ' '.join(t['display'] for t in parse(s['narration'])[1]), '', f"**Pantalla:** {s['screen']}", '']
    (HERE / 'scripts' / f'{video}.md').write_text('\n'.join(md), encoding='utf-8', newline='\n')
    return {'id': video, 'lang': script['lang'], 'format': script['format'], 'width': fmt['width'], 'height': fmt['height'],
            'fps': FPS, 'frames': cursor, 'seconds': round(cursor / FPS, 2), 'scenes': scenes, 'speech': spans}


def main():
    out = {v: build(v) for v in narrate.VIDEOS}
    (HERE / 'remotion' / 'src' / 'timeline_v3.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    for v, t in out.items():
        print(f"{v}: {t['seconds']} s ({t['frames']} frames), {sum(len(s['cues']) for s in t['scenes'])} captions")


if __name__ == '__main__':
    main()
