import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {useFonts, Paper} from '../kit';
import {Brand, C, Captions, Chrome, F, Label, Lang, Mono, SceneCtx, SceneData, Stamp} from './core';
import {HORIZONTAL} from './horizontal';
import {VERTICAL} from './vertical';
import timeline from './timeline';
import data from './data.json';

export type VideoId = 'horizontal_es' | 'horizontal_en' | 'vertical_es' | 'vertical_en';
type Video = {id: VideoId; lang: Lang; format: 'horizontal' | 'vertical'; width: number; height: number; fps: number; frames: number;
  scenes: SceneData[]; speech: {from: number; to: number}[]};
export const VIDEOS = timeline as unknown as Record<VideoId, Video>;

/* Music bed: ElevenLabs instrumental, normalised to -24 LUFS. It ducks under every narration span and is
   offset so that its own resolved ending lands on the last frame of the video. */
// 'seconds' is where each score becomes inaudible (ffmpeg silencedetect -50 dB), not the file length
const MUSIC = {horizontal: {file: 'audio/music-horizontal.mp3', seconds: 229.6}, vertical: {file: 'audio/music-vertical.mp3', seconds: 73.1}};
const BED = 0.62, DUCK = 0.30, RAMP = 10, FADE_IN = 45, FADE_OUT = 20;
const musicVolume = (spans: {from: number; to: number}[], total: number) => (f: number) => {
  const c = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  let speech = 0;
  for (const s of spans) speech = Math.max(speech, interpolate(f, [s.from - RAMP, s.from, s.to, s.to + RAMP], [0, 1, 1, 0], c));
  const level = BED - (BED - DUCK) * speech;
  return level * Math.min(interpolate(f, [0, FADE_IN], [0, 1], c), interpolate(f, [total - FADE_OUT, total], [1, 0], c));
};

const SceneFrame: React.FC<{video: Video; scene: SceneData; index: number; dark?: boolean; captions: boolean; children: React.ReactNode}> =
  ({video, scene, index, dark, captions, children}) => {
    const f = useCurrentFrame();
    const vertical = video.format === 'vertical';
    const o = interpolate(f, [0, 8, scene.frames - 10, scene.frames], [index === 0 ? 1 : 0, 1, 1, index === video.scenes.length - 1 ? 1 : 0],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <SceneCtx.Provider value={{lang: video.lang, scene, vertical}}>
        <Paper dark={dark}>
          <AbsoluteFill style={{opacity: o}}>
            <Chrome kicker={scene.kicker} index={index} total={video.scenes.length} dark={dark} vertical={vertical} />
            {children}
          </AbsoluteFill>
          {captions && <Captions cues={scene.cues} vertical={vertical} />}
          <Sequence from={scene.audioFrom}><Audio src={staticFile(scene.audio)} /></Sequence>
        </Paper>
      </SceneCtx.Provider>
    );
  };

