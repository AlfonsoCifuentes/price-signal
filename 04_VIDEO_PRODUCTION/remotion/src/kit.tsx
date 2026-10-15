import React from 'react';
import {AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/* Same "blueline proof" system as the website. All data shown in the film is fictional. */
export const C = {
  paper: '#f3f4ef', sheet: '#fbfbf8', key: '#15161a', ink2: '#4c4e57', rule: '#c9ccc4',
  blue: '#2433b8', blueWash: '#e3e6f6', magenta: '#c2105f', pink: '#ff7bb3', yellow: '#ffe14d', cyan: '#00a0e3',
};
export const F = {
  display: '"Archivo", "Arial Narrow", Arial, sans-serif',
  text: '"Archivo", "Helvetica Neue", Arial, sans-serif',  // sans throughout, matching the website
  mono: '"Martian Mono", Consolas, monospace',
};

/* ---------- language: one composition per locale; scenes pick their words with t(en, es).
   Catalogue identifiers (series, titles, column names, product types) stay as recorded in the data. */
export type Locale = 'en' | 'es';
export const LocaleCtx = React.createContext<Locale>('en');
export const useT = () => {
  const loc = React.useContext(LocaleCtx);
  return (en: string, es: string) => (loc === 'es' ? es : en);
};
export const useIsEs = () => React.useContext(LocaleCtx) === 'es';

/* ---------- fonts: block rendering until the variable faces are ready */
let fontsPromise: Promise<void> | null = null;
const loadFonts = () => {
  if (fontsPromise) return fontsPromise;
  const faces = [
    new FontFace('Archivo', `url(${staticFile('fonts/archivo-latin-wdth-normal.woff2')})`, {weight: '100 900', stretch: '62% 125%'}),
    new FontFace('Martian Mono', `url(${staticFile('fonts/martian-mono-latin-wdth-normal.woff2')})`, {weight: '100 800', stretch: '75% 112.5%'}),
  ];
  fontsPromise = Promise.all(faces.map(f => f.load().then(l => { (document.fonts as unknown as {add: (f: FontFace) => void}).add(l); }))).then(() => undefined);
  return fontsPromise;
};
export const useFonts = () => {
  const [handle] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => { loadFonts().then(() => continueRender(handle)); }, [handle]);
};

