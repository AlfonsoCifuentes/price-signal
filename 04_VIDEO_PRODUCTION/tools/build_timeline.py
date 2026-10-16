#!/usr/bin/env python3
"""Build the Remotion timeline + caption files from script_master.json and (optionally) recorded takes.

    python tools/build_timeline.py            # base timing (12 s / 9 s scenes), script captions
    python tools/build_timeline.py --check    # verify numbers in the narration against the analysis

If prepared takes exist (remotion/public/voice/film-01.wav ... film-13.wav, vertical-01.wav ... vertical-05.wav,
produced by tools/prepare_voice.py), each scene is stretched to fit its take (never shortened below the
base length) and captions are spread over the measured speech. Captions are then *approximate*: review
them in Remotion Studio or a subtitle editor before uploading. If a word-level JSON from a speech-to-text
tool exists next to a take (film-01.words.json: [{"word": "...", "start": s, "end": s}, ...]), cues follow it.

Outputs:
  remotion/src/timeline.json  (each scene carries its English cues and an "es" block: Spanish kicker and cues)
  captions/price-signal-film.en|es.srt|.vtt, captions/price-signal-vertical.en|es.srt|.vtt
The Spanish narration shares the English scene timing, so both cuts stay frame-identical.
"""
from pathlib import Path
import json, re, subprocess, sys, math

HERE = Path(__file__).resolve().parents[1]
REMOTION = HERE / 'remotion'
VOICE = REMOTION / 'public' / 'voice'
CAP = HERE / 'captions'
LF = chr(10)
LEAD, TAIL = 0.45, 0.75          # seconds of air before/after speech inside a scene
INTRO_LEAD = 1.6                  # opening scene: music runs this long before the first word
MAX_CHARS = 64                    # per caption cue (two short lines)
MIN_CHARS = 20                    # shorter fragments are merged, then re-split evenly

master = json.loads((HERE / 'script_master.json').read_text(encoding='utf-8'))
FPS = master['fps']
LEAD = round(LEAD * FPS) / FPS     # whole frames: Remotion starts the voice on this exact frame


def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def chunks(text):
    """Split narration into readable cues: sentences first, then clauses, then words."""
    parts = []
    for sentence in re.split(r'(?<=[.?!])\s+', text.strip()):
        if len(sentence) <= MAX_CHARS:
            parts.append(sentence)
            continue
        buf = ''
        for clause in re.split(r'(?<=[,:;])\s+', sentence):
            if buf and len(buf) + 1 + len(clause) > MAX_CHARS:
                parts.append(buf)
                buf = clause
            else:
                buf = f'{buf} {clause}'.strip()
        if buf:
            parts.append(buf)
    merged = []  # a fragment like "The dataset," would flash for under a second: fold it into a neighbour
    for p in parts:
        if merged and (len(p) < MIN_CHARS or len(merged[-1]) < MIN_CHARS):
            merged[-1] = f'{merged[-1]} {p}'
        else:
            merged.append(p)
    out = []
    for p in merged:  # balance any cue that is still too long into k near-equal pieces
        k = math.ceil(len(p) / MAX_CHARS)
        words = p.split()
        while k > 1:
            target = len(' '.join(words)) / k
            acc, cut = 0, 1
            for i, w in enumerate(words[:-1], start=1):
                acc += len(w) + 1
                if acc >= target:
                    cut = i
                    break
            out.append(' '.join(words[:cut]))
            words, k = words[cut:], k - 1
        out.append(' '.join(words))
    return out


def cues_proportional(text, start, end):
    parts = chunks(text)
    weights = [len(p) + 6 for p in parts]  # +6 approximates the pause between cues
    total, t, out = sum(weights), start, []
    for p, w in zip(parts, weights):
        d = (end - start) * w / total
        out.append({'text': p, 'from': round(t, 3), 'to': round(t + d - 0.05, 3)})
        t += d
    return out


def cues_from_words(text, words, offset):
    parts, out, i = chunks(text), [], 0
    for p in parts:
        n = len(p.split())
        seg = words[i:i + n] or words[-1:]
        out.append({'text': p, 'from': round(offset + seg[0]['start'], 3), 'to': round(offset + seg[-1]['end'] + 0.15, 3)})
        i += n
    for a, b in zip(out, out[1:]):  # a cue never outlives the next one: no overlapping subtitles
        a['to'] = min(a['to'], b['from'])
    return out


