// PRICE / SIGNAL — 17-slide public deck, EN + ES, built only from public_analysis.json.
// node build_public_deck.js  →  PRICE_SIGNAL_Public_Case_EN.pptx + PRICE_SIGNAL_Caso_Publico_ES.pptx
// PDFs are exported by PowerPoint: python export_decks_pdf.py
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const A = JSON.parse(fs.readFileSync(path.join(__dirname, '../02_PUBLIC_CASE_STUDY/public_analysis.json'), 'utf8'));
const H = A.headline, TR = A.traps;
const P = {paper: 'F3F4EF', sheet: 'FBFBF8', key: '15161A', ink2: '4C4E57', rule: 'C9CCC4', blue: '2433B8', wash: 'E3E6F6', magenta: 'C2105F', pink: 'FF7BB3', yellow: 'FFE14D'};
const FD = 'Arial', FT = 'Georgia', FM = 'Consolas';
const W = 13.333, HT = 7.5, X = 0.62;
const eur = (v, lang) => lang === 'es' ? `${v.toFixed(2).replace('.', ',')} €` : `€${v.toFixed(2)}`;
const pct = (v, lang) => lang === 'es' ? `${v.toFixed(1).replace('.', ',')} %` : `${v.toFixed(1)}%`;
const T = (en, es) => ({en, es});
const typeName = {en: t => t, es: t => ({'Workbook': 'Cuaderno', 'Student Book': 'Libro del alumno', 'Digital Workbook': 'Cuaderno digital', 'Pupil Book': 'Libro (primaria)', 'TB': 'TB (sin resolver)', 'Resource': 'Recurso'}[t] || t)};

