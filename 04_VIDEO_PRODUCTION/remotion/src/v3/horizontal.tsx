import React from 'react';
import {interpolate} from 'remotion';
import {Arrow, Body, Brand, C, Card, Display, F, fadeOutAt, Hi, inAt, Label, Mark, Mono, prog, Ring, rise, Soft, Stamp, Strike,
  useA, useFmt, useFV, useLang, useSceneInfo, useT} from './core';
import data from './data.json';

/* Horizontal explainer, 1920×1080. Order of the story (plan §6.1): who and what → business problem → data and method
   → six exceptions → root cause → other traps and limits → close. Every figure is read from data.json. */
const H = data.headline;
const L = 110;
type Line = {configuration: string; stable: boolean; cells: Record<string, {row_id: number; price: number; title: string; flags: string[]}[]>};
const focus = data.focus as unknown as Record<string, {levels: string[]; lines: Line[]}>;
const line = (series: string, conf: string) => focus[series].lines.find(l => l.configuration === conf)!;
const price = (series: string, conf: string, level: string) => line(series, conf).cells[level][0].price;

/* ------------------------------------------------------------------ 1 · origin */
const Origin: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT();
  const stretch = interpolate(prog(f, 6, 46), [0, 1], [62, 112]);
  const card2 = inAt(f, a('rebuild'), 18);
  return (
    <>
      <Label color={C.magenta} size={24} style={{position: 'absolute', left: L, top: 150, ...rise(f, 2)}}>
        {t('Caso de estudio de análisis de datos · proyecto de portfolio', 'Data analytics case study · portfolio project')}
      </Label>
      <div style={{position: 'absolute', left: L - 6, top: 200, ...rise(f, 4, 40, 22)}}>
        <Brand size={196} stretch={stretch} />
      </div>
      {/* assessment → reconstruction */}
      <div style={{position: 'absolute', left: L, top: 610, display: 'flex', alignItems: 'stretch', gap: 30}}>
        <Card style={{width: 760, padding: '30px 36px', ...rise(f, a('test'), 30)}}>
          <Label color={C.ink2} size={20}>{t('El origen', 'Where it started')}</Label>
          <Display size={54} style={{marginTop: 12}}>{t('Una prueba técnica real', 'A real technical assessment')}</Display>
          <Body size={27} color={C.ink2} style={{marginTop: 12}}>
            {t('Proceso de selección · puesto de análisis de datos · editorial educativa internacional',
              'Recruitment process · data analyst role · international educational publisher')}
          </Body>
          <div style={{marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8}}>
            {[[t('Ordenar un catálogo de productos', 'Structure a product catalogue'), 0],
              [t('Comparar precios de productos equivalentes', 'Compare prices of equivalent products'), 1],
              [t('Explicar qué merece investigarse', 'Explain what deserves investigation'), 2]].map(([s, i]) => (
              <Mono key={s as string} size={23} style={{...rise(f, a('task', 8 + (i as number) * 12), 12), display: 'block'}}>→ {s}</Mono>
            ))}
          </div>
        </Card>
        <div style={{display: 'grid', placeItems: 'center', opacity: card2}}><Arrow p={card2} length={110} /></div>
        <Card tone="blue" style={{width: 760, padding: '30px 36px', ...rise(f, a('rebuild'), 30), position: 'relative'}}>
          <Label color={C.blue} size={20}>{t('Lo que ves aquí', 'What you see here')}</Label>
          <Display size={54} style={{marginTop: 12}}>{t('Un caso independiente', 'An independent rebuild')}</Display>
          <Body size={27} color={C.ink2} style={{marginTop: 12}}>
            {t('Mismo tipo de reto, reconstruido desde cero: títulos, colecciones y precios inventados.',
              'The same kind of challenge, rebuilt from scratch: invented titles, series and prices.')}
          </Body>
          <div style={{position: 'absolute', right: 30, bottom: 26}}>
            <Stamp at={a('fictional')} size={30}>{t('Datos ficticios', 'Fictional data')}</Stamp>
          </div>
        </Card>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 2 · problem */
const VARIANTS: [string, string][] = [['Student Book', 'libro del alumno'], ['Workbook', 'cuaderno'], ['Workbook with Answer Key', 'con soluciones'],
  ['Digital Workbook', 'acceso digital'], ['Premium Pack with Digital', 'pack'], ['Starter · A1 · A2 · B1 · B2 · C1', 'niveles'], ['Second Edition', 'edición']];
const Problem: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT(), {eur} = useFmt(), es = useLang() === 'es';
  const sb = price('Glasshouse English', 'Student Book', 'A2');
  const pk = price('Glasshouse English', 'Student Book · Premium Pack', 'A2');
  const sbB1 = price('Glasshouse English', 'Student Book', 'B1');
  const wrongOut = fadeOutAt(f, a('question', -6), 14);
  const strike = prog(f, a('wrong', 40), a('wrong', 60));
  const good = inAt(f, a('question', 6), 18);
  return (
    <>
      <Display size={86} style={{position: 'absolute', left: L, top: 140, width: 1200, ...rise(f, 2)}}>
        {t('Parece una lista de precios.', 'It looks like a price list.')}<br /><Soft>{t('Es una lista de productos distintos.', 'It is a list of different products.')}</Soft>
      </Display>
      {/* one course branches into its variants */}
      <div style={{position: 'absolute', left: L, top: 395, display: 'flex', alignItems: 'center', gap: 26, opacity: wrongOut}}>
        <Card style={{padding: '18px 24px', ...rise(f, 10)}}>
          <Label color={C.ink2} size={17}>{t('Un curso', 'One course')}</Label>
          <Mono size={30} style={{fontWeight: 650}}>Glasshouse English B1</Mono>
        </Card>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, width: 1250}}>
          {VARIANTS.map(([en, esl], i) => (
            <div key={en} style={{...rise(f, a('variants', 4 + i * 9), 16, 14), border: `2px solid ${C.blue}`, background: C.blueWash, padding: '10px 14px'}}>
              <Mono size={22} style={{color: C.blue}}>{en}</Mono>
              {es && <span style={{fontFamily: F.text, fontSize: 18, color: C.ink2, marginLeft: 8}}>({esl})</span>}
            </div>
          ))}
        </div>
      </div>
      {/* wrong comparison, struck */}
      <div style={{position: 'absolute', left: L, top: 640, display: 'flex', alignItems: 'center', gap: 34, opacity: wrongOut * inAt(f, a('wrong'), 16)}}>
        <Card style={{padding: '22px 28px', width: 600}}><Mono size={25}>Glasshouse English A2<br />Student Book</Mono><Display size={58} style={{marginTop: 8}}>{eur(sb)}</Display></Card>
        <Display size={64} style={{color: C.magenta}}>≠</Display>
        <Card style={{padding: '22px 28px', width: 600}}><Mono size={25}>Glasshouse English A2<br />Premium Pack with Digital</Mono><Display size={58} style={{marginTop: 8}}>{eur(pk)}</Display></Card>
        <div style={{width: 330}}>
          <Label size={20} style={{opacity: strike}}>{t('Comparación no válida', 'Not a valid comparison')}</Label>
          <Body size={28} style={{marginTop: 8, opacity: strike}}><Strike p={strike}>{t(`«${eur(pk - sb)} más caro»`, `“${eur(pk - sb)} dearer”`)}</Strike></Body>
          <Body size={24} color={C.ink2} style={{marginTop: 6, opacity: strike}}>{t('Son productos distintos.', 'They are different products.')}</Body>
        </div>
      </div>
      {/* the fair comparison: only the level changes */}
      <div style={{position: 'absolute', left: L, top: 450, display: 'flex', alignItems: 'center', gap: 34, opacity: good}}>
        <Card tone="blue" style={{padding: '22px 28px', width: 600}}><Mono size={25}>Glasshouse English <b>A2</b><br />Student Book</Mono><Display size={58} style={{marginTop: 8}}>{eur(sb)}</Display></Card>
        <Display size={64} style={{color: C.blue}}>=</Display>
        <Card tone="blue" style={{padding: '22px 28px', width: 600}}><Mono size={25}>Glasshouse English <b>B1</b><br />Student Book</Mono><Display size={58} style={{marginTop: 8}}>{eur(sbB1)}</Display></Card>
        <Mark ok p={good} size={70} />
      </div>
      <Display size={70} style={{position: 'absolute', left: L, top: 760, width: 1700, ...rise(f, a('real'), 24)}}>
        {t('¿Qué productos se pueden', 'Which products can')} <Soft color={C.magenta}>{t('comparar de verdad?', 'fairly be compared?')}</Soft>
      </Display>
      <Label color={C.ink2} size={20} style={{position: 'absolute', left: L, top: 870, ...rise(f, a('real', 12))}}>
        {t('Mismo producto, misma edición, mismo contenido: solo cambia el nivel', 'Same product, same edition, same contents: only the level changes')}
      </Label>
    </>
  );
};

