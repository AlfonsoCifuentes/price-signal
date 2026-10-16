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

const Chip: React.FC<{children: React.ReactNode; tone?: 'raw' | 'new'; f: number; at: number}> = ({children, tone = 'raw', f, at}) => (
  <div style={{display: 'inline-block', margin: '0 14px 16px 0', padding: '12px 22px', fontFamily: F.mono, fontSize: 30, fontWeight: 650,
    border: `3px solid ${tone === 'raw' ? C.ink2 : C.blue}`, color: tone === 'raw' ? C.ink2 : C.blue, background: tone === 'raw' ? 'transparent' : '#eef0fb',
    ...fadeUp(f, at, 16, 14)}}>{children}</div>
);

const VQuestion: React.FC = () => {
  const {f} = useScene();
  const t = useT();
  const hidden = [t('Edition ?', 'Edición ?'), t('Access duration ?', 'Duración del acceso ?'), t('Extra resources ?', 'Recursos extra ?')];
  return (
    <>
      <Big f={f} top={260} size={150}>{t('A title.', 'Un título.')}<br /><It>{t('A series. A price.', 'Una serie. Un precio.')}</It></Big>
      <div style={{position: 'absolute', left: X, right: X, top: 900}}>
        {hidden.map((h, i) => (
          <div key={h} style={{fontFamily: F.mono, fontSize: 52, fontWeight: 600, color: C.key, padding: '20px 0', borderBottom: `1px solid ${C.rule}`, ...fadeUp(f, 40 + i * 14, 18, 16)}}>{h}</div>
        ))}
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 1330, fontFamily: F.text, fontSize: 46, lineHeight: 1.3, ...fadeUp(f, 120)}}>
        {t('Behind every title: formats, levels, packs and access rights.', 'Detrás de cada título: formatos, niveles, packs y derechos de acceso.')}
      </div>
    </>
  );
};

const VExtract: React.FC = () => {
  const {f} = useScene();
  const t = useT(), es = useIsEs();
  const raw = ['Series', 'Segment', 'Sub-Segment', 'Title', 'Price_EUR'];
  const added = ['Edition', 'Level', 'Level_System', 'Product_Type', 'Product_Role', 'Book_Part', 'Pack_Type', 'Answer_Support'];
  return (
    <>
      <Big f={f} top={220} size={es ? 112 : 124}>{t('Five columns in,', 'Cinco columnas dentro,')}<br /><It>{t('nineteen out.', 'diecinueve fuera.')}</It></Big>
      <Label style={{position: 'absolute', left: X, top: 760, ...fadeUp(f, 20)}}>{t('From the source', 'Del origen')}</Label>
      <div style={{position: 'absolute', left: X, right: X, top: 810}}>
        {raw.map((r, i) => <Chip key={r} f={f} at={30 + i * 6}>{r}</Chip>)}
      </div>
      <Label color={C.blue} style={{position: 'absolute', left: X, top: 1010, ...fadeUp(f, 70)}}>{t('Recovered from the titles', 'Recuperado de los títulos')}</Label>
      <div style={{position: 'absolute', left: X, right: X, top: 1060}}>
        {added.map((r, i) => <Chip key={r} tone="new" f={f} at={90 + i * 6}>{r}</Chip>)}
        <Chip tone="new" f={f} at={140}>+ 11</Chip>
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 1330, fontFamily: F.text, fontSize: 46, lineHeight: 1.3, ...fadeUp(f, 160)}}>
        {t('If a title does not say it, it is unknown, not unlimited.', 'Si el título no lo dice, es desconocido, no ilimitado.')}
      </div>
    </>
  );
};