const slides = [
  {layout: 'title', kicker: T('Independent case study', 'Caso de estudio independiente'),
   notes: T('Open with the question, not the tools. Everything in this deck is fictional and reproducible.', 'Empieza por la pregunta, no por las herramientas. Todo es ficticio y reproducible.')},
  {layout: 'statement', kicker: T('The question', 'La pregunta'), head: T('A price list is a', 'Una lista de precios es'), em: T('list of assumptions.', 'una lista de supuestos.'),
   body: l => T(`The pooled mean list price is ${eur(H.mean, 'en')}, a number that describes no product: workbooks average ${eur(A.type_stats[0].mean, 'en')}, student books ${eur(A.type_stats[1].mean, 'en')}.`,
                `El precio medio global es ${eur(H.mean, 'es')}, una cifra que no describe ningún producto: los cuadernos promedian ${eur(A.type_stats[0].mean, 'es')} y los libros del alumno ${eur(A.type_stats[1].mean, 'es')}.`)[l],
   notes: T('Averages across unlike products produce confident wrong answers.', 'Promediar productos distintos produce respuestas erróneas con aspecto seguro.')},
  {layout: 'big', kicker: T('The material', 'El material'), big: String(H.products),
   head: T('fictional products,', 'productos ficticios,'), em: T(`${H.series} invented series.`, `${H.series} series inventadas.`),
   body: () => T('5 raw columns → 19 enriched · seeded generator (20261011) · same seed, same bytes · no real publisher, no real prices.',
                 '5 columnas de origen → 19 enriquecidas · generador con semilla (20261011) · misma semilla, mismos bytes · sin editorial ni precios reales.'),
   notes: T('Stress that the data is invented on purpose, with planted problems.', 'Subraya que los datos son inventados a propósito y con problemas sembrados.')},
  {layout: 'steps', kicker: T('The method', 'El método'), head: T('Hold the product still.', 'Fija el producto.'), em: T('Then look at the price.', 'Después mira el precio.'),
   steps: T(['Keep the source', 'Recover the structure', 'Compare like with like', 'Separate fact from guess'], ['Conservar el origen', 'Recuperar la estructura', 'Comparar lo comparable', 'Separar hecho y conjetura']),
   notes: T('The order matters: editing the source first destroys evidence.', 'El orden importa: editar el origen primero destruye la evidencia.')},
  {layout: 'statement', kicker: T('Step 2 · Structure', 'Paso 2 · Estructura'), head: T('A title is', 'Un título'), em: T('not a schema.', 'no es un esquema.'),
   body: () => T(`A rule-based parser that reads titles only matched the reference labels on level, pack, answer key, book part, audio and digital access for all ${H.products} rows. On product type it abstained twice (“TB”, “Gleebook”) instead of guessing. The rules were written for these titles, so this checks the rules, not real-world accuracy. Edition and access duration never appear in a title: they can only be sourced.`,
                 `Un parser de reglas que solo lee títulos coincidió con las etiquetas de referencia en nivel, pack, solucionario, parte del libro, audio y acceso digital en las ${H.products} filas. En tipo de producto se abstuvo dos veces («TB», «Gleebook») en lugar de adivinar. Las reglas se escribieron para estos títulos: esto comprueba las reglas, no la precisión con datos reales. La edición y la duración del acceso nunca aparecen en el título: solo pueden venir de metadatos.`),
   notes: T('Abstaining is a feature: an unresolved label is better than a confident wrong one.', 'Abstenerse es una virtud: mejor una etiqueta sin resolver que una errónea y segura.')},
  {layout: 'big', kicker: T('Data governance', 'Gobierno del dato'), big: `${TR.access_duration.stated_18_months}/${TR.access_duration.digital_workbooks}`,
   head: T('Unknown', 'Desconocido'), em: T('is not “no”.', 'no es «no».'),
   body: () => T(`Only ${TR.access_duration.stated_18_months} of ${TR.access_duration.digital_workbooks} digital workbooks state an access duration (18 months). A blank means unknown, not unlimited.`,
                 `Solo ${TR.access_duration.stated_18_months} de ${TR.access_duration.digital_workbooks} cuadernos digitales indican duración de acceso (18 meses). Un vacío significa desconocido, no ilimitado.`),
   notes: T('Treating blanks as “no limit” would invent a product feature.', 'Tratar el vacío como «sin límite» inventaría una característica del producto.')},
  {layout: 'table', kicker: T('Trap · series', 'Trampa · serie'), head: T(`${TR.series_mismatch.length} records filed`, `${TR.series_mismatch.length} registros archivados`), em: T('under the wrong name.', 'con el nombre equivocado.'),
   cols: T(['Row', 'Title', 'Series field'], ['Fila', 'Título', 'Campo serie']),
   rows: () => TR.series_mismatch.map(m => [String(m.row_id), m.title, m.series_field]),
   body: () => T('Flag and re-file in a reporting view. Never overwrite the source.', 'Señalar y reubicar en una vista de reporting. Nunca sobrescribir el origen.'),
   notes: T('These two rows reappear later as fake price exceptions.', 'Estas dos filas reaparecen después como falsas excepciones de precio.')},
  {layout: 'versus', kicker: T('Trap · parsing', 'Trampa · parsing'), head: T('Gleebook', 'Gleebook'), em: T('is not an eBook.', 'no es un eBook.'),
   versus: () => [
     {label: T('Naive substring rule', 'Regla ingenua por subcadena'), code: '"ebook" in title', n: TR.ebook_substring.naive_hits.length, txt: T('false eBook: digital access granted', 'falso eBook: se concede acceso digital'), bad: true},
     {label: T('Word-boundary rule', 'Regla con límites de palabra'), code: '\\be-?book\\b', n: TR.ebook_substring.word_boundary_hits.length, txt: T('matches: printed stays printed', 'coincidencias: lo impreso sigue impreso')}],
   notes: T('The record was right. The parser was the problem.', 'El registro era correcto. El problema era el parser.')},
  {layout: 'list', kicker: T('Traps 3–7', 'Trampas 3–7'), head: T('Ambiguity is', 'La ambigüedad es'), em: T('operational debt.', 'deuda operativa.'),
   items: l => [
     T(`Edition aliases: “Second Edition” ×3 and “2nd Edition” ×3. Normalise in reporting only.`, `Alias de edición: «Second Edition» ×3 y «2nd Edition» ×3. Normalizar solo en reporting.`)[l],
     T(`Pack wording: “+ Online Access” ×${TR.pack_wording['+ Online Access']} vs “with Digital” ×${TR.pack_wording['with Digital']}. Merging is a business decision.`, `Nombre del pack: «+ Online Access» ×${TR.pack_wording['+ Online Access']} frente a «with Digital» ×${TR.pack_wording['with Digital']}. Fusionarlos es una decisión de negocio.`)[l],
     T(`Taxonomy drift: row ${TR.segment_drift[0].row_id}, a Primary book filed under a Secondary sub-segment.`, `Deriva de taxonomía: fila ${TR.segment_drift[0].row_id}, un libro de Primaria en un subsegmento de Secundaria.`)[l],
     T(`“TB” at ${eur(TR.tb_outlier.price, 'en')}: the only price above the upper IQR fence (about €100). Type unresolved.`, `«TB» a ${eur(TR.tb_outlier.price, 'es')}: único precio sobre la valla IQR superior (unos 100 €). Tipo sin resolver.`)[l],
     T(`Sparse access duration: ${TR.access_duration.unspecified} digital workbooks say nothing.`, `Duración de acceso escasa: ${TR.access_duration.unspecified} cuadernos digitales no indican nada.`)[l],
   ],
   notes: T('Each one is logged with a decision: stet, query, normalise or investigate.', 'Cada una queda registrada con una decisión: mantener, consultar, normalizar o investigar.')},
  {layout: 'big', kicker: T('Research design', 'Diseño analítico'), big: String(H.comparables),
   head: T('comparable groups', 'grupos comparables'), em: T(`out of ${H.groups_total}.`, `de ${H.groups_total}.`),
   body: () => T(`Ten attributes held constant: series, type, role, part, pack, answer key, both digital rights, resources, edition. Only the level changes. ${H.groups_single_level} groups exist at a single level and are set aside.`,
                 `Diez atributos fijos: serie, tipo, rol, parte, pack, solucionario, ambos accesos digitales, recursos y edición. Solo cambia el nivel. ${H.groups_single_level} grupos tienen un único nivel y quedan fuera.`),
   notes: T('Like for like is a definition you write down before you look at prices.', 'Comparar lo comparable es una definición que se escribe antes de mirar precios.')},
  {layout: 'grid', kicker: T('Finding', 'Hallazgo'), big: `${H.consistent}/${H.comparables}`, repaired: false,
   head: T('hold one price', 'mantienen un precio'), em: T('at every level.', 'en todos los niveles.'),
   body: l => T(`${pct(H.consistent_pct, 'en')} of comparable groups. Six exceptions remain.`, `${pct(H.consistent_pct, 'es')} de los grupos comparables. Quedan seis excepciones.`)[l],
   notes: T('Pause on the six: are they pricing decisions?', 'Detente en las seis: ¿son decisiones de precio?')},
  {layout: 'exceptions', kicker: T('The exceptions', 'Las excepciones'), head: T('Four Starter prices,', 'Cuatro precios Starter,'), em: T('two filing errors.', 'dos errores de archivo.'),
   notes: T('Starter pricing is plausible strategy; the two misfiled records are not prices at all.', 'El precio Starter es una estrategia plausible; los dos registros mal archivados no son precios.')},
  {layout: 'grid', kicker: T('Reporting view', 'Vista de reporting'), big: `${H.consistent_after_series_repair}/${H.comparables_after_series_repair}`, repaired: true,
   head: T('after re-filing', 'tras reubicar'), em: T(`${H.exceptions_misfiled} records.`, `${H.exceptions_misfiled} registros.`),
   body: l => T(`${pct(H.consistent_pct_after_series_repair, 'en')}, with the source file untouched. Two “price exceptions” were data errors.`, `${pct(H.consistent_pct_after_series_repair, 'es')}, sin tocar el fichero de origen. Dos «excepciones de precio» eran errores de datos.`)[l],
   notes: T('This is the core lesson: data quality changes the commercial reading.', 'Es la lección central: la calidad del dato cambia la lectura comercial.')},
  {layout: 'bars', kicker: T('Product mix', 'Mezcla de productos'), head: T('Different products,', 'Productos distintos,'), em: T('different baselines.', 'referencias distintas.'),
   notes: T('Mean fictional list price by product type, with counts.', 'Precio medio ficticio por tipo de producto, con recuentos.')},
  {layout: 'matched', kicker: T('Matched comparisons', 'Comparaciones emparejadas'), head: T('Two parts cost more', 'Dos partes cuestan más'), em: T('than one book.', 'que un libro.'),
   notes: T('Same series and level in every comparison. At two Little Lanterns levels the parts and the volume carry different edition labels; the premium is identical either way.', 'Misma serie y nivel en cada comparación. En dos niveles de Little Lanterns las partes y el volumen llevan etiquetas de edición distintas; la prima es idéntica en ambos casos.')},
  {layout: 'limits', kicker: T('Limits', 'Límites'), head: T('What a list price', 'Lo que un precio de catálogo'), em: T('can’t tell you.', 'no puede decir.'),
   notes: T('No recommended price: hand over precise questions instead.', 'Sin precio recomendado: se entregan preguntas precisas.')},
  {layout: 'end', kicker: T('Takeaway', 'Conclusión'),
   notes: T('Close on the method, and point to the files.', 'Cierra con el método y señala los ficheros.')},
];

