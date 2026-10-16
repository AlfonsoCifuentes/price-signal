# Pricing Demo — by Alfonso Cifuentes (horizontal_en)

Versión del guion 3.0 · duración real 203.1 s · voz ElevenLabs (en)

## origin · Origin · 0.0–29.8 s

**Locución:** I first worked on this kind of problem during a technical assessment for a data analyst position at an international educational publishing company. The task was to examine a product catalogue, make sense of its pricing structure, and explain which findings were worth pursuing. I later rebuilt the exercise as an independent case study, with fictional titles, series and prices, so I could share the analytical process publicly.

**Pantalla:** PRICING DEMO / by Alfonso Cifuentes. Card: real technical assessment → independent case study, fictional data.

## problem · The problem · 29.8–61.2 s

**Locución:** A price list looks simple until you look closely. A single course might have a student book, a workbook, an answer-key version, a digital licence, several levels and multiple editions. Two similar names can describe different products. If you compare their prices without accounting for those differences, an apparent anomaly may tell you more about the catalogue than about the pricing. So the first question was not which product costs more, but which products can fairly be compared.

**Pantalla:** A course branches into variants. Invalid comparison struck through; valid comparison ticked.

## method · The work · 61.2–89.4 s

**Locución:** For this public version, I generated 362 fictional product records across 12 fictional series. I took five raw fields and enriched them into nineteen attributes, covering product type, level, edition, bundle content and digital access. I preserved the source and kept every correction in a separate reporting view. Then I grouped products by their actual configuration, so that only the level could change.

**Pantalla:** 5 → 19 attributes; source and reporting layers; group key with level as the only free dimension.

## exceptions · Six exceptions · 89.4–113.8 s

**Locución:** That gave me 60 comparable product groups spanning more than one level. 54 had the same price throughout. Six did not. Four involved a cheaper Starter level. That could reflect an intentional entry-level policy, but a list price cannot prove why it exists. The remaining two differences called for a different kind of investigation.

**Pantalla:** 60 cells: 54 uniform, 6 flagged. Four tagged Starter, two tagged Investigate. No reveal yet.

## finding · Root cause · 113.8–147.8 s

**Locución:** The clue was inside the groups themselves: each one listed the same level twice. In both cases, the product title named one series while the series field named another. Grouped by that field, it looked like a price difference. Checked against the product's identity, it was a filing mismatch, not a pricing decision. I reassigned those two records in the reporting view, leaving the original data untouched. With the same 60 comparable groups, the number with consistent prices rose from 54 to 56.

**Pantalla:** Glasshouse group with a duplicated B1; the Mosaic English B1 record moves home; second case Kindred Horizons → Glasshouse. 54/60 → 56/60, fixed denominator.

## limits · Limits · 147.8–183.1 s

**Locución:** The catalogue had other traps too: two spellings of the same edition, a title that contains the letters e-book but is printed, an unusually high price attached to an ambiguous product code, and books sold in two parts that cost more than the complete volume. They were prompts for investigation, not excuses to invent an explanation. There are no sales, cost, margin or demand data here, so the analysis does not recommend a price or claim a financial impact. Every figure in this demonstration is fictional.

**Pantalla:** Investigation cards: edition, Gleebook, TB, parts A + B. Then: what the data cannot tell us.

## close · Conclusion · 183.1–203.1 s

**Locución:** The lesson is simple: before making a decision about a price, make sure you know what product you are looking at. You can explore the dataset, inspect the calculations and download the case study materials on the website. I'm Alfonso Cifuentes, and this is Pricing Demo.

**Pantalla:** Comparability first. Then price. Author, URL, fictional-data and synthetic-voice note.
