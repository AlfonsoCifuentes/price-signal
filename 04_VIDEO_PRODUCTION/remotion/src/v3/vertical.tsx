import React from 'react';
import {interpolate} from 'remotion';
import {Arrow, Body, Brand, C, Card, Display, F, fadeOutAt, Hi, inAt, Label, Mono, prog, Ring, rise, Soft, Stamp, Strike,
  useA, useFmt, useFV, useT} from './core';
import data from './data.json';

/* Vertical standalone cut, 1080×1920, its own story (plan §6.4–6.5): context → challenge → discovery → result.
   Safe zone for feed UI: content between y≈250 and y≈1300, nothing in the right 170 px; captions sit above the bottom UI. */
const H = data.headline;
const X = 70, W = 840;

const VOrigin: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT();
  const stretch = interpolate(prog(f, 4, 40), [0, 1], [62, 96]);
  const arrow = inAt(f, a('rebuild', -4), 16);
  return (
    <>
      <Label size={24} style={{position: 'absolute', left: X, top: 260, ...rise(f, 2)}}>{t('Caso de estudio · análisis de datos', 'Case study · data analytics')}</Label>
      <div style={{position: 'absolute', left: X - 4, top: 310, ...rise(f, 4, 40, 20)}}><Brand size={124} stretch={stretch} /></div>
      <Card style={{position: 'absolute', left: X, top: 640, width: W, padding: '28px 32px', ...rise(f, a('test'), 30)}}>
        <Label color={C.ink2} size={20}>{t('El origen', 'Where it started')}</Label>
        <Display size={60} style={{marginTop: 10}}>{t('Una prueba técnica real', 'A real technical assessment')}</Display>
        <Body size={30} color={C.ink2} style={{marginTop: 10}}>{t('Proceso de selección · puesto de analista de datos', 'Recruitment process · data analyst role')}</Body>
      </Card>
      <div style={{position: 'absolute', left: X + 380, top: 900, opacity: arrow}}><Arrow p={arrow} length={90} vertical /></div>
      <Card tone="blue" style={{position: 'absolute', left: X, top: 1010, width: W, padding: '28px 32px', ...rise(f, a('rebuild'), 30)}}>
        <Label color={C.blue} size={20}>{t('Lo que ves aquí', 'What you see here')}</Label>
        <Display size={60} style={{marginTop: 10}}>{t('Un caso independiente', 'An independent rebuild')}</Display>
        <div style={{marginTop: 30}}><Stamp at={a('fictional')} size={28} rotate={-3}>{t('Libros y precios ficticios', 'Fictional books and prices')}</Stamp></div>
      </Card>
    </>
  );
};

const VChallenge: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT(), {eur} = useFmt();
  const focus = data.focus as unknown as Record<string, {lines: {configuration: string; cells: Record<string, {price: number}[]>}[]}>;
  const p = (conf: string, lv: string) => focus['Glasshouse English'].lines.find(l => l.configuration === conf)!.cells[lv][0].price;
  const split = prog(f, a('attrs'), a('attrs', 30));
  const ATTRS: [string, string, string][] = [[t('Nivel', 'Level'), 'B1', 'B1'], [t('Edición', 'Edition'), '—', '—'],
    [t('Formato', 'Format'), 'Student Book', 'Premium Pack'], [t('Incluye', 'Includes'), t('libro', 'book'), t('libro + digital', 'book + digital')]];
  return (
    <>
      <Display size={92} style={{position: 'absolute', left: X, top: 260, width: W, ...rise(f, 2)}}>
        {t('Analizar los precios', 'Analyse the prices')}<br /><Soft>{t('de un catálogo editorial.', 'of a publishing catalogue.')}</Soft>
      </Display>
      <div style={{position: 'absolute', left: X, top: 560, width: W, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}>
        {[['Student Book', p('Student Book', 'B1')], ['Premium Pack with Digital', p('Student Book · Premium Pack', 'B1')]].map(([n, v], i) => (
          <Card key={n as string} tone={split > .5 ? 'magenta' : 'plain'} style={{padding: '22px 24px', ...rise(f, a('trap', i * 8), 24)}}>
            <Mono size={22}>Glasshouse English B1<br />{n}</Mono>
            <Display size={64} style={{marginTop: 12}}>{eur(v as number)}</Display>
          </Card>
        ))}
      </div>
      <div style={{position: 'absolute', left: X, top: 860, width: W, borderTop: `2px solid ${C.key}`, opacity: inAt(f, a('attrs', -4))}}>
        {ATTRS.map(([k, l, r], i) => {
          const differ = l !== r;
          return (
            <div key={k} style={{display: 'grid', gridTemplateColumns: '210px 1fr 1fr', padding: '14px 0', borderBottom: `2px dashed ${C.rule}`,
              alignItems: 'center', ...rise(f, a('attrs', 4 + i * 10), 14, 12)}}>
              <Label color={C.ink2} size={20}>{k}</Label>
              <Mono size={26} style={{color: differ ? C.magenta : C.key, fontWeight: differ ? 700 : 400}}>{l}</Mono>
              <Mono size={26} style={{color: differ ? C.magenta : C.key, fontWeight: differ ? 700 : 400}}>{r}</Mono>
            </div>
          );
        })}
      </div>
      <Body size={34} style={{position: 'absolute', left: X, top: 1160, width: W, color: C.magenta, ...rise(f, a('attrs', 60))}}>
        {t('No es el mismo producto: no se comparan.', 'Not the same product: no comparison.')}
      </Body>
    </>
  );
};

