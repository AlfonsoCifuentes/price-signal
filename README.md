# Pricing Demo — by Alfonso Cifuentes

**A publishing-pricing analytics case study: are the prices different, or are the products different?**

This project grew out of a technical assessment I completed during a recruitment process for a data analyst role at an international educational publisher. The task was to structure a product catalogue, compare genuinely equivalent items and explain which price differences deserved investigation. I rebuilt the case independently with entirely fictional titles, series and prices so the approach can be shared publicly.

> All series, titles, products and EUR list prices are invented by a seeded script. No employer catalogue, data, files or screenshots are included. This is not paid or client work and has no connection with any publisher or employer.

## Live

- English: https://pricingdemo-alfonsocifuentes.vercel.app/
- Español: https://pricingdemo-alfonsocifuentes.vercel.app/es

The site lives in `03_WEBSITE/` (the root `vercel.json` points the Vercel build at it). Videos, decks, the Excel workbook and the data are downloadable from the page.

## The finding

Products were grouped only with products identical apart from the level: 68 groups, 60 spanning two or more levels. **54 of 60** keep one price at every level. Of the six exceptions, four are a cheaper Starter level, a plausible but unproven pricing choice. The other two aren't pricing at all: each group contains a record from another series, filed under the wrong name. Re-filed by title prefix in a reporting view, with the source untouched, the result is **56 of 60**. The denominator was recomputed after re-filing and is still 60.

Also in the data: buying a book as Part A + Part B costs about 14% more than the complete volume (a strict match at 10 of 12 levels, indicative at 2 where edition labels differ); with-key and without-key workbooks are at price parity in 24 of 24 matched pairs; one unresolved "TB" product at €108.49 is the only price above the upper IQR fence.

## What's in the repository

| Folder | Contents |
|---|---|
| `02_PUBLIC_CASE_STUDY/` | Seeded generator, analysis script, 21 unit tests, raw (5 col) and enriched (19 col) CSVs, analysis JSON, data dictionary |
| `03_WEBSITE/` | Static bilingual case-study site (HTML/CSS/JS, no dependencies), deploy config, data-sync tool |
| `04_VIDEO_PRODUCTION/` | Scripts for four videos (EN/ES, 16:9 and 9:16), narration pipeline (ElevenLabs, cached by hash), timeline builder, subtitles, Remotion project, mastering and QC tools |
| `05_PRESENTATIONS/` | EN/ES decks (PPTX + PDF), Excel workbook with live formulas, and the scripts that build them |
| `07_OPERATIONS_AND_QA/qa_site.py` | Browser QA: first-screen test, metadata, overflow at 6 widths, keyboard, videos, reduced motion, no-JS, axe-core |

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

# videos: see 04_VIDEO_PRODUCTION/remotion/README.md (narration needs your own ElevenLabs key in EL_KEY
# and voice IDs in narration/config.json, copied from config.example.json)

# browser QA (pip install playwright && python -m playwright install chromium; npm install in 07_OPERATIONS_AND_QA)
cd ../07_OPERATIONS_AND_QA && npm install && python qa_site.py
```

The headline figures are computed three independent ways: the analysis script, the unit tests (separate, simpler code) and Excel formulas. All three agree.

## Method in four steps

1. **Keep the source.** The raw file is never edited; corrections live in a reversible reporting view.
2. **Recover the structure.** A rule-based parser reads titles only and abstains on two product types rather than guessing. The rules were written for these synthetic titles, so its score checks the rules, not accuracy on real data.
3. **Compare like with like.** Ten attributes are held constant; only the level may change.
4. **Separate fact from guess.** Exceptions are classified as data issues, plausible pricing decisions or open questions, and left in the data. List prices alone can't establish demand, margin or an optimal price.

## Licence

Code: MIT (see `LICENSE`). Synthetic data and text: CC BY 4.0. Fonts: SIL Open Font License 1.1 (licences in `03_WEBSITE/public/fonts/`). The narration voices (ElevenLabs) and the music are not covered by these licences.

Made by Alfonso Cifuentes · https://alfonsocifuentes.vercel.app/
