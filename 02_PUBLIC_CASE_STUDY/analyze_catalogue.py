#!/usr/bin/env python3
"""Pricing Demo — independent analysis of the public fictional catalogue.

Reads ONLY the two public CSVs produced by generate_independent_dataset.py and writes
public_analysis.json. Standard library only. Deterministic output (LF, sorted, fixed rounding).

Two kinds of evidence are kept apart on purpose:
  * reference labels  -> the enriched CSV (the generator's expected answer)
  * predictions       -> a rule-based parser that only sees the raw 5-column titles
"""
from pathlib import Path
import csv, json, re, hashlib, statistics, collections

ROOT = Path(__file__).resolve().parent
LF = chr(10)
GROUP = ['Series', 'Product_Type', 'Product_Role', 'Book_Part', 'Pack_Type', 'Answer_Support',
         'Digital_Main_Book_Access', 'Digital_Practice_Book_Access', 'Additional_Resources', 'Edition']
LEVEL_ORDER = ['Starter', 'A1', 'A2', 'B1', 'B2', 'C1'] + [f'Level {i}' for i in range(1, 7)]


def load(name):
    with (ROOT / name).open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    for i, r in enumerate(rows, start=1):
        r['row_id'] = i
        r['price'] = float(r['Price_EUR'])
    return rows


def sha(name):
    return hashlib.sha256((ROOT / name).read_bytes()).hexdigest()


def r2(x):
    return round(x + 0.0, 2)


raw = load('public_raw_catalogue.csv')
enh = load('public_enriched_catalogue.csv')
assert [r['Title'] for r in raw] == [r['Title'] for r in enh], 'raw and enriched rows must align 1:1'
SERIES = sorted({r['Series'] for r in enh}, key=len, reverse=True)  # longest first for prefix match


def title_series(title):
    return next((s for s in SERIES if title.startswith(s + ' ')), None)


def config_label(r):
    """Human-readable configuration (everything in GROUP except Series)."""
    bits = [r['Product_Type']]
    if r['Book_Part']:
        bits.append({'Full': 'Complete', 'A': 'Part A', 'B': 'Part B'}[r['Book_Part']])
    if r['Pack_Type']:
        bits.append(r['Pack_Type'])
    if r['Answer_Support']:
        bits.append(r['Answer_Support'])
    if r['Edition']:
        bits.append(r['Edition'])
    if r['Product_Type'] == 'Workbook' and not r['Answer_Support'] and r['Audio_Access']:
        bits.append('with Audio')
    return ' · '.join(bits)


def comparable_groups(rows, series_of=lambda r: r['Series']):
    groups = collections.defaultdict(list)
    for r in rows:
        key = (series_of(r),) + tuple(r[k] for k in GROUP[1:])
        groups[key].append(r)
    comps = {k: v for k, v in groups.items() if len({x['Level'] for x in v}) > 1}
    singles = {k: v for k, v in groups.items() if len({x['Level'] for x in v}) <= 1}
    return comps, singles


# ---------------------------------------------------------------- 1. cross-level consistency
comps, singles = comparable_groups(enh)
consistent = [k for k, v in comps.items() if len({x['price'] for x in v}) == 1]
exceptions = []
for k, v in comps.items():
    prices = collections.Counter(x['price'] for x in v)
    if len(prices) == 1:
        continue
    modal = prices.most_common(1)[0][0]
    odd = [x for x in v if x['price'] != modal]
    misfiled = [x for x in odd if title_series(x['Title']) != x['Series']]
    if misfiled:
        kind, why = 'misfiled-record', (
            f"Row {misfiled[0]['row_id']} is titled '{misfiled[0]['Title']}' but its Series field says "
            f"{misfiled[0]['Series']}. It is another collection's product sitting in this group, not a price decision.")
    elif all(x['Level'] == 'Starter' for x in odd):
        kind, why = 'starter-pricing', (
            'Only the Starter level is cheaper; every other level shares one price. A deliberate entry-level '
            'price is plausible, but list prices alone cannot confirm the strategy.')
    else:
        kind, why = 'unexplained', 'Price varies across levels without a structural explanation.'
    ordered = sorted(v, key=lambda x: (LEVEL_ORDER.index(x['Level']), x['row_id']))
    exceptions.append({
        'series': k[0], 'configuration': config_label(v[0]), 'kind': kind, 'explanation': why,
        'modal_price': modal, 'levels': len({x['Level'] for x in v}), 'records': len(v),
        'points': [{'row_id': x['row_id'], 'level': x['Level'], 'price': x['price'], 'title': x['Title'],
                    'series_field': x['Series'], 'off_modal': x['price'] != modal} for x in ordered],
        'gap_eur': r2(min(x['price'] for x in odd) - modal),
    })