const VDiscovery: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT();
  const exc = data.exceptions;
  const size = 68, gap = 10, cols = 10;
  return (
    <>
      <Label color={C.ink2} size={22} style={{position: 'absolute', left: X, top: 260, ...rise(f, 0)}}>{t(`${H.comparables} grupos de productos equivalentes`, `${H.comparables} groups of equivalent products`)}</Label>
      <div style={{position: 'absolute', left: X, top: 310}}>
        {Array.from({length: H.comparables}, (_, i) => {
          const e = i >= H.consistent ? exc[i - H.consistent] : null;
          const col = i % cols, row = Math.floor(i / cols);
          let fill = C.blue, border = C.blue, txt = '', color = C.paper;
          if (e) {
            fill = 'transparent'; border = f >= a('six') ? C.magenta : C.blue;
            if (e.kind === 'starter-pricing' && f >= a('four')) { border = C.blue; txt = 'S'; color = C.blue; }
            if (e.kind === 'misfiled-record' && f >= a('two')) { txt = '?'; color = C.magenta; }
          }
          return <div key={i} style={{position: 'absolute', left: col * (size + gap), top: row * (size + gap), width: size, height: size, opacity: inAt(f, 4 + i * .6, 10),
            background: fill, border: `3px solid ${border}`, display: 'grid', placeItems: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 28, color}}>{txt}</div>;
        })}
      </div>
      <Display size={78} style={{position: 'absolute', left: X, top: 800, width: W, ...rise(f, a('six'))}}>
        <span style={{color: C.magenta}}>{H.exceptions}</span> {t('posibles excepciones', 'possible exceptions')}
      </Display>
      <div style={{position: 'absolute', left: X, top: 920, width: W, display: 'flex', flexDirection: 'column', gap: 16}}>
        <Card tone="blue" style={{padding: '18px 24px', ...rise(f, a('four'), 20)}}>
          <Label color={C.blue} size={20}>S · {H.exceptions_starter} Starter</Label>
          <Body size={30} style={{marginTop: 6}}>{t('Nivel inicial más barato', 'Cheaper entry level')}</Body>
        </Card>
        <Card tone="magenta" style={{padding: '18px 24px', ...rise(f, a('two'), 20)}}>
          <Label size={20}>? · {H.exceptions_misfiled} {t('serie equivocada', 'wrong series')}</Label>
          <Body size={30} style={{marginTop: 6}}>{t('Libros archivados en otra colección', 'Books filed under another series')}</Body>
        </Card>
      </div>
      <div style={{position: 'absolute', left: X, top: 1215}}>
        <Stamp at={a('reveal', 20)} size={32} rotate={-3}>{t('Error de datos, no de precio', 'Data error, not pricing')}</Stamp>
      </div>
    </>
  );
};

