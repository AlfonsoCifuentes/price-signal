import React from 'react';
import {AbsoluteFill, Audio, Composition, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, Captions, Chrome, F, useFonts, Paper, prog, Cue, Ring, Mark, Locale, LocaleCtx} from './kit';
import {FILM_SCENES, It} from './scenes';
import {VERTICAL_SCENES} from './vertical';
import timeline from './timeline.json';
import data from './data.json';

type SceneLocale = {kicker: string; cues: Cue[]; audio: string | null};
type Scene = {id: string; kicker: string; frames: number; audio: string | null; audioOffsetFrames: number; cues: Cue[]; es: SceneLocale & {title: string}};
type Props = {captions: boolean; voice: boolean; locale: Locale};

const SceneFrame: React.FC<{kicker: string; cues: Cue[]; index: number; total: number; frames: number; audio: string | null; audioOffsetFrames: number;
  dark?: boolean; vertical?: boolean; captions: boolean; voice: boolean; children: React.ReactNode}> =
  ({kicker, cues, index, total, frames, audio, audioOffsetFrames, dark, vertical, captions, voice, children}) => {
    const f = useCurrentFrame();
    const o = interpolate(f, [0, 8, frames - 12, frames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <Paper dark={dark}>
        <AbsoluteFill style={{opacity: o}}>
          <Chrome kicker={kicker} index={index} total={total} dark={dark} vertical={vertical} />
          {children}
        </AbsoluteFill>
        {captions && <Captions cues={cues} vertical={vertical} dark={dark} />}
        {voice && audio && <Sequence from={audioOffsetFrames}><Audio src={staticFile(audio)} /></Sequence>}
      </Paper>
    );
  };

/* Background score: sits under the narration, dips while a take is speaking and fades in and out.
   Levels are relative to the score's normalised loudness (about -24 LUFS). */
const MUSIC = {film: 'audio/music-film.mp3', vertical: 'audio/music-film.mp3'} as const; // one 170 s score covers both cuts
const DUCK_DEPTH = 0.42;   // score level while speech is on (0.42 = about -7.5 dB)
const DUCK_RAMP = 12;      // frames to move between full and ducked (0.4 s at 30 fps)
const FADE_IN = 60;        // 2 s
const FADE_OUT = 120;      // 4 s
const musicVolume = (spans: {from: number; to: number}[], total: number) => (f: number) => {
  const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  let speech = 0;
  for (const s of spans) {
    speech = Math.max(speech, interpolate(f, [s.from - DUCK_RAMP, s.from, s.to, s.to + DUCK_RAMP], [0, 1, 1, 0], clamp));
  }
  const level = 1 - (1 - DUCK_DEPTH) * speech;
  const fadeIn = interpolate(f, [0, FADE_IN], [0, 1], clamp);
  const fadeOut = interpolate(f, [total - FADE_OUT, total], [1, 0], clamp);
  return level * Math.min(fadeIn, fadeOut);
};

const Reel: React.FC<Props & {kind: 'film' | 'vertical'}> = ({kind, captions, voice, locale}) => {
  useFonts();
  const scenes = (timeline[kind].scenes as Scene[]);
  const registry = kind === 'film' ? FILM_SCENES : VERTICAL_SCENES;
  const spans = timeline[kind].voiceSpans[locale];
  let from = 0;
  return (
    <LocaleCtx.Provider value={locale}>
      <AbsoluteFill style={{background: C.paper}}>
        {voice && <Audio src={staticFile(MUSIC[kind])} volume={musicVolume(spans, timeline[kind].frames)} />}
        {scenes.map((s, i) => {
          const start = from;
          from += s.frames;
          const {C: Body, dark} = registry[s.id];
          const text = locale === 'es' ? s.es : {kicker: s.kicker, cues: s.cues, audio: s.audio};
          return (
            <Sequence key={s.id} from={start} durationInFrames={s.frames} name={`${i + 1} · ${s.id}`}>
              <SceneFrame kicker={text.kicker} cues={text.cues} index={i} total={scenes.length} frames={s.frames} audio={text.audio}
                audioOffsetFrames={s.audioOffsetFrames} dark={dark} vertical={kind === 'vertical'} captions={captions} voice={voice}>
                <Body />
              </SceneFrame>
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </LocaleCtx.Provider>
  );
};

/* ---------- stills: thumbnail / OG / square share one layout that adapts to the canvas */
const Cover: React.FC<{w: number; h: number; locale: Locale}> = ({w, h, locale}) => {
  useFonts();
  const es = locale === 'es';
  const k = Math.min(w / 1280, h / 720);
  const square = w === h;
  const m = 56 * k;
  const strip = 25 * k;
  return (
    <LocaleCtx.Provider value={locale}>
      <Paper>
        <div style={{position: 'absolute', left: m, right: m, top: m * .8, display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontStretch: '87%', fontSize: 18 * k, letterSpacing: 1.4, textTransform: 'uppercase'}}>
          <span style={{fontFamily: F.display, fontWeight: 800, fontStretch: '112%', fontSize: 24 * k}}>PRICE<span style={{color: C.magenta, fontWeight: 400, fontStretch: '62%'}}>/</span>SIGNAL</span>
          <span style={{color: C.magenta, fontWeight: 600}}>{es ? 'Caso de análisis de datos' : 'Data analytics case study'}</span>
        </div>
        <div style={{position: 'absolute', left: m, top: (square ? 130 : 110) * k, fontFamily: F.display, fontWeight: 820, textTransform: 'uppercase', lineHeight: .84, letterSpacing: -4 * k}}>
          <div style={{fontSize: (square ? 230 : 196) * k, fontStretch: '62%'}}>{es ? 'El precio' : 'The price'}</div>
          <div style={{fontSize: (square ? (es ? 112 : 128) : (es ? 80 : 112)) * k, fontStretch: '125%', marginTop: 8 * k}}>{es ? 'de la claridad.' : 'of clarity.'}</div>
        </div>
        <div style={{position: 'absolute', right: m, top: square ? undefined : 118 * k, bottom: square ? 330 * k : undefined, textAlign: 'right', fontFamily: F.display, fontWeight: 780, fontStretch: '68%',
          fontSize: (square ? 170 : 150) * k, lineHeight: .85, letterSpacing: -4 * k, color: C.blue}}>
          {data.headline.consistent}<span style={{color: C.ink2, fontWeight: 300}}>/</span>{data.headline.comparables}
          <div style={{fontFamily: F.text, fontStretch: '100%', fontSize: 27 * k, fontWeight: 400, letterSpacing: 0, color: C.key, marginTop: 12 * k, lineHeight: 1.25}}>
            {es ? <>grupos comparables.<br /><It color={C.magenta}>2 eran errores de archivo.</It></> : <>comparable groups.<br /><It color={C.magenta}>2 were filing errors.</It></>}
          </div>
        </div>
        <div style={{position: 'absolute', left: m, right: m, bottom: m * 1.1, display: 'flex', alignItems: 'center', gap: 22 * k, background: '#f8eef2', borderTop: `${3 * k}px solid ${C.key}`,
          padding: `${20 * k}px ${24 * k}px`, fontFamily: F.mono, fontStretch: '87%', fontSize: strip, boxShadow: '0 30px 50px -36px rgba(21,22,26,.45)'}}>
          <span style={{position: 'relative', display: 'inline-block', fontWeight: 650, whiteSpace: 'nowrap'}}>Glasshouse English<Ring p={1} w={strip * 12.6} h={strip * 2.3} stroke={4} /></span>
          <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden'}}><Mark p={1}>Mosaic English</Mark> B1 Premium Pack</span>
          <span style={{fontWeight: 700}}><Mark p={1}>€69.49</Mark></span>
          <span style={{flex: 'none', width: 44 * k, height: 44 * k, borderRadius: '50%', border: `${3 * k}px solid ${C.magenta}`, color: C.magenta, display: 'grid', placeItems: 'center',
            fontFamily: F.display, fontWeight: 700, fontSize: 26 * k}}>?</span>
        </div>
      </Paper>
    </LocaleCtx.Provider>
  );
};

export const Root: React.FC = () => {
  const film = timeline.film.frames, vert = timeline.vertical.frames, fps = timeline.fps;
  const FilmC = (p: Props) => <Reel kind="film" {...p} />;
  const VertC = (p: Props) => <Reel kind="vertical" {...p} />;
  const en = {locale: 'en' as const, voice: false};
  const es = {locale: 'es' as const, voice: false};
  return (
    <>
      <Composition id="Film" component={FilmC} durationInFrames={film} fps={fps} width={1920} height={1080} defaultProps={{captions: false, ...en}} />
      <Composition id="FilmCaptioned" component={FilmC} durationInFrames={film} fps={fps} width={1920} height={1080} defaultProps={{captions: true, ...en}} />
      <Composition id="FilmVoice" component={FilmC} durationInFrames={film} fps={fps} width={1920} height={1080} defaultProps={{captions: false, locale: 'en', voice: true}} />
      <Composition id="Vertical" component={VertC} durationInFrames={vert} fps={fps} width={1080} height={1920} defaultProps={{captions: true, ...en}} />
      <Composition id="VerticalVoice" component={VertC} durationInFrames={vert} fps={fps} width={1080} height={1920} defaultProps={{captions: true, locale: 'en', voice: true}} />
      <Composition id="FilmEs" component={FilmC} durationInFrames={film} fps={fps} width={1920} height={1080} defaultProps={{captions: false, ...es}} />
      <Composition id="FilmCaptionedEs" component={FilmC} durationInFrames={film} fps={fps} width={1920} height={1080} defaultProps={{captions: true, ...es}} />
      <Composition id="VerticalEs" component={VertC} durationInFrames={vert} fps={fps} width={1080} height={1920} defaultProps={{captions: true, ...es}} />
      <Composition id="FilmEsVoice" component={FilmC} durationInFrames={film} fps={fps} width={1920} height={1080} defaultProps={{captions: false, locale: 'es', voice: true}} />
      <Composition id="VerticalEsVoice" component={VertC} durationInFrames={vert} fps={fps} width={1080} height={1920} defaultProps={{captions: true, locale: 'es', voice: true}} />
      <Composition id="Thumbnail" component={() => <Cover w={1280} h={720} locale="en" />} durationInFrames={1} fps={fps} width={1280} height={720} />
      <Composition id="OgCover" component={() => <Cover w={1200} h={630} locale="en" />} durationInFrames={1} fps={fps} width={1200} height={630} />
      <Composition id="Square" component={() => <Cover w={1080} h={1080} locale="en" />} durationInFrames={1} fps={fps} width={1080} height={1080} />
      <Composition id="ThumbnailEs" component={() => <Cover w={1280} h={720} locale="es" />} durationInFrames={1} fps={fps} width={1280} height={720} />
      <Composition id="OgCoverEs" component={() => <Cover w={1200} h={630} locale="es" />} durationInFrames={1} fps={fps} width={1200} height={630} />
      <Composition id="SquareEs" component={() => <Cover w={1080} h={1080} locale="es" />} durationInFrames={1} fps={fps} width={1080} height={1080} />
    </>
  );
};