exceptions.sort(key=lambda e: (e['kind'] != 'starter-pricing', e['series'], e['configuration']))

# Repair series from title prefix (reporting view only — source is never overwritten) and recount.
comps_fixed, singles_fixed = comparable_groups(enh, series_of=lambda r: title_series(r['Title']) or r['Series'])
# a comparable group that holds two records at one level is itself a signal: as recorded, the misfiled rows cause exactly that
dup_level = lambda gs: sum(len(v) != len({x['Level'] for x in v}) for v in gs.values())
consistent_fixed = sum(len({x['price'] for x in v}) == 1 for v in comps_fixed.values())

# ---------------------------------------------------------------- 2. traps with evidence
mismatch = [{'row_id': r['row_id'], 'title': r['Title'], 'series_field': r['Series'],
             'title_prefix': title_series(r['Title'])} for r in enh if title_series(r['Title']) != r['Series']]

edition_rows = [{'row_id': r['row_id'], 'title': r['Title'], 'edition': r['Edition'], 'level': r['Level']}
                for r in enh if r['Edition']]

naive_ebook = [r for r in raw if 'ebook' in r['Title'].lower()]
bounded_ebook = [r for r in raw if re.search(r'\be-?book\b', r['Title'], re.I)]

segment_drift = [{'row_id': r['row_id'], 'title': r['Title'], 'segment': r['Segment'], 'sub_segment': r['Sub-Segment'],
                  'series_norm': collections.Counter(x['Sub-Segment'] for x in enh if x['Series'] == r['Series']).most_common(1)[0][0]}
                 for r in enh if r['Segment'] == 'Primary' and r['Sub-Segment'] in ('Secondary', 'Upper Secondary')]

dw = [r for r in enh if r['Product_Type'] == 'Digital Workbook']
access = {'digital_workbooks': len(dw), 'stated_18_months': sum(r['Access_Duration'] == '18 months' for r in dw),
          'unspecified': sum(not r['Access_Duration'] for r in dw),
          'stated_rows': [{'row_id': r['row_id'], 'title': r['Title'], 'price': r['price']} for r in dw if r['Access_Duration']],
          'price_same_when_stated': len({r['price'] for r in dw if r['Access_Duration'] and r['Series'] == 'Mosaic English'} |
                                        {r['price'] for r in dw if not r['Access_Duration'] and r['Series'] == 'Mosaic English'}) == 1}

pack_variants = collections.Counter()
for r in enh:
    if r['Pack_Type'] == 'Study Pack':
        pack_variants['+ Online Access' if 'Online Access' in r['Title'] else 'with Digital'] += 1

prices = sorted(r['price'] for r in enh)
q1, q2, q3 = statistics.quantiles(prices, n=4, method='inclusive')
iqr = q3 - q1
upper = q3 + 1.5 * iqr
tb = next(r for r in enh if r['Product_Type'] == 'TB')
outliers = [{'row_id': r['row_id'], 'title': r['Title'], 'price': r['price']} for r in enh if r['price'] > upper]

