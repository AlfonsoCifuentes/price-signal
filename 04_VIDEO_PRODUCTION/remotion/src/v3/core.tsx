import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, prog, Ring} from '../kit';

/* Pricing Demo — shared system for the four narrated videos.
   Scenes are timed by the narration: every reveal waits for an {#anchor} word in scripts/<video>.json,
   resolved to a frame by tools/build_timeline_v3.py. Nothing is placed on a hand-written second. */

export {C, F, prog, Ring};
export type Lang = 'es' | 'en';
export type Cue = {text: string; from: number; to: number};
export type SceneData = {id: string; kicker: string; from: number; frames: number; audio: string; audioFrom: number;
  speechFrames: number; anchors: Record<string, number>; cues: Cue[]; words: {w: string; f: number; t: number}[]};

type Ctx = {lang: Lang; scene: SceneData; vertical: boolean};
export const SceneCtx = React.createContext<Ctx | null>(null);
const useCtx = () => {
  const c = React.useContext(SceneCtx);
  if (!c) throw new Error('scene context missing');
  return c;
};
export const useLang = () => useCtx().lang;
export const useT = () => {
  const l = useLang();
  return (es: string, en: string) => (l === 'es' ? es : en);
};
/** Frame (scene-local) at which an anchor word starts; offset in frames. Unknown anchors fail loudly. */
export const useA = () => {
  const {scene} = useCtx();
  return (name: string, offset = 0) => {
    const v = scene.anchors[name];
    if (v === undefined) throw new Error(`anchor ${name} missing in scene ${scene.id}`);
    return v + offset;
  };
};
export const useSceneInfo = () => useCtx().scene;

/* ---------- numbers in the reader's convention: 86,49 € / €86.49 · 13,8 % / 13.8% */
export const useFmt = () => {
  const l = useLang();
  return {
    eur: (v: number) => (l === 'es' ? `${v.toFixed(2).replace('.', ',')} €` : `€${v.toFixed(2)}`),
    pct: (v: number, sign = false) => {
      const s = (sign && v > 0 ? '+' : '') + v.toFixed(1);
      return l === 'es' ? `${s.replace('.', ',')} %` : `${s}%`;
    },
  };
};

/* ---------- motion */
export const inAt = (f: number, at: number, dur = 16) => prog(f, at, at + dur);
export const rise = (f: number, at: number, dist = 28, dur = 18): React.CSSProperties => {
  const p = prog(f, at, at + dur);
  return {opacity: p, transform: `translateY(${(1 - p) * dist}px)`};
};
export const fadeOutAt = (f: number, at: number, dur = 12) => 1 - prog(f, at, at + dur);

/* ---------- type */
export const Display: React.FC<{size: number; children: React.ReactNode; style?: React.CSSProperties; stretch?: number; weight?: number}> =
  ({size, children, style, stretch = 84, weight = 780}) => (
    <div style={{fontFamily: F.display, fontWeight: weight, fontStretch: `${stretch}%`, fontSize: size, lineHeight: .96,
      letterSpacing: -size * .026, ...style}}>{children}</div>
  );
export const Soft: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = C.blue}) =>
  <span style={{fontWeight: 380, color}}>{children}</span>;
export const Label: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> =
  ({children, color = C.magenta, size = 22, style}) => (
    <div style={{fontFamily: F.mono, fontStretch: '87%', fontWeight: 600, fontSize: size, letterSpacing: size * .07,
      textTransform: 'uppercase', color, ...style}}>{children}</div>
  );
export const Body: React.FC<{children: React.ReactNode; size?: number; style?: React.CSSProperties; color?: string}> =
  ({children, size = 34, style, color}) => (
    <div style={{fontFamily: F.text, fontSize: size, lineHeight: 1.32, color, ...style}}>{children}</div>
  );
export const Mono: React.FC<{children: React.ReactNode; size?: number; style?: React.CSSProperties}> = ({children, size = 28, style}) =>
  <span style={{fontFamily: F.mono, fontStretch: '87%', fontSize: size, ...style}}>{children}</span>;

