// Review stills: bundles once, then renders the frames that matter for each video (every anchor + scene ends),
// so layouts can be checked before a long render.  node review_frames.mjs [videoId ...] [--scale 0.5] [--only sceneId]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const scale = args.includes('--scale') ? Number(args[args.indexOf('--scale') + 1]) : 0.5;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const frameArg = args.includes('--frames') ? args[args.indexOf('--frames') + 1].split(',').map(Number) : null;
const ids = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const tl = JSON.parse(fs.readFileSync('src/timeline_v3.json', 'utf8'));
const NAMES = {horizontal_es: 'HorizontalEs', horizontal_en: 'HorizontalEn', vertical_es: 'VerticalEs', vertical_en: 'VerticalEn'};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
for (const id of (ids.length ? ids : Object.keys(NAMES))) {
  const comp = await selectComposition({serveUrl, id: NAMES[id], inputProps: {}});
  const frames = new Map();
  if (frameArg) frameArg.forEach(f => frames.set(f, `f${f}`));
  else for (const s of tl[id].scenes) {
    if (only && s.id !== only) continue;
    frames.set(s.from + 6, `${s.id}-start`);
    for (const [k, v] of Object.entries(s.anchors)) frames.set(s.from + Math.min(s.frames - 1, v + 24), `${s.id}-${k}`);
    frames.set(s.from + s.frames - 14, `${s.id}-end`);
  }
  const dir = path.resolve('out/review', id);
  fs.mkdirSync(dir, {recursive: true});
  for (const [frame, label] of [...frames.entries()].sort((a, b) => a[0] - b[0])) {
    const out = path.join(dir, `${String(frame).padStart(5, '0')}-${label}.png`);
    await renderStill({composition: comp, serveUrl, output: out, frame, scale, inputProps: {}});
  }
  console.log(id, frames.size, 'stills');
}