split = []
for s in sorted({r['Series'] for r in enh if r['Book_Part']}):
    for lvl in LEVEL_ORDER:
        parts = {r['Book_Part']: r for r in enh if r['Series'] == s and r['Level'] == lvl and r['Book_Part']}
        if {'Full', 'A', 'B'} <= parts.keys():
            full, a, b = parts['Full']['price'], parts['A']['price'], parts['B']['price']
            split.append({'series': s, 'level': lvl, 'complete': full, 'part_a': a, 'part_b': b,
                          'parts_total': r2(a + b), 'premium_eur': r2(a + b - full),
                          'premium_pct': round(100 * (a + b - full) / full, 1),
                          'edition_mixed': len({parts[p]['Edition'] for p in parts}) > 1})
split_by_series = []
for s in sorted({x['series'] for x in split}):
    xs = [x for x in split if x['series'] == s]
    split_by_series.append({'series': s, 'levels': len(xs), 'complete': xs[0]['complete'], 'parts_total': xs[0]['parts_total'],
                            'premium_eur': xs[0]['premium_eur'], 'premium_pct': xs[0]['premium_pct'],
                            'uniform': len({(x['complete'], x['parts_total']) for x in xs}) == 1,
                            # strict = parts and complete volume carry the same edition label; mixed levels are indicative only
                            'levels_strict': sum(not x['edition_mixed'] for x in xs),
                            'levels_edition_mixed': sum(x['edition_mixed'] for x in xs)})

keyed = collections.defaultdict(dict)
for r in enh:
    if r['Answer_Support']:
        keyed[(r['Series'], r['Level'], r['Product_Type'], r['Edition'])][r['Answer_Support']] = r['price']
pairs = [v for v in keyed.values() if {'With Key', 'Without Key'} <= v.keys()]
answer = {'pairs': len(pairs), 'parity': sum(v['With Key'] == v['Without Key'] for v in pairs),
          'series': sorted({k[0] for k, v in keyed.items() if {'With Key', 'Without Key'} <= v.keys()})}

starter = []
for e in exceptions:
    if e['kind'] == 'starter-pricing':
        st = next(p for p in e['points'] if p['level'] == 'Starter')
        starter.append({'series': e['series'], 'configuration': e['configuration'], 'starter': st['price'],
                        'other_levels': e['modal_price'], 'gap_eur': r2(st['price'] - e['modal_price']),
                        'gap_pct': round(100 * (st['price'] - e['modal_price']) / e['modal_price'], 1)})

# ---------------------------------------------------------------- 3. rule-based parser vs reference
LEVEL_RE = re.compile(r'\b(Starter|A1|A2|B1|B2|C1|Level [1-6])\b')


def parse(title, naive=False):
    """Predict attributes from a raw title. `naive` reproduces the substring mistake."""
    t = title
    p = {}
    m = LEVEL_RE.search(t)
    p['Level'] = m.group(1) if m else ''
    if 'Digital Workbook' in t:
        p['Product_Type'] = 'Digital Workbook'
    elif re.search(r'\bWorkbook\b', t):
        p['Product_Type'] = 'Workbook'
    elif 'Pupil Book' in t:
        p['Product_Type'] = 'Pupil Book'
    elif 'Student Book' in t or 'Pack' in t:
        p['Product_Type'] = 'Student Book' if not re.search(r'\bTB\b', t) else 'UNRESOLVED'
    else:
        p['Product_Type'] = 'UNRESOLVED'
    p['Pack_Type'] = 'Premium Pack' if 'Premium Pack' in t else 'Study Pack' if 'Study Pack' in t else ''
    p['Answer_Support'] = 'Without Key' if 'without Key' in t else 'With Key' if 'with Key' in t else ''
    p['Book_Part'] = 'Full' if t.endswith(' Complete') else 'A' if t.endswith(' Part A') else 'B' if t.endswith(' Part B') else ''
    p['Audio_Access'] = 'Yes' if re.search(r'\bwith Audio\b', t) else ''
    p['Digital_Practice_Book_Access'] = 'Yes' if 'Digital Workbook' in t else ''
    if naive:
        digital = 'digital' in t.lower() or 'online' in t.lower() or 'ebook' in t.lower()
    else:
        digital = bool(re.search(r'\b(with Digital|Online Access|e-?book)\b', t, re.I))
    p['Digital_Main_Book_Access'] = 'Yes' if digital and 'Digital Workbook' not in t else ''
    return p