/* ---------- brand: "Pricing Demo" with the proof slash, signed */
export const Brand: React.FC<{size: number; dark?: boolean; byline?: boolean; stretch?: number; style?: React.CSSProperties}> =
  ({size, dark, byline = true, stretch = 112, style}) => {
    const t = useT();
    return (
      <div style={style}>
        <div style={{fontFamily: F.display, fontWeight: 820, fontStretch: `${stretch}%`, fontSize: size, lineHeight: .9, letterSpacing: -size * .03,
          color: dark ? C.paper : C.key, whiteSpace: 'nowrap'}}>
          Pricing<span style={{color: dark ? C.pink : C.magenta, fontWeight: 300, fontStretch: '62%', margin: `0 ${size * .06}px`}}>/</span>Demo
        </div>
        {byline && <div style={{fontFamily: F.text, fontSize: Math.max(26, size * .2), marginTop: size * .16, color: dark ? '#c9cbd2' : C.ink2}}>
          {t('por', 'by')} <b style={{color: dark ? C.paper : C.key, fontWeight: 650}}>Alfonso Cifuentes</b>
        </div>}
      </div>
    );
  };

/* ---------- proof chrome: crop marks, running head, folio */
export const Chrome: React.FC<{kicker: string; index: number; total: number; dark?: boolean; vertical?: boolean}> =
  ({kicker, index, total, dark, vertical}) => {
    const t = useT();
    const fg = dark ? C.paper : C.key;
    const padX = vertical ? 70 : 72, top = vertical ? 150 : 62, bottom = vertical ? 300 : 40;
    const crop = (style: React.CSSProperties) => (
      <div style={{position: 'absolute', width: 30, height: 30, ...style}}>
        <div style={{position: 'absolute', width: 30, height: 2, background: fg, opacity: .75}} />
        <div style={{position: 'absolute', width: 2, height: 30, background: fg, opacity: .75}} />
      </div>
    );
    return (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        {!vertical && <>
          {crop({left: 26, top: 26})}
          {crop({right: 26, top: 26, transform: 'scaleX(-1)'})}
          {crop({left: 26, bottom: 26, transform: 'scaleY(-1)'})}
          {crop({right: 26, bottom: 26, transform: 'scale(-1)'})}
        </>}
        <div style={{position: 'absolute', top, left: padX, right: padX, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: F.mono, fontStretch: '87%', fontSize: vertical ? 24 : 20, letterSpacing: 1.6, color: fg, textTransform: 'uppercase'}}>
          <span style={{fontFamily: F.display, fontWeight: 800, fontStretch: '112%', fontSize: vertical ? 30 : 25, letterSpacing: .3, textTransform: 'none'}}>
            Pricing<span style={{color: dark ? C.pink : C.magenta, fontWeight: 300, fontStretch: '62%', margin: '0 4px'}}>/</span>Demo
          </span>
          <span style={{color: dark ? C.pink : C.magenta, fontWeight: 600}}>{String(index + 1).padStart(2, '0')} · {kicker}</span>
        </div>
        {!vertical && <div style={{position: 'absolute', bottom, left: padX, right: padX, display: 'flex', justifyContent: 'space-between',
          fontFamily: F.mono, fontStretch: '87%', fontSize: 15, letterSpacing: 1.2, color: dark ? '#9fa2ad' : C.ink2, textTransform: 'uppercase'}}>
          <span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <span>{t('Datos ficticios · caso de estudio independiente', 'Fictional data · independent case study')}</span>
        </div>}
      </AbsoluteFill>
    );
  };