const VProvenance: React.FC = () => {
  const {f} = useScene();
  const t = useT();
  const layer = (title: string, sub: string, at: number, dashed?: boolean) => (
    <div style={{padding: '34px 36px', border: `4px ${dashed ? 'dashed' : 'solid'} ${dashed ? C.blue : C.key}`, background: dashed ? '#eef0fb' : C.sheet, ...fadeUp(f, at, 22, 18)}}>
      <div style={{fontFamily: F.display, fontWeight: 740, fontStretch: '86%', fontSize: 62}}>{title}</div>
      <div style={{fontFamily: F.text, fontSize: 40, color: C.ink2, marginTop: 8}}>{sub}</div>
    </div>
  );
  const arrow = (at: number) => <div style={{textAlign: 'center', fontFamily: F.display, fontSize: 64, color: C.key, lineHeight: 1, ...fadeUp(f, at, 0, 10)}}>↓</div>;
  return (
    <>
      <Big f={f} top={230} size={140}>{t('Keep the', 'Conservar')}<br /><It>{t('source.', 'el origen.')}</It></Big>
      <div style={{position: 'absolute', left: X, right: X, top: 780, display: 'grid', gap: 18}}>
        {layer(t('Raw file', 'Fichero original'), t('untouched', 'sin tocar'), 20)}
        {arrow(60)}
        {layer(t('Reporting view', 'Vista de informe'), t('every correction, reversible', 'cada corrección, reversible'), 80, true)}
        {arrow(120)}
        {layer(t('Any number', 'Cualquier cifra'), t('traces back to its record', 'remite a su registro'), 140)}
      </div>
    </>
  );
};

const VMisfiled: React.FC = () => {
  const {f} = useScene();
  const t = useT();
  return (
    <>
      <Label style={{position: 'absolute', left: X, top: 220, ...fadeUp(f, 0)}}>{t('Trap · series', 'Trampa · series')}</Label>
      <Big f={f} at={4} top={280} size={120}>{t('Two misfiled', 'Dos registros')}<br /><It>{t('records.', 'mal archivados.')}</It></Big>
      <div style={{position: 'absolute', left: X, right: X, top: 790, display: 'grid', gap: 24}}>
        {data.traps.series_mismatch.map((m, i) => (
          <div key={m.row_id} style={{background: C.sheet, borderLeft: `10px solid ${C.magenta}`, padding: '24px 32px', ...fadeUp(f, 30 + i * 30, 22, 18)}}>
            <div style={{fontFamily: F.mono, fontSize: 30, color: C.key, fontWeight: 650}}>{t('Series field', 'Campo de serie')}: {m.series_field}</div>
            <div style={{fontFamily: F.display, fontWeight: 720, fontStretch: '88%', fontSize: 50, marginTop: 14, lineHeight: 1.15}}>
              <Mark p={prog(f, 70 + i * 30, 90 + i * 30)}>{m.title_prefix}</Mark>{m.title.slice(m.title_prefix.length)}
            </div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 1330, fontFamily: F.text, fontSize: 46, lineHeight: 1.3, ...fadeUp(f, 130)}}>
        {t('Flagged and re-filed in the reporting view, never overwritten.', 'Marcados y reubicados en la vista de informe, nunca sobrescritos.')}
      </div>
    </>
  );
};

const VEbook: React.FC = () => {
  const {f} = useScene();
  const t = useT();
  const title = data.traps.ebook_substring.naive_hits[0].title;
  const rule = (label: string, verdict: React.ReactNode, at: number, ok: boolean) => (
    <div style={{padding: '30px 34px', background: C.sheet, borderLeft: `10px solid ${ok ? C.blue : C.magenta}`, ...fadeUp(f, at, 20, 16)}}>
      <div style={{fontFamily: F.mono, fontSize: 30, color: C.ink2}}>{label}</div>
      <div style={{fontFamily: F.display, fontWeight: 740, fontStretch: '86%', fontSize: 60, marginTop: 8, color: ok ? C.blue : C.magenta}}>{verdict}</div>
    </div>
  );
  return (
    <>
      <Label style={{position: 'absolute', left: X, top: 220, ...fadeUp(f, 0)}}>{t('Trap · parsing', 'Trampa · análisis')}</Label>
      <div style={{position: 'absolute', left: X - 6, top: 290, fontFamily: F.display, fontWeight: 800, fontStretch: '72%', fontSize: 210, letterSpacing: -8, lineHeight: 1, ...fadeUp(f, 4, 40)}}>
        Gle<Mark p={prog(f, 30, 50)}>ebook</Mark>
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 560, fontFamily: F.mono, fontSize: 30, color: C.ink2, ...fadeUp(f, 50)}}>{title}</div>
      <div style={{position: 'absolute', left: X, right: X, top: 720, display: 'grid', gap: 30}}>
        {rule(t('Naive substring rule', 'Regla de subcadena ingenua'), t('digital access', 'acceso digital'), 80, false)}
        {rule(t('Word-boundary rule', 'Regla de palabra completa'), t('no digital access', 'sin acceso digital'), 120, true)}
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 1290, fontFamily: F.text, fontSize: 46, lineHeight: 1.3, ...fadeUp(f, 160)}}>
        {t('A printed resource. Its name contains “e-book”, so the naive rule is wrong.', 'Un recurso impreso. Su nombre contiene «e-book», así que la regla ingenua se equivoca.')}
      </div>
    </>
  );
};