FIELDS = ['Level', 'Product_Type', 'Pack_Type', 'Answer_Support', 'Book_Part', 'Audio_Access',
          'Digital_Practice_Book_Access', 'Digital_Main_Book_Access']


def evaluate(naive):
    out = {}
    for f in FIELDS:
        miss = []
        for rw, en in zip(raw, enh):
            pred = parse(rw['Title'], naive)[f]
            if pred != en[f]:
                miss.append({'row_id': rw['row_id'], 'title': rw['Title'], 'predicted': pred, 'reference': en[f]})
        out[f] = {'correct': len(raw) - len(miss), 'total': len(raw),
                  'accuracy_pct': round(100 * (len(raw) - len(miss)) / len(raw), 1), 'mismatches': miss}
    return out


parser_robust = evaluate(False)
parser_naive = evaluate(True)
not_in_title = ['Series (only a prefix — the field itself can be wrong)', 'Edition (absent from every raw title)',
                'Access_Duration (absent from every raw title)', 'Additional_Resources (not stated in titles)',
                'Segment / Sub-Segment (record metadata)']

# ---------------------------------------------------------------- 4. explorer matrix
explorer = []
for s in sorted({r['Series'] for r in enh}):
    rows_s = [r for r in enh if r['Series'] == s]
    lv = sorted({r['Level'] for r in rows_s}, key=LEVEL_ORDER.index)
    cfgs = collections.OrderedDict()
    for r in sorted(rows_s, key=lambda r: r['row_id']):
        cfgs.setdefault(config_label(r), []).append(r)
    lines = []
    for label, rs in cfgs.items():
        cells = {}
        for r in rs:
            flags = []
            if title_series(r['Title']) != r['Series']:
                flags.append('misfiled')
            if r['Edition']:
                flags.append('edition')
            if r['Product_Type'] == 'TB':
                flags.append('outlier')
            if 'Gleebook' in r['Title']:
                flags.append('ebook-trap')
            if r['Segment'] == 'Primary' and r['Sub-Segment'] == 'Secondary':
                flags.append('taxonomy')
            cells.setdefault(r['Level'], []).append({'row_id': r['row_id'], 'price': r['price'], 'title': r['Title'], 'flags': flags})
        lines.append({'configuration': label, 'cells': cells,
                      'stable': len({c['price'] for v in cells.values() for c in v}) == 1})
    explorer.append({'series': s, 'segment': rows_s[0]['Segment'], 'level_system': rows_s[0]['Level_System'],
                     'records': len(rows_s), 'levels': lv, 'lines': lines,
                     'min': min(r['price'] for r in rows_s), 'max': max(r['price'] for r in rows_s)})