def build(kind, take_prefix, bases=None):
    """Each scene lasts as long as its longest take (EN or ES), so both cuts keep identical frames.
    The first scene opens on music before the voice comes in (INTRO_LEAD); the others use LEAD."""
    scenes, t0, cues, cues_es, voiced, frame, spans_en, spans_es = [], 0.0, [], [], 0, 0, [], []
    as_frames = lambda cs: [{'text': c['text'], 'from': round(c['from'] * FPS), 'to': round(c['to'] * FPS)} for c in cs]
    for n, s in enumerate(master[kind], start=1):
        take_en = VOICE / f'{take_prefix}-{n:02d}.wav'
        take_es = VOICE / 'es' / f'{take_prefix}-{n:02d}.wav'
        base = float(bases[n - 1]) if bases else float(s['seconds'])
        lead = INTRO_LEAD if n == 1 else LEAD
        durations = {lang: duration(t) for lang, t in (('en', take_en), ('es', take_es)) if t.exists()}
        if durations:
            voiced += take_en.exists()
            secs = max([base] + [lead + d + TAIL for d in durations.values()])
        else:
            secs = base
        frames = math.ceil(secs * FPS)
        offset = round(lead * FPS)

        def cues_for(text, take):
            # word-level timing (from the ElevenLabs alignment next to the take) wins over proportional spreading
            if take.exists():
                words_file = take.with_suffix('.words.json')
                if words_file.exists():
                    return cues_from_words(text, json.loads(words_file.read_text(encoding='utf-8')), lead)
                return cues_proportional(text, lead, lead + duration(take))
            return cues_proportional(text, lead, secs - TAIL)

        local = cues_for(s['narration'], take_en)
        local_es = cues_for(s['es']['narration'], take_es)
        audio = f'voice/{take_en.name}' if take_en.exists() else None
        audio_es = f'voice/es/{take_es.name}' if take_es.exists() else None
        if take_en.exists():
            spans_en.append({'from': frame + offset, 'to': frame + offset + math.ceil(durations['en'] * FPS)})
        if take_es.exists():
            spans_es.append({'from': frame + offset, 'to': frame + offset + math.ceil(durations['es'] * FPS)})
        scenes.append({**{k: v for k, v in s.items() if k != 'es'}, 'frames': frames, 'audio': audio,
                       'audioOffsetFrames': offset, 'cues': as_frames(local),
                       'es': {'kicker': s['es']['kicker'], 'title': s['es']['title'], 'cues': as_frames(local_es),
                              'audio': audio_es}})
        cues += [{'text': c['text'], 'from': t0 + c['from'], 'to': t0 + c['to']} for c in local]
        cues_es += [{'text': c['text'], 'from': t0 + c['from'], 'to': t0 + c['to']} for c in local_es]
        t0 += frames / FPS
        frame += frames
    return {'scenes': scenes, 'frames': sum(s['frames'] for s in scenes), 'voicedScenes': voiced,
            'voicedScenesEs': sum(1 for s in scenes if s['es']['audio']),
            'voiceSpans': {'en': spans_en, 'es': spans_es},
            'captionsAreApproximate': voiced > 0}, cues, cues_es


def ts(t, sep):
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f'{int(h):02d}:{int(m):02d}:{int(s):02d}{sep}{int(round((s % 1) * 1000)) % 1000:03d}'


def write_captions(cues, stem, header_note, lang):
    CAP.mkdir(exist_ok=True)
    srt = LF.join(f'{i}{LF}{ts(c["from"], ",")} --> {ts(c["to"], ",")}{LF}{c["text"]}{LF}' for i, c in enumerate(cues, 1))
    vtt = 'WEBVTT' + LF + LF + f'NOTE {header_note}' + LF + LF + LF.join(
        f'{ts(c["from"], ".")} --> {ts(c["to"], ".")}{LF}{c["text"]}{LF}' for c in cues)
    (CAP / f'{stem}.{lang}.srt').write_text(srt, encoding='utf-8', newline=LF)
    (CAP / f'{stem}.{lang}.vtt').write_text(vtt, encoding='utf-8', newline=LF)


