#!/usr/bin/env python3
"""Generate the narration for the four Pricing Demo videos with ElevenLabs (synthetic voices, authorised by the author).

    EL_KEY=... python tools/narrate.py                       # every scene of the four videos
    EL_KEY=... python tools/narrate.py --only horizontal_es --scenes origin   # pilot one scene
    python tools/narrate.py --dry-run                        # characters that would be billed, no API call

One take per scene, from scripts/<video>.json, via /v1/text-to-speech/<voice>/with-timestamps so every
character comes back with its time. Takes are cached by a hash of (voice, model, settings, format, text):
an unchanged scene is never generated twice, and a changed sentence regenerates only its scene.

Writes narration/<video>/<scene>-<hash>.mp3 + .align.json and narration/manifest.json.
The API key is read from EL_KEY only; it is never written to disk, logged or printed.
"""
from pathlib import Path
import argparse, hashlib, json, os, sys, time, urllib.request, urllib.error, base64

sys.path.insert(0, str(Path(__file__).resolve().parent))
from script_text import parse  # noqa: E402

HERE = Path(__file__).resolve().parents[1]
SCRIPTS = HERE / 'scripts'
OUT = HERE / 'narration'
_cfg = OUT / 'config.json' if (OUT / 'config.json').exists() else OUT / 'config.example.json'
CONFIG = json.loads(_cfg.read_text(encoding='utf-8'))  # config.json is private (voice IDs); the example ships publicly
VIDEOS = ['horizontal_es', 'horizontal_en', 'vertical_es', 'vertical_en']


def settings(lang):
    return {**CONFIG['voice_settings'], **CONFIG['voices'][lang].get('voice_settings', {})}


def take_hash(voice, lang, spoken, take):
    # neighbour context is sent to the API but left out of the hash: editing one scene must not re-bill its neighbours.
    # 'take' > 1 asks for a fresh rendition of an unchanged sentence (it is also sent as the seed).
    blob = json.dumps({'voice': voice, 'model': CONFIG['model_id'], 'settings': settings(lang),
                       'format': CONFIG['output_format'], 'text': spoken, **({'take': take} if take > 1 else {})},
                      sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(blob.encode('utf-8')).hexdigest()[:12]


def plan(video):
    script = json.loads((SCRIPTS / f'{video}.json').read_text(encoding='utf-8'))
    lang = script['lang']
    voice = CONFIG['voices'][lang]['voice_id']
    spoken = [parse(s['narration'])[0] for s in script['scenes']]
    jobs = []
    for i, s in enumerate(script['scenes']):
        # neighbouring sentences give the model context for intonation across cuts; they are not spoken or billed
        prev_text = spoken[i - 1] if i else ''
        next_text = spoken[i + 1] if i + 1 < len(spoken) else ''
        take = int(s.get('take', 1))
        h = take_hash(voice, lang, spoken[i], take)
        jobs.append({'video': video, 'scene': s['id'], 'lang': lang, 'voice': voice, 'text': spoken[i],
                     'prev': prev_text, 'next': next_text, 'hash': h, 'take': take,
                     'mp3': OUT / video / f"{s['id']}-{h}.mp3", 'align': OUT / video / f"{s['id']}-{h}.align.json"})
    return jobs


def synth(job, key):
    url = (f"https://api.elevenlabs.io/v1/text-to-speech/{job['voice']}/with-timestamps"
           f"?output_format={CONFIG['output_format']}")
    body = {'text': job['text'], 'model_id': CONFIG['model_id'], 'voice_settings': settings(job['lang'])}
    if job['take'] > 1:
        body['seed'] = job['take']
    if job['prev']:
        body['previous_text'] = job['prev']
    if job['next']:
        body['next_text'] = job['next']
    req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), method='POST',
                                 headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            msg = e.read()[:300].decode('utf-8', 'replace')
            if e.code in (429, 500, 502, 503) and attempt < 2:
                time.sleep(4 * (attempt + 1))
                continue
            raise SystemExit(f"{job['video']}/{job['scene']}: HTTP {e.code} {msg}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', choices=VIDEOS, action='append')
    ap.add_argument('--scenes', nargs='*')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    key = os.environ.get('EL_KEY', '')
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {'takes': {}, 'billed_characters': 0}
    billed = 0
    for video in (a.only or VIDEOS):
        for job in plan(video):
            if a.scenes and job['scene'] not in a.scenes:
                continue
            cached = job['mp3'].exists() and job['align'].exists()
            if a.dry_run:
                print(f"{'cached' if cached else 'NEW   '} {video}/{job['scene']} {len(job['text'])} chars")
                billed += 0 if cached else len(job['text'])
                continue
            if not cached:
                if job['voice'].startswith('<'):
                    raise SystemExit('fill narration/config.json with real voice IDs (see config.example.json)')
                if not key:
                    raise SystemExit('EL_KEY is not set (the key is never stored in the project)')
                res = synth(job, key)
                job['mp3'].parent.mkdir(parents=True, exist_ok=True)
                job['mp3'].write_bytes(base64.b64decode(res['audio_base64']))
                job['align'].write_text(json.dumps({'text': job['text'], 'alignment': res['alignment']}, ensure_ascii=False) + '\n',
                                        encoding='utf-8', newline='\n')
                billed += len(job['text'])
                print(f"ok     {video}/{job['scene']} {len(job['text'])} chars")
            else:
                print(f"cached {video}/{job['scene']}")
            manifest['takes'][f"{video}/{job['scene']}"] = {
                'file': job['mp3'].relative_to(HERE).as_posix(), 'hash': job['hash'], 'lang': job['lang'],
                'voice': CONFIG['voices'][job['lang']]['name'], 'model': CONFIG['model_id'], 'characters': len(job['text']),
                'sha256': hashlib.sha256(job['mp3'].read_bytes()).hexdigest()}
    if a.dry_run:
        print(f'would bill about {billed} characters')
        return
    manifest['billed_characters'] = manifest.get('billed_characters', 0) + billed
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1, sort_keys=True) + '\n', encoding='utf-8', newline='\n')
    print(f'billed this run: {billed} characters · total recorded: {manifest["billed_characters"]}')


if __name__ == '__main__':
    main()
