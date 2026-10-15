import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {C, F, Count, eur, fadeUp, Mark, prog, Ring, useIsEs, useScene, useT} from './kit';
import data from './data.json';

/* Every figure on screen comes from data.json (copied from public_analysis.json).
   Each scene reads its words through useT(en, es); layout and numbers are shared by both locales. */
const H = data.headline;
const T = data.traps;
const L = 96; // left margin

const Headline: React.FC<{children: React.ReactNode; f: number; at?: number; size?: number; top?: number; width?: number; color?: string}> =
  ({children, f, at = 4, size = 112, top = 150, width = 1500, color}) => (
    <div style={{position: 'absolute', left: L, top, width, fontFamily: F.display, fontWeight: 780, fontStretch: '84%', fontSize: size,
      lineHeight: .95, letterSpacing: -size * .028, color, ...fadeUp(f, at, 34, 22)}}>{children}</div>
  );
const It: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = C.blue}) =>
  <span style={{fontFamily: F.display, fontStyle: 'normal', fontWeight: 400, letterSpacing: -1, color}}>{children}</span>;
const Label: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({children, color = C.magenta, size = 22, style}) =>
  <div style={{fontFamily: F.mono, fontStretch: '87%', fontWeight: 600, fontSize: size, letterSpacing: 1.6, textTransform: 'uppercase', color, ...style}}>{children}</div>;
const Mono: React.FC<{children: React.ReactNode; size?: number; style?: React.CSSProperties}> = ({children, size = 30, style}) =>
  <span style={{fontFamily: F.mono, fontStretch: '87%', fontSize: size, ...style}}>{children}</span>;

/* ------------------------------------------------------------------ 1 · hook */
const PROOF_ROWS = [
  {series: 'Glasshouse English', title: 'Glasshouse English A2 Premium Pack with Digital', price: 86.49},
  {series: 'Glasshouse English', title: 'Glasshouse English B1 Premium Pack with Digital', price: 86.49},
  {series: 'Glasshouse English', title: 'Mosaic English B1 Premium Pack with Digital', price: 69.49, odd: true},
  {series: 'Glasshouse English', title: 'Glasshouse English B2 Premium Pack with Digital', price: 86.49},
];
export const ProofTable: React.FC<{f: number; at: number; width: number; fontSize?: number; compact?: boolean}> = ({f, at, width, fontSize = 27, compact}) => {
  const ring = prog(f, at + 70, at + 105), mark = prog(f, at + 105, at + 125);
  return (
    <div style={{width, background: C.sheet, boxShadow: '0 30px 60px -40px rgba(21,22,26,.45)', borderTop: `2px solid ${C.key}`, opacity: prog(f, at - 6, at + 6)}}>
      {PROOF_ROWS.map((r, i) => (
        <div key={i} style={{display: 'grid', gridTemplateColumns: compact ? `1fr ${fontSize * 5.6}px` : `${fontSize * 13.6}px 1fr ${fontSize * 5.2}px`, gap: compact ? '6px 20px' : 24,
          alignItems: 'center', padding: compact ? '18px 24px' : '20px 26px', borderBottom: `2px dashed ${C.rule}`, fontFamily: F.mono, fontStretch: '87%',
          fontSize, background: r.odd ? '#f8eef2' : undefined, ...fadeUp(f, at + i * 6, 16, 16)}}>
          <span style={{whiteSpace: 'nowrap', color: r.odd ? C.key : C.ink2, fontWeight: r.odd ? 650 : 400, position: 'relative', gridColumn: compact ? '1 / -1' : undefined, fontSize: compact ? fontSize * .8 : fontSize}}>
            <span style={{position: 'relative', display: 'inline-block'}}>
              {r.series}
              {r.odd && <Ring p={ring} w={(compact ? fontSize * .8 : fontSize) * 12.6} h={(compact ? fontSize * .8 : fontSize) * 2.3} />}
            </span>
          </span>
          <span>{r.odd ? <><Mark p={mark}>Mosaic English</Mark> B1 Premium Pack with Digital</> : r.title}</span>
          <span style={{textAlign: 'right', fontWeight: 650}}>{r.odd ? <Mark p={mark}>{eur(r.price)}</Mark> : eur(r.price)}</span>
        </div>
      ))}
    </div>
  );
};
const Hook: React.FC = () => {
  const {f} = useScene();
  const t = useT(), es = useIsEs();
  const stretch = interpolate(prog(f, 8, 50), [0, 1], [62, 125]);
  const note = prog(f, 235, 255);
  return (
    <>
      <div style={{position: 'absolute', left: L, top: 112, fontFamily: F.display, fontWeight: 820, textTransform: 'uppercase', lineHeight: .84, letterSpacing: -6}}>
        <div style={{fontSize: 236, fontStretch: '62%', ...fadeUp(f, 0, 40, 22)}}>{t('The price', 'El precio')}</div>
        <div style={{fontSize: es ? 128 : 150, fontStretch: `${stretch}%`, letterSpacing: -7, marginTop: 8, ...fadeUp(f, 6, 40, 22)}}>{t('of clarity.', 'de la claridad.')}</div>
      </div>
      <div style={{position: 'absolute', left: L, top: 560}}><ProofTable f={f} at={120} width={1290} fontSize={24} /></div>
      <div style={{position: 'absolute', left: 1440, top: 600, width: 400, display: 'flex', gap: 22, opacity: note, transform: `translateY(${(1 - note) * 16}px)`}}>
        <div style={{flex: 'none', width: 56, height: 56, borderRadius: '50%', border: `3px solid ${C.magenta}`, color: C.magenta, display: 'grid',
          placeItems: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 32}}>?</div>
        <div style={{fontFamily: F.text, fontSize: 31, lineHeight: 1.35}}>
          <b style={{color: C.magenta}}>{t('Query, row 20.', 'Consulta, fila 20.')}</b> {t(
            'The title says Mosaic English. Not a price cut: a filing error.',
            'El título dice Mosaic English. No es una rebaja de precio: es un error de archivo.')}
        </div>
      </div>
      <Label style={{position: 'absolute', left: L, top: 500, ...fadeUp(f, 110)}} color={C.ink2}>
        {t('Proof · Premium Pack with Digital · as recorded', 'Prueba · Premium Pack with Digital · tal como consta')}
      </Label>
    </>
  );
};

