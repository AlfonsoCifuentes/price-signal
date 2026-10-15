/* PRICE / SIGNAL — progressive enhancement over a fully readable static page.
   Everything is drawn from public/data/analysis.json (written by analyze_catalogue.py). No dependencies. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const eur = v => '€' + v.toFixed(2);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, attrs = {}, text) => {
    const n = tag.startsWith('svg:') ? document.createElementNS(NS, tag.slice(4)) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  };
  /* the page language decides the interface strings; catalogue identifiers (series, titles, types) stay as recorded */
  const ES = document.documentElement.lang === 'es';
  const ROOT = document.documentElement.dataset.root || '';  // '../' on the Spanish page, which lives in es/
  const TXT = ES ? {
    error: 'Los gráficos interactivos no pudieron cargar sus datos. Todas las cifras siguen en el texto y los ficheros originales están en «Ficheros».',
    stripLabel: (n, ranges) => `Gráfico de puntos con los ${n} precios ficticios por tipo de producto. ${ranges}.`,
    stripRange: (t, eur1, eur2) => `${t.type} ${t.count} productos, de ${eur1} a ${eur2}`,
    flags: {
      misfiled: ['M', 'El campo de serie contradice el título'],
      edition: ['E', 'Etiqueta de edición (Second Edition / 2nd Edition)'],
      outlier: ['O', 'Precio por encima del límite superior del IQR'],
      'ebook-trap': ['G', 'Contiene «ebook» como subcadena, pero es impreso'],
      taxonomy: ['T', 'Producto primario archivado bajo una subcategoría secundaria'],
    },
    meta: (s, unstable, lo, hi) => `${s.series} · ${s.segment} · niveles ${s.level_system} · ${s.records} registros · ${lo}–${hi} · ` +
      (unstable ? `${unstable} configuración${unstable > 1 ? 'es' : ''} con más de un precio` : 'todas las configuraciones tienen un único precio'),
    caption: s => `Precios de lista ficticios de ${s}, por configuración y nivel`,
    noProduct: 'sin producto',
    moved: (id, landed) => `La fila ${id} está archivada bajo ${landed}`,
    row: 'Fila',
    differs: m => `difiere de ${m}`,
    hasFlags: s => `${s}, tiene registros marcados`,
    filingError: 'Error de archivo', starterPricing: 'Precio Starter',
    gap: (id, title, p, m) => `La fila ${id} es ${title}: ${p} frente a ${m}`,
    starterGap: (p, m, n) => `Starter ${p} frente a ${m} en ${n} niveles restantes`,
    exception: ' (excepción)',
    belongs: (x, s) => `Pertenece a ${x}, no a ${s}.`,
    split: s => `${s} · completo frente a A + B`,
    filmLabel: 'Película PRICE / SIGNAL, corte sin voz con subtítulos',
    trackLabel: 'Español (guion)',
    noMp4: 'Tu navegador no puede reproducir este MP4. Descárgalo desde la sección Ficheros.',
    film: 'price-signal-film-es.mp4', poster: 'film-poster-es.jpg', vtt: 'price-signal-film.es.vtt', srclang: 'es',
  } : {
    error: 'The interactive charts could not load their data. Every figure is still in the text, and the raw files are under “Files”.',
    stripLabel: (n, ranges) => `Strip plot of all ${n} fictional list prices by product type. ${ranges}.`,
    stripRange: (t, eur1, eur2) => `${t.type} ${t.count} products, ${eur1} to ${eur2}`,
    flags: {
      misfiled: ['M', 'Series field contradicts the title'],
      edition: ['E', 'Edition label (Second Edition / 2nd Edition)'],
      outlier: ['O', 'Price above the upper IQR fence'],
      'ebook-trap': ['G', 'Contains “ebook” as a substring but is printed'],
      taxonomy: ['T', 'Primary product filed under a Secondary sub-segment'],
    },
    meta: (s, unstable, lo, hi) => `${s.series} · ${s.segment} · ${s.level_system} levels · ${s.records} records · ${lo}–${hi} · ` +
      (unstable ? `${unstable} configuration${unstable > 1 ? 's' : ''} with more than one price` : 'every configuration holds one price'),
    caption: s => `Fictional list prices for ${s}, by configuration and level`,
    noProduct: 'no product',
    moved: (id, landed) => `Row ${id} is filed under ${landed}`,
    row: 'Row',
    differs: m => `differs from ${m}`,
    hasFlags: s => `${s}, has flagged records`,
    filingError: 'Filing error', starterPricing: 'Starter pricing',
    gap: (id, title, p, m) => `Row ${id} is ${title}: ${p} vs ${m}`,
    starterGap: (p, m, n) => `Starter ${p} vs ${m} at ${n} other levels`,
    exception: ' (exception)',
    belongs: (x, s) => `Belongs to ${x}, not ${s}.`,
    split: s => `${s} · complete vs A + B`,
    filmLabel: 'PRICE / SIGNAL film, silent cut with captions',
    trackLabel: 'English (script)',
    noMp4: 'Your browser cannot play this MP4. Download it from the Files section.',
    film: 'price-signal-film.mp4', poster: 'film-poster.jpg', vtt: 'price-signal-film.en.vtt', srclang: 'en',
  };
  const FLAG = TXT.flags;

  /* ---------- hero entrance: wait for fonts so the width animation runs on the real face */
  const ready = () => document.documentElement.classList.add('ready');
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 700))]).then(ready);

  /* ---------- reading progress + current section */
  const bar = $('#progress');
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const d = document.documentElement, max = d.scrollHeight - d.clientHeight;
      bar.style.transform = `scaleX(${max > 0 ? d.scrollTop / max : 0})`;
      ticking = false;
    });
  }, { passive: true });
  const links = new Map($$('.nav a').map(a => [a.getAttribute('href').slice(1), a]));
  const navIO = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach(a => a.removeAttribute('aria-current'));
      links.get(e.target.id)?.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => links.has(s.id) && navIO.observe(s));

  /* ---------- scroll reveals (skipped entirely with reduced motion) */
  const revealIO = reduce ? null : new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px' });
  const reveal = nodes => { if (!revealIO) return; nodes.forEach(n => { n.classList.add('rv'); revealIO.observe(n); }); };
  reveal($$('.sec h2, .steps li, .finding, .versus, .schema, .repair, .register, .nots, .asks, .files'));

  /* ---------- data */
  fetch(ROOT + 'public/data/analysis.json').then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(A => {
    const rows = A.explorer.flatMap(s => s.lines.flatMap(l => Object.values(l.cells).flat().map(c => ({
      ...c, series: s.series, type: l.configuration.split(' · ')[0],
    }))));
    strip(A, rows);
    typeTable(A);
    explorer(A);
    multiples(A);
    splitBars(A);
    $$('#series-list li').forEach(li => {
      const s = A.explorer.find(x => x.series === li.textContent.trim());
      if (s) li.append(el('small', {}, `${s.records} · ${s.level_system}`));
    });
  }).catch(err => {
    console.error(err);
    $('#picker-meta').textContent = TXT.error;
  });

  /* ---------- Fig. 1 strip plot, drawn at the container's real width */
  function strip(A, rows) {
    const host = $('#strip');
    const order = A.type_stats.map(t => t.type);
    const draw = () => {
      const W = Math.max(280, host.clientWidth), narrow = W < 620;
      const left = narrow ? 8 : 128, right = 16, rowH = narrow ? 58 : 46, top = 10;
      const H = top + order.length * rowH + 30;
      const lo = 10, hi = 115, x = v => left + (v - lo) / (hi - lo) * (W - left - right);
      const svg = el('svg:svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true', focusable: 'false' });
      const grid = el('svg:g', { class: 'grid axis' });
      for (let v = 20; v <= 110; v += narrow ? 30 : 10) {
        grid.append(el('svg:line', { x1: x(v), x2: x(v), y1: top, y2: H - 22 }));
        grid.append(el('svg:text', { x: x(v), y: H - 6, 'text-anchor': 'middle' }, '€' + v));
      }
      svg.append(grid);
      order.forEach((type, i) => {
        const y0 = top + i * rowH, mid = y0 + (narrow ? 36 : rowH / 2);
        const t = A.type_stats[i];
        const g = el('svg:g', { class: 'cat' });
        g.append(el('svg:text', narrow ? { x: left, y: y0 + 12 } : { x: 0, y: mid + 4 }, `${type} (${t.count})`));
        svg.append(g);
        rows.filter(r => r.type === type).forEach(r => {
          const j = ((r.row_id * 2654435761) % 1000) / 1000 - .5;  // deterministic jitter
          const hot = r.flags.includes('outlier') || r.flags.includes('ebook-trap');
          svg.append(el('svg:circle', { cx: x(r.price), cy: mid + j * (rowH * .48), r: hot ? 4.5 : 3, class: hot ? 'hot' : '' }));
          if (hot) svg.append(el('svg:text', { x: x(r.price) + (r.price > 90 ? -8 : 8), y: mid - 9, 'text-anchor': r.price > 90 ? 'end' : 'start', class: 'tip' },
            r.flags.includes('outlier') ? `TB ${eur(r.price)}` : `Gleebook ${eur(r.price)}`));
        });
      });
      host.replaceChildren(svg);
    };
    draw();
    let w = host.clientWidth;
    new ResizeObserver(() => { if (Math.abs(host.clientWidth - w) > 8) { w = host.clientWidth; draw(); } }).observe(host);
    const ranges = A.type_stats.map(t => TXT.stripRange(t, eur(t.min), eur(t.max))).join('; ');
    host.setAttribute('aria-label', TXT.stripLabel(A.headline.products, ranges));
  }

  function typeTable(A) {
    $('#type-table').replaceChildren(...A.type_stats.map(t => {
      const tr = el('tr');
      [t.type, t.count, eur(t.min), eur(t.median), eur(t.max)].forEach(v => tr.append(el('td', {}, String(v))));
      return tr;
    }));
  }

  /* ---------- explorer: radio group + price grid */
  function explorer(A) {
    const picker = $('#picker');
    // where each misfiled record actually sits, so its home series can point to it
    const moved = A.traps.series_mismatch.map(m => {
      const s = A.explorer.find(x => x.series === m.series_field);
      for (const l of s.lines) for (const [lv, cs] of Object.entries(l.cells))
        if (cs.some(c => c.row_id === m.row_id)) return { row_id: m.row_id, home: m.title_prefix, landed: m.series_field, level: lv, configuration: l.configuration };
      return null;
    }).filter(Boolean);
    const issues = s => s.lines.some(l => !l.stable || Object.values(l.cells).flat().some(c => c.flags.length));
    const buttons = A.explorer.map((s, i) => {
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': 'false', tabindex: '-1', 'data-i': i }, s.series);
      if (issues(s)) { b.append(el('span', { class: 'dot', 'aria-hidden': 'true' })); b.setAttribute('aria-label', TXT.hasFlags(s.series)); }
      b.addEventListener('click', () => select(i, false));
      picker.append(b);
      return b;
    });
    picker.addEventListener('keydown', e => {
      const cur = buttons.findIndex(b => b.getAttribute('aria-checked') === 'true');
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (step) { e.preventDefault(); select((cur + step + buttons.length) % buttons.length, true); }
      if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      if (e.key === 'End') { e.preventDefault(); select(buttons.length - 1, true); }
    });
    function select(i, focus) {
      buttons.forEach((b, j) => { b.setAttribute('aria-checked', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      if (focus) buttons[i].focus();
      render(A.explorer[i]);
    }
    function render(s) {
      const unstable = s.lines.filter(l => !l.stable).length;
      $('#picker-meta').textContent = TXT.meta(s, unstable, eur(s.min), eur(s.max));
      const table = $('#matrix');
      const cap = el('caption', { class: 'sr-table' }, TXT.caption(s.series));
      const head = el('tr');
      head.append(el('th', { scope: 'col' }, 'Configuration'));
      s.levels.forEach(l => head.append(el('th', { scope: 'col' }, l)));
      const body = el('tbody');
      s.lines.forEach(line => {
        const all = Object.values(line.cells).flat().map(c => c.price);
        const counts = all.reduce((m, p) => m.set(p, (m.get(p) || 0) + 1), new Map());
        const modal = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
        const tr = el('tr', { class: line.stable ? '' : 'unstable' });
        tr.append(el('th', { scope: 'row' }, line.configuration));
        s.levels.forEach(lv => {
          const cells = line.cells[lv];
          if (!cells) {
            const away = moved.find(m => m.home === s.series && m.level === lv && m.configuration === line.configuration);
            const td = el('td', { class: away ? '' : 'na' }, away ? '' : '·');
            if (away) td.append(el('span', { class: 'moved' }, TXT.moved(away.row_id, away.landed)));
            else td.append(el('span', { class: 'sr-table' }, TXT.noProduct));
            tr.append(td); return;
          }
          const td = el('td');
          cells.forEach((c, k) => {
            if (k) td.append(el('br'));
            const off = c.price !== modal && all.length > 1;
            const v = el('span', { class: 'v' + (off ? ' off' : ''), title: `${TXT.row} ${c.row_id}: ${c.title}` }, eur(c.price));
            td.append(v);
            if (off) td.append(el('span', { class: 'sr-table' }, ` ${TXT.differs(eur(modal))}`));
            c.flags.forEach(f => {
              const [letter, text] = FLAG[f];
              const fl = el('span', { class: `flag f-${f}`, title: `${text} (row ${c.row_id})` }, letter);
              fl.setAttribute('aria-label', text);
              td.append(fl);
            });
          });
          tr.append(td);
        });
        body.append(tr);
      });
      const thead = el('thead'); thead.append(head);
      table.replaceChildren(cap, thead, body);
    }
    const start = A.explorer.findIndex(s => s.series === 'Glasshouse English');
    select(start < 0 ? 0 : start, false);
  }

  /* ---------- six small multiples, one shared euro-per-pixel scale */
  function multiples(A) {
    const host = $('#multiples');
    const SPAN = 22, W = 300, H = 120, padL = 46, padR = 12, padT = 12, padB = 22;
    const nodes = A.exceptions.map(e => {
      const mis = e.kind === 'misfiled-record';
      const box = el('div', { class: 'mult' + (mis ? ' misfiled' : '') });
      box.append(el('p', { class: 'kind ' + (mis ? 'k-misfiled' : 'k-starter') }, mis ? TXT.filingError : TXT.starterPricing));
      box.append(el('h3', {}, `${e.series} · ${e.configuration}`));
      const odd = e.points.find(p => p.off_modal);
      box.append(el('p', { class: 'gap' }, mis
        ? TXT.gap(odd.row_id, odd.title.replace(' Premium Pack with Digital', '').replace(' Study Pack with Digital', ''), eur(odd.price), eur(e.modal_price))
        : TXT.starterGap(eur(odd.price), eur(e.modal_price), e.levels - 1)));
      const levels = [...new Set(e.points.map(p => p.level))];
      const yTop = e.modal_price + 3, y = v => padT + (yTop - v) / SPAN * (H - padT - padB);
      const x = i => padL + (levels.length === 1 ? 0 : i / (levels.length - 1)) * (W - padL - padR);
      const svg = el('svg:svg', { viewBox: `0 0 ${W} ${H}`, role: 'img',
        'aria-label': `${e.series} ${e.configuration}: ${e.points.map(p => `${p.level} ${eur(p.price)}${p.off_modal ? TXT.exception : ''}`).join(', ')}` });
      svg.append(el('svg:line', { class: 'modal', x1: padL - 6, x2: W - padR, y1: y(e.modal_price), y2: y(e.modal_price) }));
      svg.append(el('svg:text', { x: padL - 10, y: y(e.modal_price) + 4, 'text-anchor': 'end' }, eur(e.modal_price)));
      const clash = Math.abs(y(odd.price) - y(e.modal_price)) < 13;
      svg.append(el('svg:text', { x: padL - 10, y: y(odd.price) + 4 + (clash ? 8 : 0), 'text-anchor': 'end', class: 'lbl-odd' }, eur(odd.price)));
      levels.forEach((l, i) => svg.append(el('svg:text', { x: x(i), y: H - 4, 'text-anchor': 'middle' }, l.replace('Level ', 'L'))));
      e.points.forEach(p => {
        const c = el('svg:circle', { cx: x(levels.indexOf(p.level)) + (p.off_modal && mis ? 7 : 0), cy: y(p.price), r: p.off_modal ? 5 : 4, class: p.off_modal ? 'odd' : '' });
        svg.append(c);
      });
      // note above the chart, so every chart in a row sits on the same baseline
      if (mis) box.append(el('p', { class: 'stray-note' }, TXT.belongs(e.points.find(p => p.off_modal).title.split(' ').slice(0, 2).join(' '), e.series)));
      box.append(svg);
      return box;
    });
    host.replaceChildren(...nodes);
    reveal([host]);  // one reveal for the grid: per-card reveals left grey gaps while scrolling
  }

  /* ---------- split-volume bars */
  function splitBars(A) {
    const host = $('#split-bars');
    const data = A.traps.split_volumes;
    const W = 320, rowH = 54, H = data.length * rowH, max = Math.max(...data.map(d => d.parts_total)) * 1.04;
    const sx = v => v / max * (W - 4);
    const svg = el('svg:svg', { viewBox: `0 0 ${W} ${H}` });
    data.forEach((d, i) => {
      const y = i * rowH;
      svg.append(el('svg:text', { x: 0, y: y + 10 }, TXT.split(d.series)));
      svg.append(el('svg:rect', { class: 'full', x: 0, y: y + 16, width: sx(d.complete), height: 12 }));
      const a = data[i].parts_total / 2;
      svg.append(el('svg:rect', { class: 'pa', x: 0, y: y + 31, width: sx(a), height: 12 }));
      svg.append(el('svg:rect', { class: 'pb', x: sx(a), y: y + 31, width: sx(d.parts_total - a), height: 12 }));
      svg.append(el('svg:rect', { class: 'over', x: sx(d.complete), y: y + 30, width: sx(d.premium_eur), height: 14 }));
    });
    host.replaceChildren(svg);
  }

  /* ---------- film: nothing loads until the visitor asks */
  $('#player-start')?.addEventListener('click', () => {
    const v = el('video', { controls: '', playsinline: '', preload: 'auto', poster: ROOT + 'public/media/' + TXT.poster, 'aria-label': TXT.filmLabel });
    v.append(el('source', { src: ROOT + 'public/media/' + TXT.film, type: 'video/mp4' }));
    const tr = el('track', { kind: 'captions', src: ROOT + 'public/media/' + TXT.vtt, srclang: TXT.srclang, label: TXT.trackLabel, default: '' });
    v.append(tr);
    v.append(document.createTextNode(TXT.noMp4));
    $('#player').replaceChildren(v);
    v.focus();
    v.play().catch(() => {});
  });
})();