hist = collections.Counter(int(p // 5) * 5 for p in prices)
histogram = [{'from': b, 'to': b + 5, 'count': hist.get(b, 0)} for b in range(10, 110, 5)]

by_type = collections.defaultdict(list)
for r in enh:
    by_type[r['Product_Type']].append(r['price'])
type_stats = [{'type': t, 'count': len(v), 'min': min(v), 'median': statistics.median(v), 'max': max(v),
               'mean': r2(statistics.mean(v))} for t, v in sorted(by_type.items(), key=lambda kv: -len(kv[1]))]

analysis = {
    'name': 'Pricing Demo — independent analysis (by Alfonso Cifuentes)',
    'note': 'All records, names and EUR list prices are invented. No sales, cost, margin, discount or demand data exist.',
    'inputs': {'public_raw_catalogue.csv': sha('public_raw_catalogue.csv'),
               'public_enriched_catalogue.csv': sha('public_enriched_catalogue.csv')},
    'headline': {
        'products': len(enh), 'series': len({r['Series'] for r in enh}), 'price_points': len(set(prices)),
        'mean': r2(statistics.mean(prices)), 'median': statistics.median(prices), 'min': prices[0], 'max': prices[-1],
        'groups_total': len(comps) + len(singles), 'groups_single_level': len(singles),
        'comparables': len(comps), 'consistent': len(consistent), 'consistent_pct': round(100 * len(consistent) / len(comps), 1),
        'exceptions': len(exceptions),
        'exceptions_starter': sum(e['kind'] == 'starter-pricing' for e in exceptions),
        'exceptions_misfiled': sum(e['kind'] == 'misfiled-record' for e in exceptions),
        'comparables_after_series_repair': len(comps_fixed), 'consistent_after_series_repair': consistent_fixed,
        'consistent_pct_after_series_repair': round(100 * consistent_fixed / len(comps_fixed), 1),
        'groups_total_after_series_repair': len(comps_fixed) + len(singles_fixed),
        'groups_with_duplicate_level': dup_level(comps), 'groups_with_duplicate_level_after_series_repair': dup_level(comps_fixed),
        'split_levels': len(split), 'split_levels_strict': sum(not x['edition_mixed'] for x in split),
        'split_levels_edition_mixed': sum(x['edition_mixed'] for x in split),
    },
    'exceptions': exceptions,
    'starter': starter,
    'traps': {
        'series_mismatch': mismatch,
        'edition_alias': {'rows': edition_rows, 'labels': sorted({r['edition'] for r in edition_rows}),
                          'normalised_to': 'Second Edition', 'effect': 'These six rows fall outside every cross-level group: they become single-level groups.'},
        'ebook_substring': {'naive_hits': [{'row_id': r['row_id'], 'title': r['Title']} for r in naive_ebook],
                            'word_boundary_hits': [{'row_id': r['row_id'], 'title': r['Title']} for r in bounded_ebook]},
        'pack_wording': dict(pack_variants),
        'segment_drift': segment_drift,
        'tb_outlier': {'row_id': tb['row_id'], 'title': tb['Title'], 'price': tb['price'],
                       'q1': q1, 'median': q2, 'q3': q3, 'iqr': r2(iqr), 'upper_fence': r2(upper),
                       'outliers_above_fence': outliers, 'role': tb['Product_Role'] or 'unresolved'},
        'access_duration': access,
        'split_volumes': split_by_series, 'split_volume_levels': split,
        'answer_support': answer,
    },
    'parser': {'fields': FIELDS, 'robust': parser_robust, 'naive': parser_naive, 'not_recoverable_from_title': not_in_title},
    'type_stats': type_stats,
    'histogram': histogram,
    'explorer': explorer,
}
(ROOT / 'public_analysis.json').write_text(json.dumps(analysis, ensure_ascii=False, indent=1) + LF, encoding='utf-8', newline=LF)

h = analysis['headline']
print(f"comparables {h['comparables']} · consistent {h['consistent']} ({h['consistent_pct']}%) · exceptions {h['exceptions']} "
      f"= {h['exceptions_starter']} starter + {h['exceptions_misfiled']} misfiled")
print(f"after series repair: {h['consistent_after_series_repair']}/{h['comparables_after_series_repair']} ({h['consistent_pct_after_series_repair']}%)")
print('split premium:', [(s['series'], s['premium_eur'], s['premium_pct']) for s in split_by_series])
print('ebook naive vs bounded:', len(naive_ebook), len(bounded_ebook), '| TB fence', round(upper, 2), 'outliers', len(outliers))
print('parser robust:', {f: v['accuracy_pct'] for f, v in parser_robust.items()})
print('parser naive :', {f: v['accuracy_pct'] for f, v in parser_naive.items()})
