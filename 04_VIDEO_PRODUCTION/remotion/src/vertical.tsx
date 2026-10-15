import React from 'react';
import {interpolate} from 'remotion';
import {C, F, Count, eur, fadeUp, Mark, prog, Ring, useIsEs, useScene, useT} from './kit';
import {It, Label, Mono} from './scenes';
import data from './data.json';

const H = data.headline;
const X = 72;
const Big: React.FC<{children: React.ReactNode; f: number; at?: number; top: number; size?: number}> = ({children, f, at = 4, top, size = 128}) => (
  <div style={{position: 'absolute', left: X, right: X, top, fontFamily: F.display, fontWeight: 790, fontStretch: '80%', fontSize: size, lineHeight: .95,
    letterSpacing: -size * .03, ...fadeUp(f, at, 40, 22)}}>{children}</div>
);

const VHook: React.FC = () => {
  const {f} = useScene();
  const t = useT(), es = useIsEs();
  const ring = prog(f, 90, 120), mk = prog(f, 120, 140);
  const card = (series: string, title: React.ReactNode, price: React.ReactNode, at: number, odd?: boolean) => (
    <div style={{background: odd ? '#f8eef2' : C.sheet, padding: '28px 30px', borderBottom: `3px dashed ${C.rule}`, fontFamily: F.mono, fontStretch: '87%', ...fadeUp(f, at, 20, 16)}}>
      <div style={{fontSize: 28, color: odd ? C.key : C.ink2, fontWeight: odd ? 650 : 400, position: 'relative', display: 'inline-block'}}>
        {series}{odd && <Ring p={ring} w={380} h={60} />}
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 36, gap: 20}}>
        <span>{title}</span><span style={{fontWeight: 650}}>{price}</span>
      </div>
    </div>
  );
  return (
    <>
      <Big f={f} top={210} size={es ? 124 : 150}>{t('Is this book', '¿Este libro')}<br /><It>{t('priced wrong?', 'tiene mal el precio?')}</It></Big>
      <div style={{position: 'absolute', left: X, right: X, top: 720, borderTop: `3px solid ${C.key}`, boxShadow: '0 30px 60px -40px rgba(21,22,26,.5)'}}>
        {card('Glasshouse English', 'B1 Premium Pack', '€86.49', 40)}
        {card('Glasshouse English', <><Mark p={mk}>Mosaic English</Mark> B1 Premium</>, <Mark p={mk}>€69.49</Mark>, 50, true)}
        {card('Glasshouse English', 'B2 Premium Pack', '€86.49', 60)}
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 1290, fontFamily: F.text, fontSize: 46, lineHeight: 1.3, ...fadeUp(f, 160)}}>
        {t('Or is it a', 'O es un')} <b style={{color: C.magenta}}>{t('different product', 'producto distinto')}</b>{t(', filed in the wrong place?', ', archivado en el sitio equivocado?')}
      </div>
    </>
  );
};