const VLike: React.FC = () => {
  const {f} = useScene();
  const t = useT(), es = useIsEs();
  const size = 80, gap = 12, cols = 10, rows = 6;
  return (
    <>
      <Label style={{position: 'absolute', left: X, top: 220, ...fadeUp(f, 0)}}>{t('Step 3 · Comparison', 'Paso 3 · Comparación')}</Label>
      <Big f={f} at={4} top={270} size={es ? 104 : 116}>{t('Like for like.', 'Lo comparable,')}<br /><It>{es ? 'con lo comparable.' : 'then compared.'}</It></Big>
      <div style={{position: 'absolute', left: X, top: 760}}>
        {Array.from({length: cols * rows}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: (i % cols) * (size + gap), top: Math.floor(i / cols) * (size + gap), width: size, height: size,
            background: C.blue, opacity: prog(f, 20 + i * 1.2, 30 + i * 1.2)}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 1340, fontFamily: F.text, fontSize: 46, lineHeight: 1.3, ...fadeUp(f, 130)}}>
        {t('Same series, type, pack, edition and access. Only the level changes.', 'Misma serie, tipo, pack, edición y acceso. Solo cambia el nivel.')}
      </div>
      <Mono size={34} style={{position: 'absolute', left: X, right: X, top: 700, color: C.blue, fontWeight: 650, ...fadeUp(f, 160)}}>
        {t('60 comparable groups', '60 grupos comparables')}
      </Mono>
    </>
  );
};

const VSplit: React.FC = () => {
  const {f} = useScene();
  const t = useT();
  const splits = data.traps.split_volumes;
  const avg = Math.round(splits.reduce((a, s) => a + s.premium_pct, 0) / splits.length);
  return (
    <>
      <Label style={{position: 'absolute', left: X, top: 220, ...fadeUp(f, 0)}}>{t('Finding', 'Hallazgo')}</Label>
      <Big f={f} at={4} top={270} size={120}>{t('Two parts', 'Dos partes')}<br /><It>{t('cost more.', 'cuestan más.')}</It></Big>
      <div style={{position: 'absolute', left: X - 10, top: 780, fontFamily: F.display, fontWeight: 780, fontStretch: '62%', fontSize: 460, lineHeight: .85,
        letterSpacing: -12, color: C.blue}}>+<Count to={avg} p={prog(f, 10, 60)} />%</div>
      <div style={{position: 'absolute', left: X, right: X, top: 1210, fontFamily: F.text, fontSize: 46, lineHeight: 1.3, ...fadeUp(f, 90)}}>
        {t('More than the complete volume, at every level.', 'Más que el volumen completo, en todos los niveles.')}
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 1340, display: 'grid', gap: 12}}>
        {splits.map((s, i) => (
          <Mono key={s.series} size={32} style={{color: C.ink2, ...fadeUp(f, 130 + i * 12)}}>{s.series} · +{s.premium_pct}%</Mono>
        ))}
      </div>
    </>
  );
};