/* ------------------------------------------------------------------ 3 · method */
const RAW = ['Series', 'Segment', 'Sub-Segment', 'Title', 'Price_EUR'];
const NEW = ['Edition', 'Level', 'Level_System', 'Product_Type', 'Product_Role', 'Book_Part', 'Pack_Type', 'Answer_Support',
  'Digital_Main_Book_Access', 'Digital_Practice_Book_Access', 'Audio_Access', 'App_Access', 'Additional_Resources', 'Access_Duration'];
const KEY: [string, string][] = [['serie', 'series'], ['tipo', 'type'], ['función', 'role'], ['parte', 'part'], ['pack', 'pack'], ['soluciones', 'answer key'],
  ['digital ×2', 'digital ×2'], ['recursos', 'resources'], ['edición', 'edition']];
const Chip: React.FC<{children: React.ReactNode; tone?: 'raw' | 'new'; size?: number}> = ({children, tone = 'raw', size = 21}) => (
  <div style={{fontFamily: F.mono, fontStretch: '87%', fontSize: size, padding: '9px 12px', border: `2px solid ${tone === 'raw' ? C.key : C.blue}`,
    background: tone === 'raw' ? C.sheet : C.blueWash, color: tone === 'raw' ? C.key : C.blue, whiteSpace: 'nowrap'}}>{children}</div>
);
const Method: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT();
  const n = prog(f, a('n362'), a('n362', 40));
  const phase2 = f >= a('layers', -8);
  const out1 = fadeOutAt(f, a('layers', -8), 12);
  return (
    <>
      {/* catalogue + fields */}
      <div style={{opacity: out1}}>
        <div style={{position: 'absolute', left: L - 8, top: 130, fontFamily: F.display, fontWeight: 780, fontStretch: '62%', fontSize: 300, lineHeight: .85,
          letterSpacing: -9, color: C.blue, fontVariantNumeric: 'tabular-nums', opacity: inAt(f, 4, 14)}}>{String(Math.round(H.products * n)).padStart(3, '0')}</div>
        <Label color={C.ink2} size={20} style={{position: 'absolute', left: L, top: 440, ...rise(f, 6)}}>{t('La versión pública · generador con semilla 20261011', 'The public version · seeded generator 20261011')}</Label>
        <Display size={56} style={{position: 'absolute', left: L + 560, top: 170, width: 640, ...rise(f, a('n362', 10))}}>
          {t('registros ficticios', 'fictional records')}<br /><Soft>{t(`en ${H.series} colecciones inventadas`, `across ${H.series} invented series`)}</Soft>
        </Display>
        <div style={{position: 'absolute', left: 1330, top: 140, width: 480, borderTop: `2px solid ${C.key}`, opacity: fadeOutAt(f, a('fields', 20), 14)}}>
          {data.series.map((s, i) => (
            <div key={s.series} style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.rule}`, ...rise(f, a('n362', 6 + i * 3), 10, 10)}}>
              <span style={{fontFamily: F.display, fontWeight: 700, fontStretch: '88%', fontSize: 24}}>{s.series}</span>
              <Mono size={16} style={{color: C.ink2}}>{s.records}</Mono>
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: L, top: 520, display: 'flex', gap: 24, alignItems: 'flex-start'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <Label color={C.key} size={18} style={rise(f, a('fields'))}>{t('5 campos de origen', '5 raw fields')}</Label>
            {RAW.map((c, i) => <div key={c} style={rise(f, a('fields', 4 + i * 4), 12, 12)}><Chip>{c}</Chip></div>)}
          </div>
          <div style={{paddingTop: 150, opacity: inAt(f, a('fields', 30))}}><Arrow p={inAt(f, a('fields', 30), 20)} length={90} /></div>
          <div style={{width: 1330}}>
            <Label color={C.blue} size={18} style={rise(f, a('fields', 34))}>{t('+14 atributos enriquecidos = 19', '+14 enriched attributes = 19')}</Label>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8}}>
              {NEW.map((c, i) => <div key={c} style={rise(f, a('fields', 40 + i * 5), 14, 12)}><Chip tone="new">{c}</Chip></div>)}
            </div>
          </div>
        </div>
      </div>
      {phase2 && <>
        {/* source and reporting view as two layers */}
        <Display size={80} style={{position: 'absolute', left: L, top: 150, width: 820, ...rise(f, a('layers'))}}>
          {t('El origen no se toca.', 'The source stays as it is.')}<br /><Soft>{t('Las correcciones, al lado.', 'Corrections sit beside it.')}</Soft>
        </Display>
        {[
          [t('01 · Archivo de origen', '01 · Source file'), t('Tal como llegó. Nunca se edita.', 'As received. Never edited.'), 'plain'],
          [t('02 · Vista de análisis', '02 · Reporting view'), t('Alias y reubicaciones, reversibles y documentadas.', 'Aliases and re-filing, reversible and logged.'), 'blue'],
        ].map(([k, d, tone], i) => (
          <Card key={k} tone={tone as 'plain' | 'blue'} style={{position: 'absolute', left: 1040 + i * 60, top: 150 + i * 150, width: 700, padding: '24px 30px',
            ...rise(f, a('layers', 10 + i * 18), 30)}}>
            <Label color={i ? C.blue : C.key} size={20}>{k}</Label>
            <Body size={29} style={{marginTop: 10}}>{d}</Body>
          </Card>
        ))}
        {/* the comparison key */}
        <div style={{position: 'absolute', left: L, top: 560, width: 1700}}>
          <Label color={C.ink2} size={20} style={rise(f, a('groups'))}>{t('Clave de comparación', 'Comparison key')}</Label>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, alignItems: 'center'}}>
            {KEY.map(([e, n2], i) => (
              <div key={e} style={{...rise(f, a('groups', 6 + i * 4), 12, 12), border: `2px solid ${C.key}`, padding: '10px 14px', background: C.sheet}}>
                <Mono size={24}>{t(e, n2)}</Mono>
              </div>
            ))}
            <span style={{fontFamily: F.display, fontSize: 48, color: C.ink2, margin: '0 8px', opacity: inAt(f, a('level', -6))}}>+</span>
            <div style={{...rise(f, a('level'), 12, 14), border: `4px solid ${C.magenta}`, padding: '10px 16px', background: '#f8eef2', position: 'relative'}}>
              <Mono size={28} style={{color: C.magenta, fontWeight: 700}}>{t('nivel', 'level')}</Mono>
            </div>
          </div>
          <Body size={32} style={{marginTop: 26, width: 1500, ...rise(f, a('level', 14))}}>
            {t('Diez atributos fijos. Una sola cosa puede variar: el nivel. ', 'Ten attributes held fixed. Only one thing may vary: the level. ')}
            <span style={{color: C.ink2}}>{t(`Resultado: ${H.groups_total} grupos, ${H.comparables} con más de un nivel.`, `Result: ${H.groups_total} groups, ${H.comparables} spanning more than one level.`)}</span>
          </Body>
        </div>
      </>}
    </>
  );
};

/* ------------------------------------------------------------------ squares (exceptions) */
const Grid60: React.FC<{left: number; top: number; size: number; cols: number; gap?: number; mode: 'flag' | 'resolve'}> = ({left, top, size, cols, gap = 12, mode}) => {
  const {f} = useFV();
  const a = useA();
  const exc = data.exceptions;   // 4 starter, then 2 misfiled
  const show = mode === 'flag' ? 6 : 0;  // the grid builds while the sentence starts; the count lands on «sixty»
  return (
    <div style={{position: 'absolute', left, top}}>
      {Array.from({length: H.comparables}, (_, i) => {
        const e = i >= H.consistent ? exc[i - H.consistent] : null;
        const col = i % cols, row = Math.floor(i / cols);
        const appear = mode === 'flag' ? inAt(f, show + i * Math.min(1.6, (a('g60') - show) / H.comparables), 10) : 1;
        let fill = C.blue, border = C.blue, txt = '', color = C.paper;
        if (mode === 'flag') {
          const settled = f >= a('u54');
          if (!e) { fill = settled ? C.blue : 'transparent'; border = C.blue; }
          else {
            const flagged = f >= a('x6');
            fill = 'transparent'; border = flagged ? C.magenta : C.blue;
            const starter = e.kind === 'starter-pricing';
            if (starter && f >= a('starter')) { border = C.blue; txt = 'S'; color = C.blue; }
            if (!starter && f >= a('two')) { txt = '?'; color = C.magenta; }
          }
        } else {
          const fixed = f >= a('r56');
          if (e) {
            const starter = e.kind === 'starter-pricing';
            fill = starter ? 'transparent' : (fixed ? C.blue : 'transparent');
            border = starter ? C.blue : (fixed ? C.blue : C.magenta);
            txt = starter ? 'S' : (fixed ? '✓' : '?');
            color = starter ? C.blue : (fixed ? C.paper : C.magenta);
          }
        }
        return (
          <div key={i} style={{position: 'absolute', left: col * (size + gap), top: row * (size + gap), width: size, height: size, opacity: appear,
            background: fill, border: `3px solid ${border}`, display: 'grid', placeItems: 'center', fontFamily: F.mono, fontWeight: 700,
            fontSize: size * .38, color}}>{txt}</div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ 4 · exceptions */
const Exceptions: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT();
  const count = f < a('u54') ? H.comparables : H.consistent;
  return (
    <>
      <Grid60 left={L} top={170} size={86} cols={10} mode="flag" />
      <div style={{position: 'absolute', left: 1180, top: 160, width: 640}}>
        <Label color={C.ink2} size={20} style={rise(f, 8)}>{t('Agrupando productos comparables', 'Grouping comparable products')}</Label>
        <div style={{fontFamily: F.display, fontWeight: 780, fontStretch: '68%', fontSize: 220, lineHeight: .9, letterSpacing: -7,
          color: f < a('u54') ? C.key : C.blue, ...rise(f, a('g60'))}}>
          {count}{f >= a('u54') && <span style={{color: C.ink2, fontWeight: 300}}>/{H.comparables}</span>}
        </div>
        <Body size={30} style={{marginTop: 6, ...rise(f, a('u54'))}}>
          {t('mantienen el mismo precio en todos los niveles.', 'hold one price at every level.')}
        </Body>
        <Body size={30} style={{marginTop: 18, color: C.magenta, ...rise(f, a('x6'))}}>
          <b>{H.exceptions}</b> {t('no lo mantienen.', 'do not.')}
        </Body>
      </div>
      <div style={{position: 'absolute', left: L, top: 780, width: 1700, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 50}}>
        <Card tone="blue" style={{padding: '22px 28px', ...rise(f, a('starter'), 24)}}>
          <Label color={C.blue} size={20}>S · {H.exceptions_starter} {t('Starter más barato', 'cheaper Starter')}</Label>
          <Body size={27} style={{marginTop: 8}}>
            {t('¿Política de entrada? Posible. ', 'An entry-level policy? Possible. ')}
            <span style={{color: C.ink2, opacity: inAt(f, a('policy', 20))}}>{t('Un precio de lista no prueba la intención.', 'A list price cannot prove intent.')}</span>
          </Body>
        </Card>
        <Card tone="magenta" dashed style={{padding: '22px 28px', ...rise(f, a('two'), 24)}}>
          <Label size={20}>? · {H.exceptions_misfiled} {t('por investigar', 'to investigate')}</Label>
          <Body size={27} style={{marginTop: 8}}>{t('Otro tipo de problema. Todavía sin explicar.', 'A different kind of problem. Not explained yet.')}</Body>
        </Card>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 5 · root cause */
const Finding: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT(), {eur} = useFmt();
  const PP = 'Student Book · Premium Pack';
  const gl = line('Glasshouse English', PP), mo = line('Mosaic English', PP);
  const levels = focus['Glasshouse English'].levels;
  const m = data.traps.series_mismatch[0], m2 = data.traps.series_mismatch[1];
  const stray = gl.cells['B1'].find(c => c.row_id === m.row_id)!;
  const normal = gl.cells['B1'].find(c => c.row_id !== m.row_id)!;
  const dup = inAt(f, a('clue', 30), 14);
  const ring = prog(f, a('mismatch', 4), a('mismatch', 34));
  const hl = prog(f, a('mismatch', 30), a('mismatch', 46));
  const fake = inAt(f, a('looked'), 14);
  const fakeStrike = prog(f, a('real'), a('real', 16));
  const move = prog(f, a('move', 6), a('move', 46));
  const result = f >= a('result', -10);
  const ROW = 62, W = 780, TOP = 300;
  const rowStyle = (odd?: boolean): React.CSSProperties => ({display: 'grid', gridTemplateColumns: '110px 1fr 140px', alignItems: 'center', height: ROW,
    padding: '0 18px', borderBottom: `2px dashed ${C.rule}`, fontFamily: F.mono, fontStretch: '87%', fontSize: 23, background: odd ? '#f8eef2' : C.sheet});
  // the stray record: starts as a 7th row under Glasshouse, moves into the empty B1 slot of Mosaic English
  const strayTop = TOP + 2 + interpolate(move, [0, 1], [6 * ROW + 14, 3 * ROW]);
  const strayLeft = L + move * (W + 150);
  const out = fadeOutAt(f, a('result', -10), 12);
  return (
    <>
      <div style={{opacity: out}}>
        <Label color={C.ink2} size={20} style={{position: 'absolute', left: L, top: 140, ...rise(f, 0)}}>
          {t('Campo de serie: Glasshouse English · Premium Pack with Digital', 'Series field: Glasshouse English · Premium Pack with Digital')}
        </Label>
        <Display size={46} style={{position: 'absolute', left: L, top: 180, width: W, ...rise(f, 4)}}>
          {t('El nivel B1 aparece', 'Level B1 appears')} <Soft color={C.magenta}>{t('dos veces.', 'twice.')}</Soft>
        </Display>
        <div style={{position: 'absolute', left: L, top: TOP, width: W, borderTop: `2px solid ${C.key}`, ...rise(f, 6)}}>
          {levels.map(l => (
            <div key={l} style={{...rowStyle(), background: l === 'B1' ? `rgba(255,225,77,${dup * .55})` : C.sheet}}>
              <b>{l}</b><span>{l === 'B1' ? `#${normal.row_id}` : ''} Glasshouse English {l}</span><span style={{textAlign: 'right', fontWeight: 650}}>{eur(gl.cells[l].find(c => c.row_id !== m.row_id)!.price)}</span>
            </div>
          ))}
        </div>
        {/* destination column */}
        <Label color={C.blue} size={20} style={{position: 'absolute', left: L + W + 150, top: TOP - 44, opacity: inAt(f, a('move', -10), 14)}}>
          {t('Su serie real: Mosaic English', 'Its real series: Mosaic English')}</Label>
        <div style={{position: 'absolute', left: L + W + 150, top: TOP, width: W, opacity: inAt(f, a('move', -10), 14)}}>
          <div style={{borderTop: `2px solid ${C.key}`}}>
            {levels.map(l => mo.cells[l]
              ? <div key={l} style={rowStyle()}><b>{l}</b><span>Mosaic English {l}</span><span style={{textAlign: 'right', fontWeight: 650}}>{eur(mo.cells[l][0].price)}</span></div>
              : <div key={l} style={{height: ROW, border: `3px dashed ${C.blue}`, opacity: 1 - move, display: 'grid', placeItems: 'center'}}>
                  <Mono size={18} style={{color: C.blue}}>{t('hueco B1', 'empty B1 slot')}</Mono></div>)}
          </div>
        </div>
        {/* the stray record */}
        <div style={{position: 'absolute', left: strayLeft, top: strayTop, width: W, ...rise(f, a('clue', 30), 10),
          boxShadow: move > 0 && move < 1 ? '0 26px 40px -24px rgba(21,22,26,.55)' : undefined, border: `3px solid ${move >= 1 ? C.blue : C.magenta}`}}>
          <div style={{...rowStyle(true), background: move >= 1 ? C.blueWash : '#f8eef2', borderBottom: 'none'}}>
            <b>B1 <span style={{fontWeight: 400, color: C.ink2}}>#{stray.row_id}</span></b>
            <span style={{position: 'relative', whiteSpace: 'nowrap'}}><Hi p={hl}>Mosaic English</Hi> B1 Premium Pack</span>
            <span style={{textAlign: 'right', fontWeight: 650}}>{eur(stray.price)}</span>
          </div>
        </div>
        {/* series field vs title */}
        <div style={{position: 'absolute', left: L + W + 150, top: TOP, width: W, opacity: inAt(f, a('mismatch'), 14) * (1 - inAt(f, a('move', -12), 10))}}>
          <Card style={{padding: '26px 30px'}}>
            <Label color={C.ink2} size={18}>{t(`Registro ${stray.row_id}, tal como consta`, `Record ${stray.row_id}, as recorded`)}</Label>
            <div style={{display: 'grid', gridTemplateColumns: '170px 1fr', rowGap: 18, marginTop: 18, alignItems: 'center'}}>
              <Mono size={20} style={{color: C.ink2}}>Series</Mono>
              <span style={{position: 'relative', display: 'inline-block', fontFamily: F.mono, fontSize: 28, fontWeight: 650, justifySelf: 'start'}}>
                Glasshouse English<Ring p={ring} w={400} h={70} />
              </span>
              <Mono size={20} style={{color: C.ink2}}>Title</Mono>
              <Mono size={26}><Hi p={hl}>Mosaic English</Hi> B1 Premium Pack with Digital</Mono>
              <Mono size={20} style={{color: C.ink2}}>Price</Mono>
              <span style={{fontFamily: F.display, fontSize: 40, fontWeight: 760}}>{eur(stray.price)}
                <span style={{marginLeft: 22, fontSize: 32, color: C.magenta, opacity: fake}}>
                  <Strike p={fakeStrike}>{t(`¿${eur(stray.price - normal.price)}?`, `${eur(stray.price - normal.price)}?`).replace('€-', '−€').replace('-', '−')}</Strike>
                </span>
              </span>
            </div>
          </Card>
          <div style={{marginTop: 26, opacity: inAt(f, a('real', 8))}}>
            <Stamp at={a('real', 8)} size={30} rotate={-4}>{t('Clasificación, no precio', 'Filing, not pricing')}</Stamp>
          </div>
        </div>
        <Body size={26} color={C.ink2} style={{position: 'absolute', left: L, top: TOP + 7 * ROW + 50, width: 1700, ...rise(f, a('move', 50))}}>
          {t(`Origen intacto. Solo la vista de análisis lo reubica. Segundo caso: registro ${m2.row_id}, ${m2.title.replace(' with Digital', '')}, archivado como ${m2.series_field}.`,
            `Source untouched; only the reporting view re-files it. Second case: record ${m2.row_id}, ${m2.title.replace(' with Digital', '')}, filed as ${m2.series_field}.`)}
        </Body>
      </div>
      {result && <ResultPanel />}
    </>
  );
};
const ResultPanel: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT();
  const fixed = f >= a('r56');
  const p = inAt(f, a('result', -6), 16);
  return (
    <>
      <Grid60 left={L} top={190} size={70} cols={10} mode="resolve" />
      <div style={{position: 'absolute', left: 1050, top: 170, width: 780, opacity: p}}>
        <Label color={C.ink2} size={20}>{t('Mismo denominador: 60 grupos', 'Same denominator: 60 groups')}</Label>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 26, marginTop: 10}}>
          <div style={{fontFamily: F.display, fontWeight: 780, fontStretch: '68%', fontSize: 170, letterSpacing: -5, lineHeight: .9, color: fixed ? C.ink2 : C.key}}>
            {fixed ? <Strike p={prog(f, a('r56'), a('r56', 12))} color={C.ink2} thick={8}>{H.consistent}</Strike> : H.consistent}
            <span style={{fontWeight: 300, color: C.ink2}}>/{H.comparables}</span>
          </div>
          <div style={{fontFamily: F.display, fontWeight: 780, fontStretch: '68%', fontSize: 210, letterSpacing: -6, lineHeight: .9, color: C.blue,
            opacity: inAt(f, a('r56'), 12)}}>
            {H.consistent_after_series_repair}<span style={{fontWeight: 300, color: C.ink2}}>/{H.comparables_after_series_repair}</span>
          </div>
        </div>
        <Body size={30} style={{marginTop: 20, opacity: inAt(f, a('r56', 14))}}>
          {t(`${H.consistent_pct.toFixed(1).replace('.', ',')} % → ${H.consistent_pct_after_series_repair.toFixed(1).replace('.', ',')} % de grupos con un único precio.`,
            `${H.consistent_pct.toFixed(1)}% → ${H.consistent_pct_after_series_repair.toFixed(1)}% of groups with a single price.`)}
        </Body>
        <Body size={26} color={C.ink2} style={{marginTop: 14, opacity: inAt(f, a('r56', 24))}}>
          {t('Se corrigió la clasificación para el análisis, no los precios. Quedan 4 casos Starter.',
            'The classification was corrected for analysis, not the prices. Four Starter cases remain.')}
        </Body>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 6 · other traps and limits */
