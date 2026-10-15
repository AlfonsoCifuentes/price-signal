# PRICE / SIGNAL — Remotion film

Two data-driven compositions in the site's visual system: **Film** (1920×1080, 30 fps, 2:36) and **Vertical** (1080×1920, 30 fps, 0:45), plus stills (YouTube thumbnail, OG cover, square). Every figure on screen comes from `src/data.json`, a copy of `02_PUBLIC_CASE_STUDY/public_analysis.json`. No stock footage, music or synthetic voice.

```bash
npm install
npm run studio            # preview and edit
npm run render:all        # stills + silent film + vertical (captions burned in)
```

| Composition | Use |
|---|---|
| `Film` | Silent master (web player uses it with a VTT track) |
| `FilmCaptioned` | Preview with script captions burned in |
| `FilmVoice` | Final film with the author's recorded narration |
| `Vertical` / `VerticalVoice` | LinkedIn cut, captions burned in, without / with narration |
| `Thumbnail`, `OgCover`, `Square` | 1280×720, 1200×630, 1080×1080 stills |

**Timing and narration** live in `../script_master.json`. `../tools/build_timeline.py` turns it into `src/timeline.json` and the SRT/VTT files in `../captions/`. With recorded takes in `public/voice/` (prepared by `../prepare_voice.py`), each scene stretches to fit its take and the captions follow the speech.

Scenes: `src/scenes.tsx` (film), `src/vertical.tsx` (vertical), shared system in `src/kit.tsx`, compositions in `src/Root.tsx`. Run `npm run typecheck` before rendering.