const VLimits: React.FC = () => {
  const {f} = useScene();
  const t = useT();
  const words = [t('Sales', 'Ventas'), t('Costs', 'Costes'), t('Margins', 'Márgenes'), t('Discounts', 'Descuentos'), t('Elasticity', 'Elasticidad')];
  return (
    <>
      <Label style={{position: 'absolute', left: X, top: 220, ...fadeUp(f, 0)}}>{t('Limits', 'Límites')}</Label>
      <Big f={f} at={4} top={270} size={108}>{t('What the data', 'Lo que los datos')}<br /><It>{t('cannot say.', 'no pueden decir.')}</It></Big>
      <div style={{position: 'absolute', left: X, right: X, top: 760, borderTop: `3px solid ${C.key}`}}>
        {words.map((w, i) => (
          <div key={w} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: `1px solid ${C.rule}`, ...fadeUp(f, 40 + i * 12, 16, 14)}}>
            <span style={{fontFamily: F.display, fontWeight: 720, fontStretch: '88%', fontSize: 58}}>{w}</span>
            <Mono size={32} style={{color: C.key}}>{t('not in the data', 'fuera de los datos')}</Mono>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 1290, fontFamily: F.text, fontSize: 46, lineHeight: 1.3, ...fadeUp(f, 120)}}>
        {t('Without sales and discount data, a recommended price would be speculation.', 'Sin datos de ventas y descuentos, un precio recomendado sería especulación.')}
      </div>
    </>
  );
};

const VMethod: React.FC = () => {
  const {f} = useScene();
  const t = useT();
  const steps = [t('Keep the source', 'Conservar el origen'), t('Recover the structure', 'Recuperar la estructura'),
    t('Compare like with like', 'Comparar lo comparable'), t('Say what you don’t know', 'Decir lo que no se sabe')];
  return (
    <>
      <Label style={{position: 'absolute', left: X, top: 220, ...fadeUp(f, 0)}}>{t('The method', 'El método')}</Label>
      <Big f={f} at={4} top={270} size={130}>{t('A chain of', 'Una cadena de')}<br /><It>{t('decisions.', 'decisiones.')}</It></Big>
      <div style={{position: 'absolute', left: X, right: X, top: 760, display: 'grid', gap: 24}}>
        {steps.map((s, i) => (
          <div key={s} style={{display: 'flex', gap: 30, alignItems: 'baseline', ...fadeUp(f, 30 + i * 22, 22, 18)}}>
            <span style={{fontFamily: F.display, fontWeight: 780, fontStretch: '70%', fontSize: 110, color: C.blue, lineHeight: .9}}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{fontFamily: F.display, fontWeight: 720, fontStretch: '88%', fontSize: 62, lineHeight: 1.1}}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: X, right: X, top: 1310, fontFamily: F.text, fontSize: 46, lineHeight: 1.3, ...fadeUp(f, 130)}}>
        {t('So the result is not a dashboard. It is a method.', 'Así, el resultado no es un panel. Es un método.')}
      </div>
    </>
  );
};

export const VERTICAL_SCENES: Record<string, {C: React.FC; dark?: boolean}> = {
  'v-hook': {C: VHook}, 'v-question': {C: VQuestion}, 'v-source': {C: VScale}, 'v-extract': {C: VExtract},
  'v-provenance': {C: VProvenance}, 'v-misfiled': {C: VMisfiled}, 'v-ebook': {C: VEbook}, 'v-like': {C: VLike},
  'v-stability': {C: VFinding}, 'v-split': {C: VSplit}, 'v-limits': {C: VLimits}, 'v-method': {C: VMethod},
  'v-outro': {C: VCta, dark: true},
};