const VScale: React.FC = () => {
  const {f} = useScene();
  const t = useT(), es = useIsEs();
  return (
    <>
      <div style={{position: 'absolute', left: X - 8, top: 230, fontFamily: F.display, fontWeight: 780, fontStretch: '62%', fontSize: 470, lineHeight: .85, letterSpacing: -14,
        color: C.blue}}><Count to={H.products} p={prog(f, 6, 70)} pad={3} /></div>
      <Big f={f} at={40} top={680} size={es ? 96 : 110}>{t('fictional textbooks.', 'libros de texto ficticios.')}<br /><It>{t(`${H.series} invented series.`, `${H.series} series inventadas.`)}</It></Big>
      <div style={{position: 'absolute', left: X, right: X, top: 990, borderTop: `3px solid ${C.key}`}}>
        {data.series.slice(0, 5).map((s, i) => (
          <div key={s.series} style={{display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${C.rule}`, ...fadeUp(f, 60 + i * 8, 14, 14)}}>
            <span style={{fontFamily: F.display, fontWeight: 700, fontStretch: '88%', fontSize: 42}}>{s.series}</span>
            <Mono size={28} style={{color: C.ink2}}>{s.records}</Mono>
          </div>
        ))}
        <Label color={C.ink2} size={26} style={{marginTop: 18, ...fadeUp(f, 120)}}>
          {t('+ 7 more · no real publisher, no real prices', '+ 7 más · sin editorial real, sin precios reales')}
        </Label>
      </div>
    </>
  );
};

const VTrap: React.FC = () => {
  const {f} = useScene();
  const t = useT();
  const items = [
    [t('Misfiled series', 'Series mal archivadas')],
    [t('Ambiguous bundle names', 'Nombres de packs ambiguos')],
    [t('Two spellings of one edition', 'Dos grafías de una misma edición')],
    [t('An unexplained “TB” at ', 'Un «TB» sin explicar a ') + eur(data.traps.tb_outlier.price)],
  ];
  return (
    <>
      <Label size={30} style={{position: 'absolute', left: X, top: 220, ...fadeUp(f, 0)}}>{t('The traps', 'Las trampas')}</Label>
      <div style={{position: 'absolute', left: X - 6, top: 270, fontFamily: F.display, fontWeight: 800, fontStretch: '72%', fontSize: 250, letterSpacing: -8, lineHeight: 1, ...fadeUp(f, 4, 40)}}>
        Gle<Mark p={prog(f, 30, 50)}>ebook</Mark>
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 590, fontFamily: F.text, fontSize: 46, lineHeight: 1.3, ...fadeUp(f, 50)}}>
        {t('A printed resource. A naive parser grants it', 'Un recurso impreso. Un analizador ingenuo le concede')} <b style={{color: C.magenta}}>{t('digital access', 'acceso digital')}</b>.
      </div>
      {items.map(([text], i) => (
        <div key={i} style={{position: 'absolute', left: X, right: X, top: 900 + i * 120, display: 'flex', gap: 28, alignItems: 'center', ...fadeUp(f, 100 + i * 14)}}>
          <div style={{flex: 'none', width: 64, height: 64, borderRadius: '50%', border: `4px solid ${C.magenta}`, color: C.magenta, display: 'grid', placeItems: 'center',
            fontFamily: F.display, fontWeight: 700, fontSize: 36}}>?</div>
          <span style={{fontFamily: F.display, fontWeight: 720, fontStretch: '88%', fontSize: 52}}>{text}</span>
        </div>
      ))}
    </>
  );
};

const VFinding: React.FC = () => {
  const {f} = useScene();
  const t = useT();
  const fixed = prog(f, 170, 200);
  const size = 80, gap = 12, cols = 10;
  return (
    <>
      <div style={{position: 'absolute', left: X, top: 200, fontFamily: F.display, fontWeight: 780, fontStretch: '68%', fontSize: 300, lineHeight: .85, letterSpacing: -10,
        color: fixed > .5 ? C.blue : C.key, ...fadeUp(f, 0, 40)}}>
        {fixed > .5 ? H.consistent_after_series_repair : H.consistent}<span style={{color: C.ink2, fontWeight: 300}}>/</span>{H.comparables}
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 470, fontFamily: F.text, fontSize: 44, lineHeight: 1.3, ...fadeUp(f, 20)}}>
        {fixed > .5
          ? <>{t('after re-filing the', 'tras reubicar los')} <b style={{color: C.magenta}}>{H.exceptions_misfiled} {t('filing errors', 'errores de archivo')}</b>.</>
          : <>{t('comparable groups hold one price at every level.', 'grupos comparables mantienen un mismo precio en todos los niveles.')}</>}
      </div>
      <div style={{position: 'absolute', left: X, top: 680}}>
        {Array.from({length: H.comparables}, (_, i) => {
          const e = i >= H.consistent ? data.exceptions[i - H.consistent] : null;
          const mis = e?.kind === 'misfiled-record';
          const blue = !e || (mis && fixed > .5);
          return (
            <div key={i} style={{position: 'absolute', left: (i % cols) * (size + gap), top: Math.floor(i / cols) * (size + gap), width: size, height: size,
              opacity: prog(f, 20 + i * 1.3, 32 + i * 1.3), background: blue ? C.blue : 'transparent', border: `4px solid ${e && !blue && mis ? C.magenta : C.blue}`,
              display: 'grid', placeItems: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 32, color: blue ? C.paper : (mis ? C.magenta : C.blue)}}>
              {e ? (mis ? (fixed > .5 ? '✓' : 'M') : 'S') : ''}
            </div>
          );
        })}
      </div>
    </>
  );
};

const VCta: React.FC = () => {
  const {f} = useScene();
  const t = useT();
  const stretch = interpolate(prog(f, 6, 50), [0, 1], [62, 110]);
  return (
    <>
      <div style={{position: 'absolute', left: X, top: 380, fontFamily: F.display, fontWeight: 820, fontStretch: `${stretch}%`, fontSize: 200, lineHeight: .88, letterSpacing: -4, ...fadeUp(f, 0, 40)}}>
        PRICE<span style={{color: C.pink, fontWeight: 300, fontStretch: '62%'}}>/</span><br />SIGNAL
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 860, fontFamily: F.text, fontSize: 54, lineHeight: 1.3, ...fadeUp(f, 40)}}>
        {t('Dataset, method and interactive walkthrough:', 'Dataset, método y recorrido interactivo:')} <span style={{color: C.pink}}>{t('link in the post.', 'enlace en la publicación.')}</span>
      </div>
      <Label color="#9fa2ad" size={26} style={{position: 'absolute', left: X, right: X, top: 1180, lineHeight: 1.7, ...fadeUp(f, 80)}}>
        {t('Everything is invented · reproducible from seed 20261011', 'Todo es inventado · reproducible con la semilla 20261011')}
      </Label>
    </>
  );
};

export const VERTICAL_SCENES: Record<string, {C: React.FC; dark?: boolean}> = {
  'v-hook': {C: VHook}, 'v-scale': {C: VScale}, 'v-trap': {C: VTrap}, 'v-finding': {C: VFinding}, 'v-cta': {C: VCta, dark: true},
};