const Limits: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT(), {eur, pct} = useFmt();
  const T = data.traps;
  const ll = T.split_volumes[0];
  const strictLevels = H.split_levels_strict, mixedLevels = H.split_levels_edition_mixed;
  const dark = prog(f, a('cannot', -10), a('cannot', 6));
  const cards: {at: string; label: string; body: React.ReactNode}[] = [
    {at: 'edition', label: t('Edición', 'Edition'), body: <><Mono size={26}>Second Edition</Mono><br /><Mono size={26}>2nd Edition</Mono>
      <Body size={22} color={C.ink2} style={{marginTop: 10}}>{t('Misma edición, dos grafías: se normaliza solo en el análisis.', 'One edition, two spellings: aliased in reporting only.')}</Body></>},
    {at: 'gleebook', label: t('Falso «ebook»', 'False “ebook”'), body: <><div style={{fontFamily: F.display, fontWeight: 800, fontStretch: '78%', fontSize: 64}}>Gle<Hi p={inAt(f, a('gleebook', 20), 14)}>ebook</Hi></div>
      <Body size={22} color={C.ink2} style={{marginTop: 6}}>{t('Recurso impreso. Una regla por subcadena lo haría digital.', 'A printed resource. A substring rule would make it digital.')}</Body></>},
    {at: 'tb', label: t('Código sin definir', 'Undefined code'), body: <><div style={{fontFamily: F.display, fontWeight: 780, fontSize: 60}}>TB · {eur(T.tb_outlier.price)}</div>
      <Body size={22} color={C.ink2} style={{marginTop: 6}}>{t('Único precio fuera del rango IQR. Categoría sin resolver; no se adivina.', 'Only price above the IQR fence. Category left unresolved, not guessed.')}</Body></>},
    {at: 'ab', label: t('Partes A + B', 'Parts A + B'), body: <><div style={{fontFamily: F.display, fontWeight: 780, fontSize: 52}}>{eur(ll.parts_total)} <span style={{color: C.ink2, fontWeight: 400, fontSize: 34}}>vs</span> {eur(ll.complete)}</div>
      <Body size={22} color={C.ink2} style={{marginTop: 6}}>{t(`${pct(ll.premium_pct, true)} (${ll.series}). Comparación estricta en ${strictLevels} de 12 niveles; en ${mixedLevels}, orientativa por etiquetas de edición distintas.`,
        `${pct(ll.premium_pct, true)} (${ll.series}). Strict match at ${strictLevels} of 12 levels; ${mixedLevels} are indicative (edition labels differ).`)}</Body></>},
  ];
  return (
    <>
      <div style={{opacity: 1 - dark}}>
        <Display size={80} style={{position: 'absolute', left: L, top: 140, ...rise(f, 2)}}>{t('Otras trampas del catálogo', 'Other traps in the catalogue')}</Display>
        <div style={{position: 'absolute', left: L, top: 290, width: 1700, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30}}>
          {cards.map(c => (
            <Card key={c.at} style={{padding: '22px 28px', minHeight: 200, ...rise(f, a(c.at), 26)}}>
              <Label size={19}>{c.label}</Label>
              <div style={{marginTop: 10}}>{c.body}</div>
            </Card>
          ))}
        </div>
        <Body size={30} style={{position: 'absolute', left: L, top: 850, width: 1700, ...rise(f, a('questions'))}}>
          <b>{t('Lo que hace el análisis:', 'What the analysis does:')}</b> {t('detectarlas y convertirlas en preguntas concretas para el equipo comercial.', 'detect them and turn them into specific questions for the commercial team.')}
        </Body>
      </div>
      {dark > 0 && <div style={{position: 'absolute', inset: 0, background: C.key, opacity: dark}}>
        <Label color={C.pink} size={24} style={{position: 'absolute', left: L, top: 150}}>{t('No está en los datos', 'Not in the data')}</Label>
        <div style={{position: 'absolute', left: L, top: 210, display: 'flex', flexWrap: 'wrap', gap: '0 50px', width: 1720}}>
          {[t('Ventas', 'Sales'), t('Costes', 'Costs'), t('Márgenes', 'Margins'), t('Demanda', 'Demand')].map((w, i) => {
            const s = prog(f, a('cannot', 30 + i * 12), a('cannot', 44 + i * 12));
            return <div key={w} style={{fontFamily: F.display, fontWeight: 820, fontStretch: '70%', fontSize: 150, lineHeight: 1.05, textTransform: 'uppercase',
              color: s > .5 ? '#8d909b' : C.paper}}><Strike p={s} color={C.pink} thick={14}>{w}</Strike></div>;
          })}
        </div>
        <Body size={40} color="#e3e4e8" style={{position: 'absolute', left: L, top: 640, width: 1500, opacity: inAt(f, a('cannot', 80))}}>
          {t('Sin precio recomendado. Sin impacto económico estimado.', 'No recommended price. No estimated financial impact.')}
        </Body>
        <div style={{position: 'absolute', left: L, top: 780}}>
          <Stamp at={a('fake')} color={C.pink} size={34} style={{background: 'transparent'}}>{t('Todo el catálogo es inventado', 'Every figure is fictional')}</Stamp>
        </div>
      </div>}
    </>
  );
};