/* ---------- motion helpers */
export const ease = Easing.bezier(0.2, 0.7, 0.1, 1);
/** 0→1 between frame a and b (eased, clamped). */
export const prog = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
export const fadeUp = (f: number, start: number, dist = 26, dur = 18): React.CSSProperties => {
  const p = prog(f, start, start + dur);
  return {opacity: p, transform: `translateY(${(1 - p) * dist}px)`};
};
export const eur = (v: number) => '€' + v.toFixed(2);
/** Scene-level fade-out near the end so cuts breathe. */
export const useOut = (frames: number) => {
  const f = useCurrentFrame();
  return interpolate(f, [frames - 12, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};

/* ---------- proof chrome: crop marks, slug line, folio */
export const Chrome: React.FC<{kicker: string; index: number; total: number; dark?: boolean; vertical?: boolean}> =
  ({kicker, index, total, dark, vertical}) => {
    const t = useT();
    const fg = dark ? C.paper : C.key;
    const pad = vertical ? 64 : 72;
    const crop = (style: React.CSSProperties) => (
      <div style={{position: 'absolute', width: 30, height: 30, ...style}}>
        <div style={{position: 'absolute', width: 30, height: 2, background: fg, opacity: .8}} />
        <div style={{position: 'absolute', width: 2, height: 30, background: fg, opacity: .8}} />
      </div>
    );
    return (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        {crop({left: 26, top: 26})}
        {crop({right: 26, top: 26, transform: 'scaleX(-1)'})}
        {crop({left: 26, bottom: 26, transform: 'scaleY(-1)'})}
        {crop({right: 26, bottom: 26, transform: 'scale(-1)'})}
        <div style={{position: 'absolute', top: pad - 10, left: pad, right: pad, display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', fontFamily: F.mono, fontStretch: '87%', fontSize: vertical ? 26 : 21, letterSpacing: 1.5, color: fg,
          textTransform: 'uppercase'}}>
          <span style={{fontFamily: F.display, fontWeight: 800, fontStretch: '112%', fontSize: vertical ? 32 : 26, letterSpacing: .5}}>
            PRICE<span style={{color: dark ? C.pink : C.magenta, fontWeight: 400, fontStretch: '62%', margin: '0 4px'}}>/</span>SIGNAL
          </span>
          <span style={{color: dark ? C.pink : C.magenta, fontWeight: 600}}>{kicker}</span>
        </div>
        <div style={{position: 'absolute', bottom: pad - 30, left: pad, right: pad, display: 'flex', justifyContent: 'space-between',
          fontFamily: F.mono, fontStretch: '87%', fontSize: vertical ? 20 : 16, letterSpacing: 1.2, color: dark ? '#9fa2ad' : C.ink2,
          textTransform: 'uppercase'}}>
          <span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <span>{t('Fictional data · independent case study', 'Datos ficticios · caso de estudio independiente')}</span>
        </div>
      </AbsoluteFill>
    );
  };

/* ---------- burned-in captions (from timeline cues, in scene-local frames) */
export type Cue = {text: string; from: number; to: number};
export const Captions: React.FC<{cues: Cue[]; vertical?: boolean; dark?: boolean}> = ({cues, vertical}) => {
  const f = useCurrentFrame();
  const cue = cues.find(c => f >= c.from && f <= c.to);
  if (!cue) return null;
  const o = interpolate(f, [cue.from, cue.from + 4, cue.to - 4, cue.to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: vertical ? 250 : 66, display: 'flex', justifyContent: 'center', opacity: o}}>
      <span style={{background: 'rgba(21,22,26,.92)', color: C.paper, fontFamily: F.text, fontSize: vertical ? 46 : 38, lineHeight: 1.3,
        padding: vertical ? '14px 26px' : '10px 22px', maxWidth: vertical ? 900 : 1400, textAlign: 'center', boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone'}}>{cue.text}</span>
    </div>
  );
};

/* ---------- a hand-drawn proofreader's ring that draws itself
   The loop is built in real pixels (viewBox = w x h, no stretching), so the stroke keeps its width and the
   draw-on runs along the true path. It makes one full turn plus a short overshoot, so the ring always closes
   over its own start, the way a red pen does. Before, the path ended ~8 units short of its start and never closed. */
const ringPath = (w: number, h: number) => {
  const cx = w / 2, cy = h / 2, rx = w / 2 - 3, ry = h / 2 - 3, steps = 120;
  const start = -Math.PI / 2, sweep = Math.PI * 2 + 0.38;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = start + (sweep * i) / steps;
    const wob = 1 + 0.025 * Math.sin(2 * t + 0.6);  // slight hand-drawn irregularity, deterministic
    pts.push(`${(cx + rx * wob * Math.cos(t)).toFixed(1)} ${(cy + ry * wob * Math.sin(t)).toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
};
export const Ring: React.FC<{p: number; w: number; h: number; color?: string; stroke?: number}> = ({p, w, h, color = C.magenta, stroke = 4}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: -w * .06, top: -h * .2, overflow: 'visible'}}>
    <path pathLength={1} d={ringPath(w, h)}
      fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
);

/** Highlighter sweep behind inline text. */
export const Mark: React.FC<{p: number; children: React.ReactNode; color?: string}> = ({p, children, color = C.yellow}) => (
  <span style={{backgroundImage: `linear-gradient(transparent 10%, ${color} 10%, ${color} 90%, transparent 90%)`,
    backgroundRepeat: 'no-repeat', backgroundSize: `${p * 100}% 100%`, padding: '0 .08em'}}>{children}</span>
);

export const Paper: React.FC<{dark?: boolean; children: React.ReactNode; opacity?: number}> = ({dark, children, opacity = 1}) => (
  <AbsoluteFill style={{background: dark ? C.key : C.paper, color: dark ? C.paper : C.key, opacity, overflow: 'hidden'}}>
    {children}
  </AbsoluteFill>
);

/** Frame-accurate counter. */
export const Count: React.FC<{from?: number; to: number; p: number; pad?: number}> = ({from = 0, to, p, pad = 0}) =>
  <>{String(Math.round(from + (to - from) * p)).padStart(pad, '0')}</>;

export const useScene = () => {
  const f = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  return {f, fps, width, height, s: (sec: number) => Math.round(sec * fps)};
};
