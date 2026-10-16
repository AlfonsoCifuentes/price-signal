import React from 'react';
import {Composition} from 'remotion';
import {Cover, Reel, VIDEOS, VideoId} from './v3/Video';

/* Pricing Demo — four narrated videos (ElevenLabs synthetic voices) and their stills.
   Durations come from src/timeline_v3.json, built from the real narration by tools/build_timeline_v3.py. */
const IDS: [VideoId, string][] = [['horizontal_es', 'HorizontalEs'], ['horizontal_en', 'HorizontalEn'], ['vertical_es', 'VerticalEs'], ['vertical_en', 'VerticalEn']];

export const Root: React.FC = () => (
  <>
    {IDS.map(([id, name]) => {
      const v = VIDEOS[id];
      const Comp = (p: {captions: boolean; music: boolean}) => <Reel video={id} {...p} />;
      return <Composition key={id} id={name} component={Comp} durationInFrames={v.frames} fps={v.fps} width={v.width} height={v.height}
        defaultProps={{captions: v.format === 'vertical', music: true}} />;
    })}
    {(['es', 'en'] as const).map(l => {
      const L = l === 'es' ? 'Es' : 'En';
      return (
        <React.Fragment key={l}>
          <Composition id={`Thumbnail${L}`} component={() => <Cover w={1280} h={720} lang={l} kind="thumb" />} durationInFrames={1} fps={30} width={1280} height={720} />
          <Composition id={`OgCover${L}`} component={() => <Cover w={1200} h={630} lang={l} kind="og" />} durationInFrames={1} fps={30} width={1200} height={630} />
          <Composition id={`Square${L}`} component={() => <Cover w={1080} h={1080} lang={l} kind="square" />} durationInFrames={1} fps={30} width={1080} height={1080} />
          <Composition id={`VerticalPoster${L}`} component={() => <Cover w={1080} h={1920} lang={l} kind="vposter" />} durationInFrames={1} fps={30} width={1080} height={1920} />
        </React.Fragment>
      );
    })}
  </>
);