/* ---------- burned-in captions (vertical cut: feeds autoplay muted). Safe zone: above the platform UI. */
export const Captions: React.FC<{cues: Cue[]; vertical?: boolean}> = ({cues, vertical}) => {
  const f = useCurrentFrame();
  const cue = cues.find(c => f >= c.from && f <= c.to);
  if (!cue) return null;
  const o = interpolate(f, [cue.from, cue.from + 3, cue.to - 3, cue.to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: vertical ? 70 : 0, right: vertical ? 170 : 0, bottom: vertical ? 470 : 70, display: 'flex',
      justifyContent: vertical ? 'flex-start' : 'center', opacity: o}}>
      <span style={{background: 'rgba(21,22,26,.94)', color: C.paper, fontFamily: F.text, fontWeight: 500, fontSize: vertical ? 46 : 36,
        lineHeight: 1.28, padding: vertical ? '14px 24px' : '10px 22px', whiteSpace: 'pre-line', textAlign: vertical ? 'left' : 'center',
        boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{cue.text}</span>
    </div>
  );
};

/* ---------- proof furniture */
/** A rubber stamp that lands with a slight overshoot. */
export const Stamp: React.FC<{at: number; children: React.ReactNode; color?: string; rotate?: number; size?: number; style?: React.CSSProperties}> =
  ({at, children, color = C.magenta, rotate = -6, size = 34, style}) => {
    const f = useCurrentFrame();
    const p = prog(f, at, at + 10);
    const s = interpolate(p, [0, .7, 1], [1.6, .96, 1]);
    return (
      <div style={{display: 'inline-block', border: `4px solid ${color}`, color, padding: `${size * .25}px ${size * .5}px`,
        fontFamily: F.mono, fontStretch: '87%', fontWeight: 700, fontSize: size, letterSpacing: size * .08, textTransform: 'uppercase',
        opacity: p, transform: `rotate(${rotate}deg) scale(${s})`, transformOrigin: 'center', background: 'rgba(251,251,248,.86)', ...style}}>
        {children}
      </div>
    );
  };

/** An index card on the proof sheet. */
export const Card: React.FC<{children: React.ReactNode; tone?: 'plain' | 'blue' | 'magenta' | 'dark'; style?: React.CSSProperties; dashed?: boolean}> =
  ({children, tone = 'plain', style, dashed}) => {
    const border = {plain: C.key, blue: C.blue, magenta: C.magenta, dark: C.key}[tone];
    const bg = {plain: C.sheet, blue: C.blueWash, magenta: '#f8eef2', dark: C.key}[tone];
    return (
      <div style={{background: bg, border: `3px ${dashed ? 'dashed' : 'solid'} ${border}`, color: tone === 'dark' ? C.paper : C.key,
        boxShadow: '0 28px 50px -36px rgba(21,22,26,.55)', ...style}}>{children}</div>
    );
  };

/** Horizontal arrow drawn on a rule. */
export const Arrow: React.FC<{p: number; length: number; color?: string; vertical?: boolean; style?: React.CSSProperties}> =
  ({p, length, color = C.magenta, vertical, style}) => (
    <svg width={vertical ? 40 : length} height={vertical ? length : 40} style={{overflow: 'visible', ...style}}>
      {vertical
        ? <path d={`M20 0 V${length - 4} M6 ${length - 18} L20 ${length - 2} L34 ${length - 18}`} fill="none" stroke={color} strokeWidth={4}
            strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        : <path d={`M0 20 H${length - 4} M${length - 18} 6 L${length - 2} 20 L${length - 18} 34`} fill="none" stroke={color} strokeWidth={4}
            strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />}
    </svg>
  );

/** Strike-through drawn left to right across its content. */
export const Strike: React.FC<{p: number; children: React.ReactNode; color?: string; thick?: number}> = ({p, children, color = C.magenta, thick = 6}) => (
  <span style={{position: 'relative', display: 'inline-block'}}>
    {children}
    <span style={{position: 'absolute', left: -6, top: '50%', height: thick, marginTop: -thick / 2, width: `calc(${p * 100}% + ${p * 12}px)`,
      background: color, borderRadius: thick}} />
  </span>
);

/** Highlighter sweep. */
export const Hi: React.FC<{p: number; children: React.ReactNode; color?: string}> = ({p, children, color = C.yellow}) => (
  <span style={{backgroundImage: `linear-gradient(transparent 8%, ${color} 8%, ${color} 92%, transparent 92%)`, backgroundRepeat: 'no-repeat',
    backgroundSize: `${p * 100}% 100%`, padding: '0 .08em'}}>{children}</span>
);

/** Tick / cross in a circle. */
export const Mark: React.FC<{ok: boolean; p: number; size?: number}> = ({ok, p, size = 56}) => (
  <div style={{width: size, height: size, borderRadius: '50%', border: `4px solid ${ok ? C.blue : C.magenta}`, display: 'grid', placeItems: 'center',
    color: ok ? C.blue : C.magenta, fontFamily: F.display, fontWeight: 700, fontSize: size * .58, opacity: p, transform: `scale(${.6 + .4 * p})`, flex: 'none'}}>
    {ok ? '✓' : '✕'}
  </div>
);

export const useFV = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return {f, width, height};
};