export const Reel: React.FC<{video: VideoId; captions: boolean; music?: boolean}> = ({video, captions, music = true}) => {
  useFonts();
  const v = VIDEOS[video];
  const registry = v.format === 'horizontal' ? HORIZONTAL : VERTICAL;
  const m = MUSIC[v.format];
  const startFrom = Math.max(0, Math.round((m.seconds - v.frames / v.fps + 0.3) * v.fps));
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {music && <Audio src={staticFile(m.file)} startFrom={startFrom} volume={musicVolume(v.speech, v.frames)} />}
      {v.scenes.map((s, i) => {
        const {C: Body, dark} = registry[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.frames} name={`${i + 1} · ${s.id}`}>
            <SceneFrame video={v} scene={s} index={i} dark={dark} captions={captions}><Body /></SceneFrame>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- stills: YouTube thumbnail, Open Graph card, square, and a poster per video.
   They introduce the case (origin, author, question) before any figure, like the website hero. */
export const Cover: React.FC<{w: number; h: number; lang: Lang; kind: 'thumb' | 'og' | 'square' | 'vposter'}> = ({w, h, lang, kind}) => {
  useFonts();
  const es = lang === 'es';
  const vertical = kind === 'vposter';
  const k = vertical ? w / 1080 : Math.min(w / 1280, h / 720);
  const m = (vertical ? 70 : 60) * k;
  const H = data.headline;
  const ctx = {lang, vertical, scene: {id: 'cover', kicker: '', from: 0, frames: 1, audio: '', audioFrom: 0, speechFrames: 0, anchors: {}, cues: [], words: []}};
  return (
    <SceneCtx.Provider value={ctx}>
      <Paper>
        <div style={{position: 'absolute', left: m, right: m, top: (vertical ? 260 : 46) * k, display: 'flex', justifyContent: 'space-between',
          fontFamily: F.mono, fontStretch: '87%', fontSize: 18 * k, letterSpacing: 1.4, textTransform: 'uppercase', color: C.magenta, fontWeight: 600}}>
          <span>{es ? 'Caso de estudio · análisis de datos' : 'Data analytics case study'}</span>
          {!vertical && <span style={{color: C.ink2}}>{es ? 'Datos ficticios' : 'Fictional data'}</span>}
        </div>
        <div style={{position: 'absolute', left: m - 4 * k, top: (vertical ? 320 : kind === 'square' ? 120 : 92) * k}}>
          <Brand size={(vertical ? 124 : kind === 'square' ? 128 : 116) * k} stretch={vertical ? 96 : 104} />
        </div>
        <div style={{position: 'absolute', left: m, width: (vertical ? 900 : kind === 'square' ? 900 : 720) * k, top: (vertical ? 690 : kind === 'square' ? 470 : 335) * k,
          fontFamily: F.display, fontWeight: 760, fontStretch: '84%', fontSize: (vertical ? 66 : kind === 'square' ? 58 : 46) * k, lineHeight: 1.02, letterSpacing: -1 * k}}>
          {es ? <>¿Precios distintos <span style={{color: C.blue, fontWeight: 380}}>o productos distintos?</span></>
              : <>Different prices, <span style={{color: C.blue, fontWeight: 380}}>or different products?</span></>}
        </div>
        <div style={{position: 'absolute', left: m, top: (vertical ? 960 : kind === 'square' ? 680 : 470) * k, width: (vertical ? 900 : 720) * k,
          fontFamily: F.text, fontSize: (vertical ? 32 : 22) * k, lineHeight: 1.35, color: C.ink2}}>
          {es ? 'De una prueba técnica real a un caso independiente con 362 productos ficticios.'
              : 'From a real technical assessment to an independent case with 362 fictional products.'}
        </div>
        {kind !== 'og' && <div style={{position: 'absolute', right: vertical ? undefined : m, left: vertical ? m : undefined,
          top: (vertical ? 1120 : kind === 'square' ? 820 : 300) * k, textAlign: vertical ? 'left' : 'right'}}>
          <div style={{fontFamily: F.display, fontWeight: 780, fontStretch: '68%', fontSize: (vertical ? 190 : kind === 'square' ? 150 : 170) * k, lineHeight: .85,
            letterSpacing: -5 * k, color: C.blue}}>
            {H.consistent}<span style={{color: C.ink2, fontWeight: 300}}>→</span>{H.consistent_after_series_repair}
          </div>
          <Label color={C.ink2} size={17 * k} style={{marginTop: 8 * k}}>{es ? `grupos con un único precio, de ${H.comparables}` : `groups with one price, out of ${H.comparables}`}</Label>
        </div>}
        {kind === 'og' && <div style={{position: 'absolute', right: m, top: 520 * k}}>
          <Stamp at={-20} size={26 * k} rotate={-5}>{es ? 'Prueba técnica → caso público' : 'Assessment → public case'}</Stamp>
        </div>}
        <Mono size={(vertical ? 24 : 16) * k} style={{position: 'absolute', left: m, bottom: (vertical ? 330 : 40) * k, color: C.ink2}}>pricingdemo-alfonsocifuentes.vercel.app</Mono>
      </Paper>
    </SceneCtx.Provider>
  );
};
