# Data dictionary and reproduction

All records, series names and EUR list prices are **invented** by `generate_independent_dataset.py` (seed `20261011`). The script reads no input files. The data contains no sales, units, costs, margins, discounts or demand, and says nothing about any real market.

## Reproduce

```bash
python generate_independent_dataset.py   # public_raw_catalogue.csv, public_enriched_catalogue.csv, public_summary.json, public_findings.json
python analyze_catalogue.py              # public_analysis.json
python -m unittest discover -s tests -v  # 16 tests; re-runs both scripts and checks the bytes don't change
```

Outputs use LF line endings on every OS, so SHA-256 hashes match across Windows, macOS and Linux.

## Raw file — 5 columns (`public_raw_catalogue.csv`)

| Column | Meaning |
|---|---|
| `Series` | Series as recorded. Can be wrong (2 rows contradict their own title). |
| `Segment` | Audience: Adult, Teen, Primary. |
| `Sub-Segment` | Finer level. Contains one hierarchy error. |
| `Title` | Product title; attributes are expressed unevenly. |
| `Price_EUR` | Fictional list price. Never a transaction price. |

## Enriched file — 19 columns (`public_enriched_catalogue.csv`)

The five above plus `Edition`, `Level`, `Level_System` (CEFR or Grades), `Product_Type`, `Product_Role`, `Book_Part` (Full / A / B), `Pack_Type`, `Answer_Support`, `Digital_Main_Book_Access`, `Digital_Practice_Book_Access`, `Audio_Access`, `App_Access`, `Additional_Resources`, `Access_Duration`. `Price_EUR` stays last.

**A blank cell means "not stated", never "no".** `Product_Role` follows `Product_Type`; it is blank for `TB` on purpose because the abbreviation is unresolved.

The enriched file is the generator's *reference labelling*. It is not the output of a parser. `analyze_catalogue.py` runs a separate rule-based parser over the raw titles and reports its agreement with these labels field by field, so predictions and reference stay distinguishable.

## Comparable groups

Rows that share `Series, Product_Type, Product_Role, Book_Part, Pack_Type, Answer_Support, Digital_Main_Book_Access, Digital_Practice_Book_Access, Additional_Resources, Edition` form a group. A group is *comparable* when it spans two or more levels, and *stable* when all of its prices are equal.

| Result | Value |
|---|---:|
| Groups | 68 (8 single-level) |
| Comparable groups | 60 |
| Stable as recorded | 54 (90.0 %) |
| Exceptions | 6 = 4 Starter pricing + 2 misfiled records |
| Stable after re-filing the 2 records by title prefix (reporting view) | 56 (93.3 %) |
| With / without key pairs at price parity | 24 of 24 |
| Part A + B premium over the complete book | +13.8 % / +13.9 % |

## Planted data-quality issues

1. Series field contradicts the title prefix (rows 20, 155).
2. Edition aliases: `Second Edition` / `2nd Edition`.
3. `Gleebook`: a printed resource whose name contains the substring "ebook".
4. Pack wording: `Study Pack + Online Access` vs `Study Pack with Digital`.
5. A Primary product with a Secondary sub-segment (row 61).
6. `TB`: ambiguous abbreviation, the only price above the upper IQR fence.
7. Access duration stated for 6 of 72 digital workbooks.
8. Part A + Part B cost more than the complete volume.
9. Starter level priced lower in two series.
10. With-key / without-key workbook pairs at the same price.