/* ------------------------------------------------------------------ 7 · close (dark) */
const Close: React.FC = () => {
  const {f} = useFV();
  const a = useA(), t = useT();
  const s = useSceneInfo();
  const end = s.frames;
  return (
    <>
      <Display size={92} style={{position: 'absolute', left: L, top: 190, width: 1600, color: C.paper, ...rise(f, 4, 30), opacity: inAt(f, 4, 18) * fadeOutAt(f, a('rule', -12), 12)}}>
        {t('El dato más llamativo', 'The most striking number')}<br /><Soft color={C.pink}>{t('no siempre es el problema real.', 'is not always the real problem.')}</Soft>
      </Display>
      <Display size={104} style={{position: 'absolute', left: L, top: 170, width: 1700, color: C.paper, ...rise(f, a('rule'), 30)}}>
        {t('Primero, la comparabilidad.', 'Comparability first.')}<br /><Soft color={C.pink}>{t('Después, el precio.', 'Then, the price.')}</Soft>
      </Display>
      <div style={{position: 'absolute', left: L, top: 500, width: 1500, height: 3, background: C.pink, transform: `scaleX(${prog(f, a('rule', 20), a('rule', 60))})`, transformOrigin: 'left'}} />
      <div style={{position: 'absolute', left: L, top: 560, ...rise(f, a('web'))}}>
        <Label color="#9fa2ad" size={20}>{t('Caso interactivo, datos, Excel y presentaciones', 'Interactive case, data, Excel and decks')}</Label>
        <Mono size={40} style={{color: C.paper, display: 'block', marginTop: 12}}>pricingdemo-alfonsocifuentes.vercel.app</Mono>
      </div>
      <div style={{position: 'absolute', left: L, top: 720, ...rise(f, a('sign'), 24)}}>
        <Brand size={92} dark />
      </div>
      <Label color="#9fa2ad" size={17} style={{position: 'absolute', left: L, top: 900, width: 1500, lineHeight: 1.6, opacity: inAt(f, Math.min(a('sign', 30), end - 60))}}>
        {t('Datos, títulos y precios ficticios · inspirado en una prueba técnica de selección · sin relación con ninguna editorial · voz sintética (ElevenLabs)',
          'Fictional data, titles and prices · inspired by a recruitment technical assessment · not affiliated with any publisher · synthetic voice (ElevenLabs)')}
      </Label>
    </>
  );
};

export const HORIZONTAL: Record<string, {C: React.FC; dark?: boolean}> = {
  origin: {C: Origin}, problem: {C: Problem}, method: {C: Method}, exceptions: {C: Exceptions},
  finding: {C: Finding}, limits: {C: Limits}, close: {C: Close, dark: true},
};
export {Grid60};