const VResult: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT(), {eur} = useFmt();
  const m = data.traps.series_mismatch[0];
  const focus = data.focus as unknown as Record<string, {lines: {configuration: string; cells: Record<string, {row_id: number; price: number}[]>}[]}>;
  const strayPrice = focus['Glasshouse English'].lines.find(l => l.configuration === 'Student Book · Premium Pack')!.cells['B1'].find(c => c.row_id === m.row_id)!.price;
  const move = prog(f, 20, 70);
  const fixed = f >= a('r56');
  const out = fadeOutAt(f, a('web', -8), 12);
  return (
    <>
      <div style={{opacity: out}}>
        <Label color={C.ink2} size={20} style={{position: 'absolute', left: X, top: 260, ...rise(f, 0)}}>{t(`Registro ${m.row_id}`, `Record ${m.row_id}`)}</Label>
        <Card style={{position: 'absolute', left: X, top: 300, width: W, padding: '22px 26px', ...rise(f, 2)}}>
          <div style={{display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 12, alignItems: 'center'}}>
            <Mono size={20} style={{color: C.ink2}}>Series</Mono>
            <span style={{position: 'relative', display: 'inline-block', justifySelf: 'start'}}>
              <Mono size={28} style={{fontWeight: 650, opacity: 1 - move * .65}}><Strike p={move}>Glasshouse English</Strike></Mono>
              <Ring p={prog(f, 4, 26)} w={350} h={60} />
            </span>
            <span />
            <Mono size={28} style={{color: C.blue, fontWeight: 700, opacity: move}}>→ Mosaic English</Mono>
            <Mono size={20} style={{color: C.ink2}}>Title</Mono>
            <Mono size={24}><Hi p={prog(f, 10, 26)}>Mosaic English</Hi> B1 Premium Pack</Mono>
            <Mono size={20} style={{color: C.ink2}}>Price</Mono>
            <Mono size={26} style={{fontWeight: 700}}>{eur(strayPrice)}</Mono>
          </div>
          <Label color={C.blue} size={18} style={{marginTop: 16}}>{t('Origen intacto · se reubica solo en el análisis', 'Source untouched · re-filed in the reporting view only')}</Label>
        </Card>
        <div style={{position: 'absolute', left: X, top: 760, opacity: inAt(f, a('result', -4))}}>
          <Label color={C.ink2} size={22}>{t('Grupos con precio uniforme', 'Groups with one price')}</Label>
          <div style={{fontFamily: F.display, fontWeight: 780, fontStretch: '68%', fontSize: 170, letterSpacing: -5, lineHeight: .95, marginTop: 6,
            color: fixed ? C.ink2 : C.key}}>
            {fixed ? <Strike p={prog(f, a('r56'), a('r56', 10))} color={C.ink2} thick={8}>{H.consistent}</Strike> : H.consistent}
            <span style={{fontWeight: 300, color: C.ink2}}>/{H.comparables}</span>
          </div>
          <div style={{fontFamily: F.display, fontWeight: 780, fontStretch: '68%', fontSize: 250, letterSpacing: -8, lineHeight: .9, color: C.blue,
            opacity: inAt(f, a('r56'), 10)}}>
            {H.consistent_after_series_repair}<span style={{fontWeight: 300, color: C.ink2}}>/{H.comparables_after_series_repair}</span>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: X, top: 330, width: W, opacity: inAt(f, a('web'), 14)}}>
        <Display size={70} style={{width: W}}>{t('Primero, la comparabilidad.', 'Comparability first.')}<br /><Soft color={C.magenta}>{t('Después, el precio.', 'Then, the price.')}</Soft></Display>
        <Label color={C.ink2} size={20} style={{marginTop: 60}}>{t('Caso completo, datos y fórmulas', 'Full case, data and formulas')}</Label>
        <Mono size={31} style={{display: 'block', marginTop: 10, fontWeight: 600}}>pricingdemo-alfonsocifuentes<br />.vercel.app</Mono>
        <div style={{marginTop: 70, ...rise(f, a('sign'), 24)}}><Brand size={118} /></div>
        <Label color={C.ink2} size={15} style={{marginTop: 40, lineHeight: 1.6, opacity: inAt(f, a('sign', 24))}}>
          {t('Datos ficticios · voz sintética (ElevenLabs)', 'Fictional data · synthetic voice (ElevenLabs)')}
        </Label>
      </div>
    </>
  );
};

export const VERTICAL: Record<string, {C: React.FC; dark?: boolean}> = {
  v_origin: {C: VOrigin}, v_challenge: {C: VChallenge}, v_discovery: {C: VDiscovery}, v_result: {C: VResult},
};