function create(lang) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Alfonso Cifuentes';
  pptx.title = lang === 'es' ? 'PRICE / SIGNAL — Caso de estudio independiente (datos ficticios)' : 'PRICE / SIGNAL — Independent case study (fictional data)';
  pptx.subject = 'Pricing analytics and data quality on an invented catalogue';
  pptx.lang = lang === 'es' ? 'es-ES' : 'en-GB';
  const L = o => (o && typeof o === 'object' && 'en' in o) ? o[lang] : o;

  const tx = (s, t, x, y, w, h, o = {}) => s.addText(t, {x, y, w, h, margin: 0, fontFace: FT, fontSize: 16, color: P.key, valign: 'top', ...o});
  const rect = (s, x, y, w, h, fill, line) => s.addShape('rect', {x, y, w, h, fill: fill ? {color: fill} : {type: 'none'}, line: line ? {color: line.c, width: line.w || 1, dashType: line.dash || 'solid'} : {type: 'none'}});
  const label = (s, t, x, y, w, color = P.magenta, o = {}) => tx(s, t.toUpperCase(), x, y, w, 0.3, {fontFace: FM, fontSize: 11, bold: true, color, charSpacing: 1.5, ...o});
  const headline = (s, spec, dark, y = 1.05, size = 44) => {
    s.addText([
      {text: L(spec.head), options: {fontFace: FD, bold: true, color: dark ? P.paper : P.key, breakLine: true}},
      {text: L(spec.em), options: {fontFace: FT, italic: true, color: dark ? '9AA6FF' : P.blue}},
    ], {x: X, y, w: W - 2 * X, h: 1.6, fontSize: size, margin: 0, valign: 'top', lineSpacingMultiple: .9});
  };

  slides.forEach((spec, i) => {
    const s = pptx.addSlide();
    const dark = ['title', 'limits', 'end'].includes(spec.layout);
    const fg = dark ? P.paper : P.key, sub = dark ? 'B9BCC6' : P.ink2;
    s.background = {color: dark ? P.key : P.paper};
    // crop marks
    [[0.25, 0.25, 1, 1], [W - 0.25, 0.25, -1, 1], [0.25, HT - 0.25, 1, -1], [W - 0.25, HT - 0.25, -1, -1]].forEach(([x, y, dx, dy]) => {
      s.addShape('line', {x: dx > 0 ? x : x - .22, y, w: .22, h: 0, line: {color: fg, width: .75}});
      s.addShape('line', {x, y: dy > 0 ? y : y - .22, w: 0, h: .22, line: {color: fg, width: .75}});
    });
    s.addText([{text: 'PRICE', options: {bold: true}}, {text: ' / ', options: {color: dark ? P.pink : P.magenta}}, {text: 'SIGNAL', options: {bold: true}}],
      {x: X, y: 0.42, w: 4, h: 0.3, fontFace: FD, fontSize: 13, color: fg, margin: 0, charSpacing: 1});
    label(s, L(spec.kicker), W - X - 5, 0.45, 5, dark ? P.pink : P.magenta, {align: 'right'});
    tx(s, `${String(i + 1).padStart(2, '0')} / ${slides.length}`, X, HT - 0.55, 2, 0.25, {fontFace: FM, fontSize: 10, color: sub});
    tx(s, L(T('FICTIONAL DATA · INDEPENDENT CASE STUDY', 'DATOS FICTICIOS · CASO INDEPENDIENTE')), W - X - 6, HT - 0.55, 6, 0.25, {fontFace: FM, fontSize: 10, color: sub, align: 'right'});
    if (spec.notes) s.addNotes(L(spec.notes));
    const body = (t, y, size = 18, w = W - 2 * X) => tx(s, t, X, y, w, 1.2, {fontSize: size, color: dark ? 'E3E4E8' : P.key});

    switch (spec.layout) {
      case 'title': {
        tx(s, L(T('THE PRICE', 'EL PRECIO')), X, 1.0, 12, 1.6, {fontFace: FD, bold: true, fontSize: 96, color: P.paper, charSpacing: -2});
        tx(s, L(T('OF CLARITY.', 'DE LA CLARIDAD.')), X, 2.45, 12, 1.2, {fontFace: FD, bold: true, fontSize: 64, color: P.paper, charSpacing: 2});
        tx(s, L(T('Before you compare prices, compare products.', 'Antes de comparar precios, compara productos.')), X, 4.0, 11, .6, {fontFace: FT, italic: true, fontSize: 26, color: '9AA6FF'});
        tx(s, L(T(`${H.products} invented products · ${H.consistent} of ${H.comparables} comparable groups hold one price · two of the six exceptions were filing errors.`,
                  `${H.products} productos inventados · ${H.consistent} de ${H.comparables} grupos comparables mantienen un precio · dos de las seis excepciones eran errores de archivo.`)), X, 4.9, 11.5, .9, {fontSize: 18, color: 'E3E4E8'});
        label(s, L(T('Alfonso Cifuentes · data analytics portfolio · all data fictional', 'Alfonso Cifuentes · portfolio de análisis de datos · todos los datos son ficticios')), X, 6.2, 11, P.pink);
        break;
      }
      case 'statement':
        headline(s, spec, dark);
        body(L(spec.body(lang)), 3.2, 20, 10.5);
        break;
      case 'big': {
        tx(s, spec.big, X - .05, 1.0, 6.2, 2.6, {fontFace: FD, bold: true, fontSize: 150, color: P.blue, charSpacing: -4});
        s.addText([{text: L(spec.head), options: {fontFace: FD, bold: true, color: fg, breakLine: true}}, {text: L(spec.em), options: {fontFace: FT, italic: true, color: P.blue}}],
          {x: 6.8, y: 1.55, w: 5.9, h: 1.5, fontSize: 34, margin: 0, valign: 'top'});
        rect(s, X, 4.25, W - 2 * X, .02, fg);
        body(L(spec.body()), 4.5, 19, 11.6);
        break;
      }
      case 'steps': {
        headline(s, spec, dark);
        L(spec.steps).forEach((t, j) => {
          const x = X + j * 3.05;
          s.addShape('ellipse', {x, y: 3.5, w: .62, h: .62, fill: {color: j === 3 ? P.magenta : P.blue}, line: {type: 'none'}});
          tx(s, String(j + 1), x, 3.6, .62, .45, {fontFace: FD, fontSize: 22, color: P.paper, align: 'center'});
          tx(s, t, x, 4.35, 2.8, 1, {fontFace: FD, bold: true, fontSize: 20});
        });
        s.addShape('line', {x: X + .62, y: 3.81, w: 9.15, h: 0, line: {color: P.magenta, width: 1.5}});
        break;
      }
      case 'table': {
        headline(s, spec, dark);
        const rows = [L(spec.cols).map(c => ({text: c, options: {bold: true, color: P.paper, fill: {color: P.key}, fontFace: FM, fontSize: 12}}))]
          .concat(spec.rows().map(r => r.map((c, j) => ({text: c, options: {fontFace: FM, fontSize: 13, color: j === 2 ? P.magenta : P.key, bold: j === 2}}))));
        s.addTable(rows, {x: X, y: 3.25, w: W - 2 * X, colW: [1.0, 7.4, 3.69], border: {type: 'solid', color: P.rule, pt: .75}, fill: {color: P.sheet}, rowH: .5, valign: 'middle', margin: .1});
        body(L(spec.body()), 5.1, 18);
        break;
      }
      case 'versus': {
        headline(s, spec, dark);
        spec.versus().forEach((v, j) => {
          const x = X + j * 6.06;
          rect(s, x, 3.3, 6.0, 2.6, P.sheet, {c: P.key, w: 1.25});
          label(s, L(v.label), x + .3, 3.5, 5.4, v.bad ? P.magenta : P.blue);
          tx(s, v.code, x + .3, 3.95, 5.4, .5, {fontFace: FM, fontSize: 22});
          tx(s, String(v.n), x + .3, 4.65, .8, .9, {fontFace: FD, bold: true, fontSize: 48, color: v.bad ? P.magenta : P.blue});
          tx(s, L(v.txt), x + 1.05, 4.95, 4.7, .8, {fontSize: 17});
        });
        break;
      }
      case 'list': {
        headline(s, spec, dark);
        spec.items(lang).forEach((t, j) => {
          const y = 3.15 + j * .68;
          s.addShape('ellipse', {x: X, y: y + .02, w: .36, h: .36, fill: {type: 'none'}, line: {color: P.magenta, width: 1.5}});
          tx(s, '?', X, y + .06, .36, .3, {fontFace: FD, bold: true, fontSize: 13, color: P.magenta, align: 'center'});
          tx(s, t, X + .6, y + .02, 11.4, .6, {fontSize: 17});
        });
        break;
      }
      case 'grid': {
        const size = .34, gap = .08, cols = 12;
        for (let k = 0; k < H.comparables; k++) {
          const e = k >= H.consistent ? A.exceptions[k - H.consistent] : null;
          const mis = e && e.kind === 'misfiled-record';
          const filled = !e || (mis && spec.repaired);
          const x = X + (k % cols) * (size + gap), y = 1.25 + Math.floor(k / cols) * (size + gap);
          rect(s, x, y, size, size, filled ? P.blue : null, {c: e && !filled && mis ? P.magenta : P.blue, w: 1.5});
          if (e) tx(s, mis ? (spec.repaired ? '✓' : 'M') : 'S', x, y + .07, size, .22, {fontFace: FM, bold: true, fontSize: 11, align: 'center', color: filled ? P.paper : (mis ? P.magenta : P.blue)});
        }
        tx(s, spec.big, 6.0, 1.1, 6.8, 1.9, {fontFace: FD, bold: true, fontSize: 108, color: spec.repaired ? P.blue : P.key, align: 'right', charSpacing: -3});
        s.addText([{text: L(spec.head), options: {fontFace: FD, bold: true, breakLine: true}}, {text: L(spec.em), options: {fontFace: FT, italic: true, color: P.blue}}],
          {x: 6.0, y: 3.0, w: 6.8, h: 1.2, fontSize: 28, margin: 0, align: 'right', valign: 'top'});
        rect(s, X, 4.55, W - 2 * X, .02, P.key);
        body(L(spec.body(lang)), 4.8, 19);
        tx(s, L(T('S = Starter priced lower · M = misfiled record', 'S = Starter más barato · M = registro mal archivado')), X, 5.7, 10, .3, {fontFace: FM, fontSize: 11, color: P.ink2});
        break;
      }
      case 'exceptions': {
        headline(s, spec, dark, .95, 40);
        const head = L(T(['Kind', 'Series (as recorded) · configuration', 'Odd value', 'Others', 'Gap'], ['Tipo', 'Serie (registrada) · configuración', 'Valor atípico', 'Resto', 'Diferencia']))
          .map(c => ({text: c, options: {bold: true, color: P.paper, fill: {color: P.key}, fontFace: FM, fontSize: 11}}));
        const rows = A.exceptions.map(e => {
          const odd = e.points.find(p => p.off_modal), mis = e.kind === 'misfiled-record';
          return [
            {text: mis ? L(T('Filing error', 'Error de archivo')) : L(T('Starter pricing', 'Precio Starter')), options: {color: mis ? P.magenta : P.blue, bold: true}},
            {text: `${e.series} · ${e.configuration}${mis ? `  (${L(T("row", "fila"))} ${odd.row_id}: ${odd.title.split(' ').slice(0, 2).join(' ')})` : ''}`},
            {text: `${odd.level} ${eur(odd.price, lang)}`}, {text: eur(e.modal_price, lang)}, {text: (e.gap_eur < 0 ? '−' : '+') + eur(Math.abs(e.gap_eur), lang)},
          ].map(c => ({text: c.text, options: {fontFace: FM, fontSize: 11.5, color: P.key, ...c.options}}));
        });
        s.addTable([head, ...rows], {x: X, y: 2.55, w: W - 2 * X, colW: [1.75, 6.0, 1.75, 1.35, 1.24], border: {type: 'solid', color: P.rule, pt: .75}, fill: {color: P.sheet}, rowH: .44, valign: 'middle', margin: .08});
        tx(s, L(T('Four Starter levels priced €4–€8 below their other levels: plausible strategy, unconfirmed. Two groups contain another series’ product, so their “exception” is a filing error.',
                  'Cuatro niveles Starter entre 4 y 8 € por debajo del resto: estrategia plausible, sin confirmar. Dos grupos contienen un producto de otra serie: su «excepción» es un error de archivo.')), X, 6.12, W - 2 * X, .8, {fontSize: 15, color: P.ink2});
        break;
      }
      case 'bars': {
        headline(s, spec, dark);
        const data = A.type_stats, max = Math.max(...data.map(d => d.mean));
        data.forEach((d, j) => {
          const y = 3.15 + j * .52;
          tx(s, `${typeName[lang](d.type)} (${d.count})`, X, y + .04, 3.1, .3, {fontFace: FM, fontSize: 12});
          rect(s, X + 3.2, y, 7.0 * d.mean / max, .3, d.type === 'TB' ? P.magenta : P.blue);
          tx(s, eur(d.mean, lang), X + 3.3 + 7.0 * d.mean / max, y + .04, 1.5, .3, {fontFace: FM, fontSize: 12, bold: true});
        });
        tx(s, L(T(`Pooled mean ${eur(H.mean, 'en')}: context only, never a comparison baseline.`, `Media global ${eur(H.mean, 'es')}: solo contexto, nunca referencia de comparación.`)), X, 6.35, 11, .4, {fontSize: 15, color: P.ink2, italic: true});
        break;
      }
      case 'matched': {
        headline(s, spec, dark, 1.0, 40);
        const max = Math.max(...TR.split_volumes.map(v => v.parts_total)) * 1.05, Wb = 6.4;
        TR.split_volumes.forEach((v, j) => {
          const y = 2.85 + j * 1.25;
          label(s, `${v.series} · ${L(T('same level, same edition', 'mismo nivel y edición'))}`, X, y, 7, P.ink2);
          rect(s, X, y + .35, Wb * v.complete / max, .3, P.key);
          tx(s, `${L(T('Complete', 'Completo'))} ${eur(v.complete, lang)}`, X + Wb * v.complete / max + .15, y + .37, 2.5, .3, {fontFace: FM, fontSize: 12});
          rect(s, X, y + .72, Wb * v.parts_total / max / 2, .3, P.blue);
          rect(s, X + Wb * v.parts_total / max / 2, y + .72, Wb * v.parts_total / max / 2, .3, '6B78D6');
          rect(s, X + Wb * v.complete / max, y + .69, Wb * v.premium_eur / max, .36, null, {c: P.magenta, w: 2});
          tx(s, `A + B ${eur(v.parts_total, lang)}   +${eur(v.premium_eur, lang)} · +${pct(v.premium_pct, lang)}`, X + Wb * v.parts_total / max + .15, y + .74, 4.6, .3, {fontFace: FM, fontSize: 12, bold: true, color: P.magenta});
        });
        rect(s, X, 5.45, W - 2 * X, .02, P.key);
        tx(s, L(T(`Answer keys: ${TR.answer_support.parity} of ${TR.answer_support.pairs} with-key / without-key workbook pairs share one price when matched on series, level and edition.`,
                  `Solucionarios: ${TR.answer_support.parity} de ${TR.answer_support.pairs} parejas de cuaderno con y sin soluciones comparten precio al emparejar por serie, nivel y edición.`)), X, 5.65, W - 2 * X, .8, {fontSize: 17});
        break;
      }
      case 'limits': {
        headline(s, spec, dark, 1.0, 40);
        label(s, L(T('Not in the data', 'No está en los datos')), X, 2.7, 6, P.pink);
        tx(s, L(T('SALES · COSTS · MARGINS · DISCOUNTS · ELASTICITY', 'VENTAS · COSTES · MÁRGENES · DESCUENTOS · ELASTICIDAD')), X, 3.0, W - 2 * X, .6,
          {fontFace: FD, bold: true, fontSize: 28, color: '8D909B', strike: 'sngStrike'});
        const qs = L(T(['Is the Starter discount in Mosaic English and Silverline Skills deliberate?', 'Who owns series metadata, and how were rows 20 and 155 misfiled?', 'Is the premium of about 14% for buying a book in two parts intended?', `What is “TB”, and does ${eur(TR.tb_outlier.price, 'en')} belong in this catalogue?`],
                       ['¿Es deliberado el descuento Starter en Mosaic English y Silverline Skills?', '¿Quién gestiona los metadatos de serie y cómo se archivaron mal las filas 20 y 155?', '¿Es intencionado el sobrecoste de en torno al 14 % por comprar un libro en dos partes?', `¿Qué es «TB» y encaja ${eur(TR.tb_outlier.price, 'es')} en este catálogo?`]));
        qs.forEach((q, j) => {
          const x = X + (j % 2) * 6.06, y = 4.0 + Math.floor(j / 2) * 1.2;
          rect(s, x, y, 6.0, 1.1, null, {c: '3A3C44', w: 1});
          tx(s, `Q${j + 1}`, x + .2, y + .14, 1, .25, {fontFace: FM, fontSize: 11, bold: true, color: P.pink});
          tx(s, q, x + .2, y + .42, 5.6, .65, {fontSize: 15, color: 'E3E4E8'});
        });
        break;
      }
      case 'end': {
        tx(s, 'PRICE / SIGNAL', X, 1.1, 12, 1.4, {fontFace: FD, bold: true, fontSize: 80, color: P.paper, charSpacing: 1});
        tx(s, L(T('Keep the source. Recover the structure. Compare like with like. Say what you don’t know.', 'Conserva el origen. Recupera la estructura. Compara lo comparable. Di lo que no sabes.')), X, 2.8, 11.5, 1.1, {fontFace: FT, italic: true, fontSize: 26, color: '9AA6FF'});
        tx(s, L(T('Files: synthetic dataset (raw + enriched CSV), analysis JSON, Excel workbook with live formulas, this deck, and a 2:36 film. Generator, analysis and tests are reproducible from seed 20261011.',
                  'Ficheros: dataset sintético (CSV de origen y enriquecido), JSON de análisis, Excel con fórmulas vivas, esta presentación y una película de 2:36. Generador, análisis y tests reproducibles con la semilla 20261011.')), X, 4.2, 11.6, 1.2, {fontSize: 17, color: 'E3E4E8'});
        label(s, 'github.com/AlfonsoCifuentes', X, 5.7, 6, P.pink);
        tx(s, L(T('All series, products and prices are invented. Not affiliated with any publisher or employer.', 'Todas las series, productos y precios son inventados. Sin relación con ninguna editorial ni empleador.')), X, 6.1, 11.6, .4, {fontFace: FM, fontSize: 11, color: '9FA2AD'});
        break;
      }
    }
  });
  const name = lang === 'es' ? 'PRICE_SIGNAL_Caso_Publico_ES.pptx' : 'PRICE_SIGNAL_Public_Case_EN.pptx';
  return pptx.writeFile({fileName: path.join(__dirname, name)}).then(() => console.log('wrote', name, slides.length, 'slides'));
}
Promise.all([create('en'), create('es')]).catch(e => { console.error(e); process.exit(1); });