def check_numbers():
    """Every figure spoken must exist in the analysis output."""
    a = json.loads((HERE.parent / '02_PUBLIC_CASE_STUDY' / 'public_analysis.json').read_text(encoding='utf-8'))
    h = a['headline']
    spoken = {'three hundred and sixty-two': h['products'], 'twelve invented series': h['series'],
              'sixty comparable groups': h['comparables'], 'Fifty-four of the sixty': h['consistent'],
              'fifty-four of sixty': h['consistent'], 'Four exceptions': h['exceptions_starter'],
              'The other two': h['exceptions_misfiled'], 'Two of the six': h['exceptions_misfiled'],
              'Two records': len(a['traps']['series_mismatch'])}
    expected = {'three hundred and sixty-two': 362, 'twelve invented series': 12, 'sixty comparable groups': 60,
                'Fifty-four of the sixty': 54, 'fifty-four of sixty': 54, 'Four exceptions': 4, 'The other two': 2,
                'Two of the six': 2, 'Two records': 2}
    text = ' '.join(s['narration'] for k in ('film', 'vertical') for s in master[k])
    bad = [k for k in spoken if k in text and spoken[k] != expected[k]]
    pct = [x['premium_pct'] for x in a['traps']['split_volumes']]
    if 'about fourteen percent' in text and not all(13.5 <= p <= 14.5 for p in pct):
        bad.append('about fourteen percent')
    missing = [k for k in ('three hundred and sixty-two', 'Fifty-four of the sixty', 'The other two') if k not in text]
    # the Spanish narration must carry the same figures
    text_es = ' '.join(s['es']['narration'] for k in ('film', 'vertical') for s in master[k])
    missing += [f'missing Spanish phrase: {k}' for k in ('trescientos sesenta y dos', 'Cincuenta y cuatro de los sesenta', 'Las otras dos')
                if k not in text_es]
    if 'catorce por ciento' in text_es and not all(13.5 <= p <= 14.5 for p in pct):
        missing.append('catorce por ciento')
    return bad + [f'missing phrase: {m}' for m in missing]


problems = check_numbers()
if '--check' in sys.argv:
    print('narration figures OK' if not problems else problems)
    sys.exit(1 if problems else 0)
if problems:
    sys.exit(f'Narration contradicts the analysis: {problems}')

film, film_cues, film_cues_es = build('film', 'film')
# the vertical cut tells the same story with the same narration takes, so each scene keeps the film's length
film_bases = [s['frames'] / FPS for s in film['scenes']]
vertical, vertical_cues, vertical_cues_es = build('vertical', 'film', film_bases)
timeline = {'fps': FPS, 'film': film, 'vertical': vertical}
(REMOTION / 'src' / 'timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=1) + LF, encoding='utf-8', newline=LF)
word_timed = all((VOICE / f'film-{n:02d}.words.json').exists() and (VOICE / 'es' / f'film-{n:02d}.words.json').exists()
                 for n in range(1, 14))
note = ('Each cue starts on the word it belongs to (ElevenLabs character alignment, measured against the take).' if word_timed
        else 'Timed to recorded takes; spread proportionally, review before upload.' if film['voicedScenes']
        else 'Script captions on the planned 12-second grid. Not word-accurate until the narration is recorded.')
for lang, fc, vc in (('en', film_cues, vertical_cues), ('es', film_cues_es, vertical_cues_es)):
    write_captions(fc, 'price-signal-film', note, lang)
    write_captions(vc, 'price-signal-vertical', note, lang)
words = sum(len(s['narration'].split()) for s in master['film'])
print(f"film: {film['frames']} frames ({film['frames'] / FPS:.1f} s), {film['voicedScenes']}/13 scenes voiced, {words} words "
      f"(~{words / (film['frames'] / FPS) * 60:.0f} wpm incl. pauses)")
print(f"vertical: {vertical['frames']} frames ({vertical['frames'] / FPS:.1f} s), {vertical['voicedScenes']}/{len(master['vertical'])} voiced")
print(f'captions: {len(film_cues)} film / {len(vertical_cues)} vertical cues (en), {len(film_cues_es)} / {len(vertical_cues_es)} (es) -> {CAP.relative_to(HERE)}')
