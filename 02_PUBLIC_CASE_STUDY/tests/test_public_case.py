"""Unit tests for the public fictional dataset and its analysis.

Run from the project root:  python -m unittest discover -s 02_PUBLIC_CASE_STUDY/tests -v
Key figures are recomputed here with separate, deliberately simple code instead of trusting
analyze_catalogue.py, so a bug in one path is caught by the other.
"""
from pathlib import Path
import csv, json, hashlib, subprocess, sys, unittest, collections, re

HERE = Path(__file__).resolve().parents[1]
OUTPUTS = ['public_raw_catalogue.csv', 'public_enriched_catalogue.csv', 'public_summary.json',
           'public_findings.json', 'public_analysis.json']


def rows(name):
    with (HERE / name).open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def digest():
    return {n: hashlib.sha256((HERE / n).read_bytes()).hexdigest() for n in OUTPUTS}


class Reproducibility(unittest.TestCase):
    def test_rerun_is_byte_identical(self):
        before = digest()
        for script in ('generate_independent_dataset.py', 'analyze_catalogue.py'):
            subprocess.run([sys.executable, str(HERE / script)], check=True, capture_output=True)
        self.assertEqual(before, digest())

    def test_outputs_use_lf_only(self):
        for n in OUTPUTS:
            self.assertNotIn(b'\r', (HERE / n).read_bytes(), n)

    def test_scripts_only_touch_their_own_folder(self):
        for script in ('generate_independent_dataset.py', 'analyze_catalogue.py'):
            code = re.sub(r'#.*', '', (HERE / script).read_text(encoding='utf-8'))
            self.assertNotRegex(code, r'parents\[|\.\./|\.\.\\|os\.walk|os\.listdir|glob\(|[A-Za-z]:[\\/]', script)
            # every path the script touches is ROOT / '<public file>'
            for target in re.findall(r"ROOT\s*/\s*'([^']+)'", code):
                self.assertTrue(target.startswith('public_'), target)


