# PRICE / SIGNAL

**Before you compare prices, compare products.**

An independent data analytics case study on a fictional textbook catalogue: 362 invented products, 12 invented series, ten planted data-quality problems, and a method for comparing prices only between equivalent products.

> All series, titles, products and EUR list prices are invented by a seeded script. Nothing here describes a real company, product or market, and the project has no connection with any publisher or employer.

## Live

- English: https://pricingdemo-alfonsocifuentes.vercel.app/
- Español: https://pricingdemo-alfonsocifuentes.vercel.app/es/

The site lives in `03_WEBSITE/` (the root `vercel.json` points the Vercel build at it). Films, decks, CV and cover letter are downloadable from the page.

## The finding

Matched like for like, **54 of 60** comparable groups hold one price at every level. Of the six exceptions, four are cheaper Starter levels, a plausible pricing choice. The other two aren't pricing at all: each group contains a record from another series, filed under the wrong name. Re-filed by title prefix in a reporting view, with the source untouched, the result is **56 of 60**.

Also in the data: buying a book as Part A + Part B costs about 14 % more than the complete volume; with-key and without-key workbooks are at price parity in 24 of 24 matched pairs; one "TB" pack at €108.49 is the only price above the upper IQR fence.

## What's in the repository

| Folder | Contents |
|---|---|
| `02_PUBLIC_CASE_STUDY/` | Seeded generator, analysis script, 16 unit tests, raw (5 col) and enriched (19 col) CSVs, analysis JSON, data dictionary |
| `03_WEBSITE/` | Static case-study site (HTML/CSS/JS, no dependencies), deploy config, data-sync tools |
| `04_VIDEO_PRODUCTION/` | Remotion project for the 2:36 film and 0:45 vertical cut, voice-ready timeline, captions |
| `05_PRESENTATIONS/` | EN/ES decks (PPTX + PDF), Excel workbook with live formulas, and the scripts that build them |
| `07_OPERATIONS_AND_QA/qa_site.py` | Browser QA: overflow at 6 widths, keyboard, video, reduced motion, no-JS, axe-core |

## Reproduce

```bash
# data + analysis + tests (Python 3.10+, standard library only)
cd 02_PUBLIC_CASE_STUDY
python generate_independent_dataset.py && python analyze_catalogue.py
python -m unittest discover -s tests -v

# website
cd ../03_WEBSITE && python tools/sync_site_data.py --check && python -m http.server 8000

# workbook (openpyxl; Excel on Windows for recalculation and verification)
cd ../05_PRESENTATIONS && python build_workbook.py && python recalc_and_verify_workbook.py

# decks (Node + pptxgenjs; PowerPoint on Windows for PDF export)
npm install && node build_public_deck.js && python export_decks_pdf.py

# film (Node + Remotion)
cd ../04_VIDEO_PRODUCTION/remotion && npm install && npm run render:all

# browser QA (pip install playwright && python -m playwright install chromium; npm install in 07_OPERATIONS_AND_QA)
cd ../../07_OPERATIONS_AND_QA && npm install && python qa_site.py
```

The headline figures are computed three independent ways: the analysis script, the unit tests (separate, simpler code) and Excel formulas (`SUMPRODUCT/COUNTIFS` distinct counts, `LOOKUP` on title prefixes). All three agree.

## Method in four steps

1. **Keep the source.** The raw file is never edited; corrections live in a reversible reporting view.
2. **Recover the structure.** A rule-based parser reads titles only, matches the reference labels on level, pack, answer key, book part, audio and digital access for all 362 rows, and abstains on two product types rather than guessing. The rules were written for these titles, so that checks the rules, not accuracy on real data.
3. **Compare like with like.** Ten attributes are held constant; only the level may change.
4. **Separate fact from guess.** Exceptions are classified, explained and left in the data. List prices alone can't establish demand, margin or an optimal price.

## Licence

Code: MIT (see `LICENSE`). Synthetic data, text and media: CC BY 4.0. Fonts: SIL Open Font License 1.1 (licences in `03_WEBSITE/public/fonts/`).

Made by Alfonso Cifuentes.