/* ------------------------------------------------------------------ 2 · question */
const TOKENS = [
  {t: 'Mosaic English', en: 'Series', es: 'Serie'}, {t: 'B1', en: 'Level', es: 'Nivel'},
  {t: 'Premium Pack', en: 'Pack', es: 'Pack'}, {t: 'with Digital', en: 'Digital access', es: 'Acceso digital'},
];
const HIDDEN = [['Edition ?', 'Edición ?'], ['Access duration ?', 'Duración del acceso ?'], ['Extra resources ?', 'Recursos extra ?']];
const Question: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  const split = prog(f, 70, 110);
  const hidden = prog(f, 190, 215);
  return (
    <>
      <Headline f={f}>{tx('Before the average,', 'Antes del promedio,')}<br /><It>{tx('define the product.', 'define el producto.')}</It></Headline>
      <div style={{position: 'absolute', left: L, top: 520, display: 'flex', gap: 22 + split * 46, ...fadeUp(f, 30)}}>
        {TOKENS.map((k, i) => (
          <div key={k.t} style={{display: 'flex', flexDirection: 'column', gap: 18}}>
            <Mono size={58} style={{fontWeight: 500, borderBottom: `4px solid ${i === 0 ? C.key : C.blue}`, borderBottomColor: `rgba(36,51,184,${split})`, paddingBottom: 10}}>{k.t}</Mono>
            <Label color={C.blue} size={22} style={{opacity: prog(f, 95 + i * 8, 115 + i * 8)}}>{tx(k.en, k.es)}</Label>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: L, top: 760, display: 'flex', gap: 26, alignItems: 'center', opacity: hidden}}>
        <Label color={C.ink2}>{tx('Not in the title:', 'No aparece en el título:')}</Label>
        {HIDDEN.map(([en, es]) => (
          <Mono key={en} size={30} style={{border: `3px dashed ${C.magenta}`, color: C.magenta, padding: '12px 18px'}}>{tx(en, es)}</Mono>
        ))}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 3 · source */
const Source: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  const n = prog(f, 10, 80);
  return (
    <>
      <div style={{position: 'absolute', left: L - 10, top: 120, fontFamily: F.display, fontWeight: 780, fontStretch: '62%', fontSize: 470, lineHeight: .85,
        letterSpacing: -14, color: C.blue, fontVariantNumeric: 'tabular-nums'}}><Count to={H.products} p={n} pad={3} /></div>
      <div style={{position: 'absolute', left: L, top: 560, fontFamily: F.display, fontWeight: 760, fontStretch: '84%', fontSize: 74, lineHeight: 1, ...fadeUp(f, 50)}}>
        {tx('fictional products', 'productos ficticios')}<br /><It>{tx(`across ${H.series} invented series.`, `en ${H.series} series inventadas.`)}</It>
      </div>
      <div style={{position: 'absolute', left: 1180, top: 150, width: 650, borderTop: `2px solid ${C.key}`}}>
        {data.series.map((s, i) => (
          <div key={s.series} style={{display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${C.rule}`,
            ...fadeUp(f, 30 + i * 7, 14, 14)}}>
            <span style={{fontFamily: F.display, fontWeight: 700, fontStretch: '88%', fontSize: 33}}>{s.series}</span>
            <Mono size={22} style={{color: C.ink2}}>{s.records} · {s.level_system}</Mono>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: L, top: 780, display: 'flex', flexDirection: 'column', gap: 14, ...fadeUp(f, 150)}}>
        <Label color={C.magenta} size={24}>{tx('No real publisher · no real prices', 'Sin editorial real · sin precios reales')}</Label>
        <Label color={C.ink2} size={24}>{tx('seed 20261011 · same seed, same bytes', 'semilla 20261011 · misma semilla, mismos bytes')}</Label>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 4 · extract */
const RAW = ['Series', 'Segment', 'Sub-Segment', 'Title', 'Price_EUR'];
const NEW = ['Edition', 'Level', 'Level_System', 'Product_Type', 'Product_Role', 'Book_Part', 'Pack_Type', 'Answer_Support',
  'Digital_Main_Book_Access', 'Digital_Practice_Book_Access', 'Audio_Access', 'App_Access', 'Additional_Resources', 'Access_Duration'];
const Chip: React.FC<{children: React.ReactNode; tone?: 'raw' | 'new'; style?: React.CSSProperties}> = ({children, tone = 'raw', style}) => (
  <div style={{fontFamily: F.mono, fontStretch: '87%', fontSize: 25, padding: '13px 16px', border: `2px solid ${tone === 'raw' ? C.key : C.blue}`,
    background: tone === 'raw' ? C.sheet : C.blueWash, color: tone === 'raw' ? C.key : C.blue, whiteSpace: 'nowrap', position: 'relative', ...style}}>{children}</div>
);
const Extract: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  const ring = prog(f, 200, 235);
  return (
    <>
      <Headline f={f} size={104}>{tx('Five columns in.', 'Cinco columnas dentro.')}<br /><It>{tx('Nineteen', 'Diecinueve')}</It> {tx('out.', 'fuera.')}</Headline>
      <div style={{position: 'absolute', left: L, top: 430, display: 'flex', flexDirection: 'column', gap: 10}}>
        {RAW.map((c, i) => <div key={c} style={fadeUp(f, 20 + i * 5, 14, 14)}><Chip>{c}</Chip></div>)}
      </div>
      <div style={{position: 'absolute', left: 400, top: 560, fontFamily: F.display, fontSize: 90, color: C.magenta, fontWeight: 300, opacity: prog(f, 50, 70)}}>→</div>
      <div style={{position: 'absolute', left: 540, top: 430, width: 1290, display: 'flex', flexWrap: 'wrap', gap: 12}}>
        {NEW.map((c, i) => {
          const unrecoverable = c === 'Edition' || c === 'Access_Duration';
          return (
            <div key={c} style={fadeUp(f, 70 + i * 6, 20, 14)}>
              <Chip tone="new">{c}{unrecoverable && <Ring p={ring} w={c === 'Edition' ? 190 : 330} h={78} />}</Chip>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 540, top: 780, fontFamily: F.text, fontSize: 34, color: C.magenta, opacity: prog(f, 235, 255)}}>
        {tx('Edition and access duration never appear in a title. Unknown ≠ unlimited.',
          'La edición y la duración del acceso nunca aparecen en un título. Desconocido ≠ ilimitado.')}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 5 · provenance */
const LAYERS = [
  {k: 'Source', ek: 'Origen', d: 'Raw file · 5 columns · never edited', ed: 'Fichero bruto · 5 columnas · nunca se edita', c: C.key, bg: C.sheet, dash: false},
  {k: 'Reporting view', ek: 'Vista de informe', d: 'Aliases, re-filing · switch it off any time', ed: 'Alias y reubicación · reversible', c: C.blue, bg: C.blueWash, dash: false},
  {k: 'Uncertain', ek: 'Incierto', d: 'Blank means unknown, not “no”', ed: 'Vacío significa desconocido, no «no»', c: C.magenta, bg: '#f8eef2', dash: true},
];
const Provenance: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  return (
    <>
      <Headline f={f}>{tx('Keep the source.', 'Conserva el origen.')}<br /><It>{tx('Correct beside it.', 'Corrige a su lado.')}</It></Headline>
      {LAYERS.map((l, i) => {
        const p = prog(f, 40 + i * 30, 80 + i * 30);
        return (
          <div key={l.k} style={{position: 'absolute', left: 990 + i * 50, top: 400 + i * 140, width: 780, height: 210, background: l.bg,
            border: `3px ${l.dash ? 'dashed' : 'solid'} ${l.c}`, boxShadow: '0 30px 50px -40px rgba(21,22,26,.5)', padding: '28px 34px',
            opacity: p, transform: `translate(${(1 - p) * 60}px, ${(1 - p) * 30}px)`}}>
            <Label color={l.c} size={26}>{String(i + 1).padStart(2, '0')} · {tx(l.k, l.ek)}</Label>
            <div style={{fontFamily: F.text, fontSize: 34, marginTop: 16, lineHeight: 1.25}}>{tx(l.d, l.ed)}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: L, top: 620, width: 640, fontFamily: F.text, fontSize: 36, lineHeight: 1.4, color: C.ink2, ...fadeUp(f, 150)}}>
        {tx('Every number traces back to the record it came from.', 'Cada cifra se puede rastrear hasta el registro de origen.')}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 6 · misfiled */
const LV = ['Starter', 'A1', 'A2', 'B1', 'B2', 'C1'];
const Misfiled: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  const ring = prog(f, 70, 100);
  const move = prog(f, 140, 200);
  const ROW = 58, colW = 700;
  const m = T.series_mismatch[0], m2 = T.series_mismatch[1];
  const row = (label: string, price: string, key: React.Key, extra?: React.CSSProperties, odd?: boolean) => (
    <div key={key} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: ROW, padding: '0 22px', borderBottom: `2px dashed ${C.rule}`,
      fontFamily: F.mono, fontStretch: '87%', fontSize: 28, background: odd ? '#f8eef2' : C.sheet, ...extra}}>
      <span>{label}</span><span style={{fontWeight: 650}}>{price}</span>
    </div>
  );
  const top = 450;
  const columns: [string, string, number][] = [
    ['Glasshouse English', tx('Premium Pack · as recorded', 'Premium Pack · tal como consta'), L],
    ['Mosaic English', tx('Premium Pack · its own series', 'Premium Pack · su propia serie'), L + colW + 260],
  ];
  return (
    <>
      <Headline f={f} size={100} top={130}>{T.series_mismatch.length}{tx(' records filed', ' registros archivados')}<br /><It>{tx('under the wrong name.', 'con el nombre equivocado.')}</It></Headline>
      {columns.map(([s, d, x], ci) => (
        <div key={s} style={{position: 'absolute', left: x, top: top - 70, width: colW, ...fadeUp(f, 20 + ci * 10)}}>
          <div style={{fontFamily: F.display, fontWeight: 750, fontStretch: '88%', fontSize: 36}}>{s}</div>
          <Label color={C.ink2} size={20} style={{marginTop: 6}}>{d}</Label>
        </div>
      ))}
      <div style={{position: 'absolute', left: L, top, width: colW, borderTop: `2px solid ${C.key}`, ...fadeUp(f, 30)}}>
        {LV.map(l => row(`Glasshouse English ${l}`, '€86.49', l))}
      </div>
      <div style={{position: 'absolute', left: L + colW + 260, top, width: colW, borderTop: `2px solid ${C.key}`, ...fadeUp(f, 40)}}>
        {LV.map(l => l === 'B1'
          ? <div key={l} style={{height: ROW, borderBottom: `2px dashed ${C.rule}`, border: `2px dashed ${C.magenta}`, opacity: 1 - move}} />
          : row(`Mosaic English ${l}`, '€69.49', l))}
      </div>
      {/* the stray record: starts under Glasshouse, moves home */}
      <div style={{position: 'absolute', left: L + move * (colW + 260), top: top + 2 + interpolate(move, [0, 1], [6 * ROW + 16, 3 * ROW]), width: colW,
        boxShadow: move > 0 && move < 1 ? '0 24px 40px -24px rgba(21,22,26,.5)' : undefined, ...fadeUp(f, 50)}}>
        {row(`Mosaic English B1  (${tx('row', 'fila')} ${m.row_id})`, '€69.49', 'stray', {border: `2px solid ${C.magenta}`}, true)}
        <div style={{position: 'absolute', left: 14, top: 8}}><Ring p={ring} w={360} h={50} /></div>
      </div>
      <div style={{position: 'absolute', left: L, top: 868, width: 1730, fontFamily: F.text, fontSize: 30, color: C.ink2, ...fadeUp(f, 215)}}>
        {tx('Also row', 'También la fila')} {m2.row_id}: <i>{m2.title.replace(' with Digital', '')}</i>, {tx('filed under', 'archivada bajo')} {m2.series_field}.
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 7 · ebook */
const Ebook: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  const mk = prog(f, 40, 60);
  const p1 = prog(f, 90, 110), p2 = prog(f, 150, 170);
  return (
    <>
      <Label style={{position: 'absolute', left: L, top: 150, ...fadeUp(f, 0)}}>Fable Road Level 3 · {tx('printed resource', 'recurso impreso')} · {eur(14.49)}</Label>
      <div style={{position: 'absolute', left: L - 8, top: 190, fontFamily: F.display, fontWeight: 800, fontStretch: '75%', fontSize: 300, letterSpacing: -10, lineHeight: 1, ...fadeUp(f, 4, 40)}}>
        Gle<Mark p={mk}>ebook</Mark>
      </div>
      <div style={{position: 'absolute', left: L, top: 560, width: 1730, display: 'grid', gridTemplateColumns: '1fr 1fr', border: `3px solid ${C.key}`, background: C.sheet}}>
        <div style={{padding: '34px 40px', opacity: p1}}>
          <Label size={24}>{tx('Naive substring rule', 'Regla ingenua por subcadena')}</Label>
          <Mono size={42} style={{display: 'block', margin: '18px 0 22px'}}>{tx('"ebook" in title', '"ebook" en el título')}</Mono>
          <div style={{fontFamily: F.text, fontSize: 38}}><b style={{color: C.magenta, fontFamily: F.display, fontSize: 64}}>{T.ebook_substring.naive_hits.length}</b> {tx('false eBook → digital access granted', 'falso eBook → acceso digital concedido')}</div>
        </div>
        <div style={{padding: '34px 40px', borderLeft: `3px solid ${C.key}`, opacity: p2}}>
          <Label size={24} color={C.blue}>{tx('Word-boundary rule', 'Regla de límite de palabra')}</Label>
          <Mono size={42} style={{display: 'block', margin: '18px 0 22px'}}>\be-?book\b</Mono>
          <div style={{fontFamily: F.text, fontSize: 38}}><b style={{color: C.blue, fontFamily: F.display, fontSize: 64}}>{T.ebook_substring.word_boundary_hits.length}</b> {tx('matches. Printed stays printed.', 'coincidencias. Lo impreso sigue siendo impreso.')}</div>
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ squares grid (scenes 8 & 9) */
const Squares: React.FC<{f: number; mode: 'like' | 'stability'; left: number; top: number; size?: number; cols?: number}> = ({f, mode, left, top, size = 74, cols = 15}) => {
  const gap = 12;
  if (mode === 'like') {
    // 68 groups: 60 comparable stay, 8 single-level drop out
    const total = H.groups_total, single = H.groups_single_level;
    const drop = prog(f, 120, 170);
    return (
      <div style={{position: 'absolute', left, top}}>
        {Array.from({length: total}, (_, i) => {
          const isSingle = i >= total - single;
          const col = i % 17, row = Math.floor(i / 17);
          const appear = prog(f, 20 + i * 1.2, 34 + i * 1.2);
          return <div key={i} style={{position: 'absolute', left: col * (size + gap), top: row * (size + gap) + (isSingle ? drop * 90 : 0), width: size, height: size,
            background: isSingle ? 'transparent' : C.blue, border: `3px ${isSingle ? 'dashed' : 'solid'} ${isSingle ? C.magenta : C.blue}`,
            opacity: appear * (isSingle ? 1 - drop * .55 : 1)}} />;
        })}
      </div>
    );
  }
  const exc = data.exceptions; // 4 starter + 2 misfiled, in that order
  const fixed = prog(f, 215, 245);
  return (
    <div style={{position: 'absolute', left, top}}>
      {Array.from({length: H.comparables}, (_, i) => {
        const e = i >= H.consistent ? exc[i - H.consistent] : null;
        const col = i % cols, row = Math.floor(i / cols);
        const appear = prog(f, 15 + i * 1.6, 28 + i * 1.6);
        const mis = e?.kind === 'misfiled-record';
        const blue = !e || (mis && fixed > .5);
        return (
          <div key={i} style={{position: 'absolute', left: col * (size + gap), top: row * (size + gap), width: size, height: size, opacity: appear,
            background: blue ? C.blue : 'transparent', border: `3px solid ${e && !blue ? (mis ? C.magenta : C.blue) : C.blue}`,
            display: 'grid', placeItems: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: blue ? C.paper : (mis ? C.magenta : C.blue)}}>
            {e ? (mis ? (fixed > .5 ? '✓' : 'M') : 'S') : ''}
            {mis && <div style={{position: 'absolute', left: -8, top: -8}}><Ring p={prog(f, 180, 210)} w={size + 16} h={size + 4} /></div>}
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ 8 · like for like */
const Like: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  return (
    <>
      <Headline f={f} size={104}>{tx('Hold the product still.', 'Fija el producto.')}<br /><It>{tx('Only the level moves.', 'Solo se mueve el nivel.')}</It></Headline>
      <Label color={C.ink2} size={22} style={{position: 'absolute', left: L, top: 390, ...fadeUp(f, 10)}}>
        {tx('Series · type · role · part · pack · answer key · digital access ×2 · resources · edition',
          'Serie · tipo · función · parte · pack · clave de respuestas · acceso digital ×2 · recursos · edición')}
      </Label>
      <Squares f={f} mode="like" left={L} top={450} size={72} />
      <div style={{position: 'absolute', left: L, top: 820, display: 'flex', gap: 60, alignItems: 'baseline', ...fadeUp(f, 175)}}>
        <span style={{fontFamily: F.display, fontWeight: 780, fontStretch: '70%', fontSize: 120, color: C.blue}}>{H.comparables}</span>
        <span style={{fontFamily: F.text, fontSize: 36}}>{tx(`comparable groups, out of ${H.groups_total}.`, `grupos comparables, de ${H.groups_total}.`)}</span>
        <Label color={C.magenta} size={22}>{tx(`${H.groups_single_level} single-level groups set aside`, `${H.groups_single_level} grupos de un solo nivel descartados`)}</Label>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 9 · stability */
const Stability: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  const fixed = prog(f, 215, 245);
  const val = fixed > .5 ? H.consistent_after_series_repair : H.consistent;
  return (
    <>
      <Squares f={f} mode="stability" left={L} top={180} size={82} cols={12} />
      <div style={{position: 'absolute', left: 1300, top: 170, ...fadeUp(f, 60)}}>
        <div style={{fontFamily: F.display, fontWeight: 780, fontStretch: '68%', fontSize: 260, lineHeight: .85, letterSpacing: -8, color: fixed > .5 ? C.blue : C.key}}>
          {val}<span style={{color: C.ink2, fontWeight: 300}}>/</span>{H.comparables}
        </div>
        <div style={{fontFamily: F.text, fontSize: 34, marginTop: 20, width: 520, lineHeight: 1.35}}>
          {fixed > .5
            ? <>{tx(`after re-filing ${H.exceptions_misfiled} records. Source untouched.`, `tras reubicar ${H.exceptions_misfiled} registros. Origen sin tocar.`)}</>
            : <>{tx('groups hold one price at every level.', 'grupos mantienen un mismo precio en todos los niveles.')}</>}
        </div>
      </div>
      <div style={{position: 'absolute', left: L, top: 680, width: 1730, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40}}>
        <div style={fadeUp(f, 120)}>
          <Label color={C.blue} size={24}>{tx(`S · ${H.exceptions_starter} Starter pricing`, `S · ${H.exceptions_starter} precios Starter`)}</Label>
          <div style={{fontFamily: F.text, fontSize: 32, marginTop: 10, lineHeight: 1.35}}>
            {tx('Starter only, €4–€8 cheaper. Plausible strategy; the data can’t confirm it.',
              'Solo Starter, entre 4 y 8 € más barato. Estrategia plausible; los datos no pueden confirmarla.')}
          </div>
        </div>
        <div style={fadeUp(f, 170)}>
          <Label size={24}>{tx(`M · ${H.exceptions_misfiled} filing errors`, `M · ${H.exceptions_misfiled} errores de archivo`)}</Label>
          <div style={{fontFamily: F.text, fontSize: 32, marginTop: 10, lineHeight: 1.35}}>
            {tx('Not prices at all: another series’ product in the group.', 'No son precios: un producto de otra serie dentro del grupo.')}
          </div>
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 10 · split volumes */
const Split: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  const max = Math.max(...T.split_volumes.map(s => s.parts_total)) * 1.08, W = 1180;
  const sx = (v: number) => v / max * W;
  return (
    <>
      <Headline f={f} size={104}>{tx('Two parts cost more', 'Dos partes cuestan más')}<br /><It>{tx('than one book.', 'que un libro.')}</It></Headline>
      {T.split_volumes.map((s, i) => {
        const y = 420 + i * 250, p1 = prog(f, 40 + i * 50, 80 + i * 50), p2 = prog(f, 70 + i * 50, 120 + i * 50);
        return (
          <div key={s.series} style={{position: 'absolute', left: L, top: y}}>
            <Label color={C.ink2} size={22}>{s.series} · {tx('same level, same edition', 'mismo nivel, misma edición')}</Label>
            <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 16}}>
              <div style={{width: sx(s.complete) * p1, height: 52, background: C.key}} />
              <Mono size={28} style={{opacity: p1}}>{tx('Complete', 'Completo')} {eur(s.complete)}</Mono>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 12}}>
              <div style={{display: 'flex', position: 'relative'}}>
                <div style={{width: sx(s.parts_total / 2) * p2, height: 52, background: C.blue}} />
                <div style={{width: sx(s.parts_total / 2) * p2, height: 52, background: '#6b78d6'}} />
                <div style={{position: 'absolute', left: sx(s.complete), top: -6, width: sx(s.premium_eur), height: 64, border: `4px solid ${C.magenta}`, opacity: prog(f, 120 + i * 40, 140 + i * 40)}} />
              </div>
              <Mono size={28} style={{opacity: p2}}>A + B {eur(s.parts_total)}</Mono>
              <span style={{fontFamily: F.display, fontWeight: 780, fontStretch: '75%', fontSize: 64, color: C.magenta, opacity: prog(f, 130 + i * 40, 150 + i * 40)}}>
                +{eur(s.premium_eur)} · +{s.premium_pct}%
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ 11 · limits (dark) */
const WORDS = [['Sales', 'Ventas'], ['Costs', 'Costes'], ['Margins', 'Márgenes'], ['Discounts', 'Descuentos'], ['Elasticity', 'Elasticidad']];
const Limits: React.FC = () => {
  const {f} = useScene();
  const tx = useT(), es = useIsEs();
  return (
    <>
      <Label color={C.pink} size={26} style={{position: 'absolute', left: L, top: 150, ...fadeUp(f, 0)}}>{tx('Not in the data', 'No está en los datos')}</Label>
      <div style={{position: 'absolute', left: L, top: 210, display: 'flex', flexWrap: 'wrap', gap: '0 52px', width: 1740}}>
        {WORDS.map(([en, eso], i) => {
          const strike = prog(f, 40 + i * 22, 60 + i * 22);
          return (
            <div key={en} style={{position: 'relative', fontFamily: F.display, fontWeight: 820, fontStretch: '70%', fontSize: es ? 124 : 158, lineHeight: 1.05, textTransform: 'uppercase',
              color: interpolate(strike, [0, 1], [0, 1]) > .5 ? '#8d909b' : C.paper, ...fadeUp(f, 8 + i * 6, 30)}}>
              {tx(en, eso)}
              <div style={{position: 'absolute', left: -6, top: '52%', height: 14, width: `${strike * 102}%`, background: C.pink}} />
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: L, top: es ? 660 : 600, fontFamily: F.text, fontSize: 44, lineHeight: 1.35, color: '#e3e4e8', width: 1500, ...fadeUp(f, 170)}}>
        {tx('So: no recommended price. Instead,', 'Así que no hay precio recomendado. En su lugar,')} <span style={{color: C.pink}}>{tx('four precise questions', 'cuatro preguntas precisas')}</span> {tx('for the commercial team.', 'para el equipo comercial.')}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 12 · method */
const STEPS = [['Keep the source', 'Conservar el origen'], ['Recover the structure', 'Recuperar la estructura'],
  ['Compare like with like', 'Comparar lo comparable'], ['Say what you don’t know', 'Decir lo que no se sabe']];
const Method: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  const line = prog(f, 40, 200);
  return (
    <>
      <Headline f={f} size={110}>{tx('The method', 'El método')}<br /><It>{tx('is the result.', 'es el resultado.')}</It></Headline>
      <div style={{position: 'absolute', left: L + 40, top: 560, width: 1640 * line, height: 4, background: C.magenta}} />
      {STEPS.map(([en, es], i) => {
        const p = prog(f, 40 + i * 40, 70 + i * 40);
        return (
          <div key={en} style={{position: 'absolute', left: L + i * 440, top: 520, width: 400, opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>
            <div style={{width: 84, height: 84, borderRadius: '50%', background: i === 3 ? C.magenta : C.blue, color: C.paper, display: 'grid', placeItems: 'center',
              fontFamily: F.display, fontWeight: 300, fontStretch: '62%', fontSize: 54}}>{i + 1}</div>
            <div style={{fontFamily: F.display, fontWeight: 760, fontStretch: '86%', fontSize: 52, lineHeight: 1.02, marginTop: 30}}>{tx(en, es)}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: L, top: 780, width: 1600, fontFamily: F.text, fontSize: 38, lineHeight: 1.35, color: C.ink2, ...fadeUp(f, 210)}}>
        {tx('Every step is in the files: a seeded Python generator, an analysis script, unit tests and an Excel workbook whose formulas agree.',
          'Cada paso está en los ficheros: un generador en Python con semilla, un script de análisis, pruebas unitarias y un libro de Excel cuyas fórmulas coinciden.')}
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ 13 · outro (dark) */
const Outro: React.FC = () => {
  const {f} = useScene();
  const tx = useT();
  const stretch = interpolate(prog(f, 10, 60), [0, 1], [62, 118]);
  return (
    <>
      <div style={{position: 'absolute', left: L, top: 230, fontFamily: F.display, fontWeight: 820, fontStretch: `${stretch}%`, fontSize: 210, letterSpacing: -4, lineHeight: .9, ...fadeUp(f, 0, 40)}}>
        PRICE<span style={{color: C.pink, fontWeight: 300, fontStretch: '62%'}}>/</span><br />SIGNAL
      </div>
      <div style={{position: 'absolute', left: L, top: 680, fontFamily: F.text, fontSize: 44, lineHeight: 1.35, width: 1400, ...fadeUp(f, 50)}}>
        {tx('Interactive case study, dataset and Excel workbook:', 'Caso interactivo, dataset y libro de Excel:')} <span style={{color: C.pink}}>{tx('link in the description.', 'enlace en la descripción.')}</span>
      </div>
      <Label color="#9fa2ad" size={22} style={{position: 'absolute', left: L, top: 830, width: 1600, lineHeight: 1.6, ...fadeUp(f, 90)}}>
        {tx('All series, products and prices are invented · reproducible from seed 20261011 · not affiliated with any publisher',
          'Todas las series, productos y precios son inventados · reproducible con la semilla 20261011 · sin relación con ninguna editorial')}
      </Label>
    </>
  );
};

export const FILM_SCENES: Record<string, {C: React.FC; dark?: boolean}> = {
  hook: {C: Hook}, question: {C: Question}, source: {C: Source}, extract: {C: Extract}, provenance: {C: Provenance},
  misfiled: {C: Misfiled}, ebook: {C: Ebook}, like: {C: Like}, stability: {C: Stability}, split: {C: Split},
  limits: {C: Limits, dark: true}, method: {C: Method}, outro: {C: Outro, dark: true},
};
export {Squares, Headline, It, Label, Mono, L};
export const Fill = AbsoluteFill;