class Dataset(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw, cls.enh = rows('public_raw_catalogue.csv'), rows('public_enriched_catalogue.csv')
        cls.summary = json.loads((HERE / 'public_summary.json').read_text(encoding='utf-8'))

    def test_shape(self):
        self.assertEqual(len(self.raw), 362)
        self.assertEqual(len(self.enh), 362)
        self.assertEqual(len(self.raw[0]), 5)
        self.assertEqual(len(self.enh[0]), 19)
        self.assertEqual(len({r['Series'] for r in self.enh}), 12)

    def test_lineage(self):
        self.assertEqual([(r['Title'], r['Price_EUR']) for r in self.raw],
                         [(r['Title'], r['Price_EUR']) for r in self.enh])

    def test_unique_titles_positive_prices(self):
        self.assertEqual(len({r['Title'] for r in self.enh}), 362)
        self.assertTrue(all(float(r['Price_EUR']) > 0 for r in self.enh))

    def test_roles_follow_type(self):
        pairs = {(r['Product_Type'], r['Product_Role']) for r in self.enh}
        self.assertEqual(len({t for t, _ in pairs}), len(pairs), 'one role per product type')
        self.assertNotIn(('Digital Workbook', 'Bundle'), pairs)
        self.assertIn(('TB', ''), pairs)

    def test_cross_level_consistency_recomputed(self):
        keys = ['Series', 'Product_Type', 'Product_Role', 'Book_Part', 'Pack_Type', 'Answer_Support',
                'Digital_Main_Book_Access', 'Digital_Practice_Book_Access', 'Additional_Resources', 'Edition']
        g = collections.defaultdict(list)
        for r in self.enh:
            g[tuple(r[k] for k in keys)].append(r)
        comps = [v for v in g.values() if len({x['Level'] for x in v}) > 1]
        stable = sum(len({x['Price_EUR'] for x in v}) == 1 for v in comps)
        self.assertEqual((len(comps), stable), (60, 54))
        self.assertEqual(self.summary['level_consistency_pct'], 90.0)

    def test_summary_mean(self):
        mean = sum(float(r['Price_EUR']) for r in self.enh) / 362
        self.assertAlmostEqual(self.summary['avg_price'], round(mean, 2))


class Analysis(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.a = json.loads((HERE / 'public_analysis.json').read_text(encoding='utf-8'))
        cls.enh = rows('public_enriched_catalogue.csv')

    def test_exception_classification(self):
        h = self.a['headline']
        self.assertEqual((h['exceptions'], h['exceptions_starter'], h['exceptions_misfiled']), (6, 4, 2))
        self.assertEqual((h['consistent_after_series_repair'], h['comparables_after_series_repair']), (56, 60))

    def test_series_repair_recomputed(self):
        series = sorted({r['Series'] for r in self.enh}, key=len, reverse=True)
        fixed = lambda r: next(s for s in series if r['Title'].startswith(s + ' '))
        keys = ['Product_Type', 'Book_Part', 'Pack_Type', 'Answer_Support', 'Additional_Resources', 'Edition',
                'Digital_Main_Book_Access', 'Digital_Practice_Book_Access']
        g = collections.defaultdict(list)
        for r in self.enh:
            g[(fixed(r),) + tuple(r[k] for k in keys)].append(r)
        comps = [v for v in g.values() if len({x['Level'] for x in v}) > 1]
        self.assertEqual(sum(len({x['Price_EUR'] for x in v}) == 1 for v in comps), 56)

    def test_split_volume_premium(self):
        by = {r['Title']: float(r['Price_EUR']) for r in self.enh}
        for s, lvl in (('Little Lanterns', 'Level 1'), ('Wildflower Words', 'Level 4')):
            full = by[f'{s} {lvl} Pupil Book Complete']
            parts = by[f'{s} {lvl} Pupil Book Part A'] + by[f'{s} {lvl} Pupil Book Part B']
            self.assertGreater(parts, full)
        self.assertEqual([x['premium_eur'] for x in self.a['traps']['split_volumes']], [7.51, 6.47])

    def test_traps_have_evidence(self):
        t = self.a['traps']
        self.assertEqual([m['row_id'] for m in t['series_mismatch']], [20, 155])
        self.assertEqual(len(t['ebook_substring']['naive_hits']), 1)
        self.assertEqual(len(t['ebook_substring']['word_boundary_hits']), 0)
        self.assertEqual(t['edition_alias']['labels'], ['2nd Edition', 'Second Edition'])
        self.assertEqual([r['row_id'] for r in t['segment_drift']], [61])
        self.assertEqual([o['row_id'] for o in t['tb_outlier']['outliers_above_fence']], [361])
        self.assertEqual((t['access_duration']['stated_18_months'], t['access_duration']['digital_workbooks']), (6, 72))
        self.assertEqual((t['answer_support']['pairs'], t['answer_support']['parity']), (24, 24))
        self.assertEqual(t['pack_wording'], {'+ Online Access': 6, 'with Digital': 24})

    def test_parser_abstains_instead_of_guessing(self):
        miss = self.a['parser']['robust']['Product_Type']['mismatches']
        self.assertTrue(all(m['predicted'] == 'UNRESOLVED' for m in miss))
        naive = self.a['parser']['naive']['Digital_Main_Book_Access']['mismatches']
        self.assertEqual([m['row_id'] for m in naive], [362])

    def test_explorer_covers_every_row_once(self):
        ids = [c['row_id'] for s in self.a['explorer'] for line in s['lines']
               for cells in line['cells'].values() for c in cells]
        self.assertEqual(sorted(ids), list(range(1, 363)))

    def test_histogram_totals(self):
        self.assertEqual(sum(b['count'] for b in self.a['histogram']), 362)


class MetricContract(unittest.TestCase):
    """The figures every public surface repeats (web, decks, Excel, four videos), recomputed from the CSV alone."""
    KEYS = ['Product_Type', 'Product_Role', 'Book_Part', 'Pack_Type', 'Answer_Support', 'Digital_Main_Book_Access',
            'Digital_Practice_Book_Access', 'Additional_Resources', 'Edition']

    @classmethod
    def setUpClass(cls):
        cls.enh = rows('public_enriched_catalogue.csv')
        cls.h = json.loads((HERE / 'public_analysis.json').read_text(encoding='utf-8'))['headline']
        series = sorted({r['Series'] for r in cls.enh}, key=len, reverse=True)
        cls.title_series = staticmethod(lambda r: next(s for s in series if r['Title'].startswith(s + ' ')))

    def groups(self, series_of):
        g = collections.defaultdict(list)
        for r in self.enh:
            g[(series_of(r),) + tuple(r[k] for k in self.KEYS)].append(r)
        return g

    def test_denominator_is_the_same_before_and_after_reclassification(self):
        for series_of, stable, label in ((lambda r: r['Series'], 54, 'as recorded'), (self.title_series, 56, 'reporting')):
            g = self.groups(series_of)
            comps = [v for v in g.values() if len({x['Level'] for x in v}) > 1]
            self.assertEqual((len(g), len(comps)), (68, 60), label)
            self.assertEqual(sum(len({x['Price_EUR'] for x in v}) == 1 for v in comps), stable, label)
        self.assertEqual((self.h['groups_total_after_series_repair'], self.h['comparables_after_series_repair']), (68, 60))

    def test_misfiled_rows_create_duplicate_levels_only_as_recorded(self):
        def dups(series_of):
            g = self.groups(series_of)
            return sum(len(v) != len({x['Level'] for x in v}) for v in g.values() if len({x['Level'] for x in v}) > 1)
        self.assertEqual((dups(lambda r: r['Series']), dups(self.title_series)), (2, 0))
        self.assertEqual((self.h['groups_with_duplicate_level'], self.h['groups_with_duplicate_level_after_series_repair']), (2, 0))

    def test_only_two_rows_change_series_and_they_are_the_misfiled_ones(self):
        moved = [i for i, r in enumerate(self.enh, 1) if self.title_series(r) != r['Series']]
        self.assertEqual(moved, [20, 155])

    def test_split_premium_is_strict_on_ten_levels_and_indicative_on_two(self):
        by = collections.defaultdict(dict)
        for r in self.enh:
            if r['Book_Part']:
                by[(r['Series'], r['Level'])][r['Book_Part']] = r
        strict = mixed = 0
        for parts in by.values():
            full, a, b = (float(parts[k]['Price_EUR']) for k in ('Full', 'A', 'B'))
            self.assertAlmostEqual((a + b - full) / full * 100, 13.85, delta=0.1)
            if len({parts[k]['Edition'] for k in parts}) == 1:
                strict += 1
            else:
                mixed += 1
        self.assertEqual((strict, mixed), (10, 2))
        self.assertEqual((self.h['split_levels'], self.h['split_levels_strict'], self.h['split_levels_edition_mixed']), (12, 10, 2))

    def test_gleebook_is_a_substring_trap_and_tb_stays_unresolved(self):
        naive = [r['Title'] for r in self.enh if 'ebook' in r['Title'].lower()]
        bounded = [r['Title'] for r in self.enh if re.search(r'e-?book', r['Title'], re.I)]
        self.assertEqual((len(naive), len(bounded)), (1, 0))
        self.assertIn('Gleebook', naive[0])
        tb = [r for r in self.enh if r['Product_Type'] == 'TB']
        self.assertEqual((len(tb), tb[0]['Product_Role'], tb[0]['Price_EUR']), (1, '', '108.49'))


if __name__ == '__main__':
    unittest.main()
