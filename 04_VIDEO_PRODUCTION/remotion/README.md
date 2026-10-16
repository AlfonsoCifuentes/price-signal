# Pricing Demo — videos (Remotion)

Four narrated videos built from one script source and the public analysis:

| Composition | Format | Language | Captions |
|---|---|---|---|
| `HorizontalEs` | 1920×1080, 30 fps | Spanish | separate SRT/VTT |
| `HorizontalEn` | 1920×1080, 30 fps | English | separate SRT/VTT |
| `VerticalEs` | 1080×1920, 30 fps | Spanish | burned in (feeds play muted) + SRT/VTT |
| `VerticalEn` | 1080×1920, 30 fps | English | burned in + SRT/VTT |

Stills: `Thumbnail{En,Es}` 1280×720, `OgCover{En,Es}` 1200×630, `Square{En,Es}` 1080×1080, `VerticalPoster{En,Es}` 1080×1920.

Durations are not written by hand: every scene lasts as long as its narration plus a short lead and tail, and every on-screen reveal waits for a word marked `{#anchor}` in the script.

## Pipeline (run from `04_VIDEO_PRODUCTION/`)

```bash
python tools/sync_video_data.py                 # public_analysis.json -> remotion/src/v3/data.json, fonts
EL_KEY=... python tools/narrate.py --dry-run    # characters that would be billed
EL_KEY=... python tools/narrate.py              # ElevenLabs takes, cached by hash (only changed scenes are billed)
EL_KEY=... python tools/voice_qc.py             # listening check: Scribe transcription vs script, pauses, peaks
EL_KEY=... python tools/retake.py <video> <scene>   # new seed for one scene until the check is clean
python tools/build_timeline_v3.py               # trimmed takes, word times, anchors, captions -> src/timeline_v3.json, subtitles/
cd remotion && npm install && npx tsc --noEmit && ./render_all.sh && cd ..
python tools/master_and_qc.py                   # -16 LUFS, <= -1 dBTP, faststart -> final/ + final/qc_report.json
python tools/export_media_assets.py             # posters, thumbnails, OG cards -> final/stills/
node remotion/review_frames.mjs horizontal_es   # stills at every anchor, for visual review (run inside remotion/)
```

Scripts: `../scripts/<video>.json` (source) and `.md` (readable, with real timings). Narration settings: `../narration/config.json` (private: voice IDs) or `config.example.json`. The API key is only ever read from `EL_KEY`.

Code: `src/v3/core.tsx` (system, anchors, captions), `horizontal.tsx` (7 scenes), `vertical.tsx` (4 scenes), `Video.tsx` (audio, music ducking, stills), `Root.tsx` (compositions). All figures come from `src/v3/data.json`.

Audio: narration by ElevenLabs synthetic voices (authorised by the author); music generated with ElevenLabs Music, normalised to −24 LUFS and ducked under speech. Voices and music are not covered by the repository's MIT / CC BY licences.
