# Rubric

Written before the runs. Scores are 0, 1, or 2.

## A. Add Tamil, Arabic, German

- Intent split: dialog Cancel and stop-renewal are different in all three languages. End-now is not a refund promise. Pay and savings are different.
- Structure: placeholders unchanged, Arabic has six plural categories, Tamil and German have one/other, locales registered, switcher exists, RTL uses start/end or Directionality and a mirroring back icon.
- Naturalness, per language: short real UI, not a gloss. Tamil verbs not nouns-for-archive. German infinitives, one address. Arabic MSA, Arabic punctuation, تنزيل not تحميل for download.

## B. Add German beside existing locales

- Reads the existing files: Northwind untranslated, workspace translated (Arbeitsbereich or equally specific), dialog Cancel ≠ stop renewal, placeholders intact, German registered in supportedLngs.
- Tone matches the shipped catalogs: short buttons, not a paragraph.

## C. Audit

Recall = seeded bugs the findings name (same file and key) / 31.
Precision = findings that match a seeded bug / findings reported.
A finding on the right key with a wrong explanation counts as a hit only if the problem statement identifies the actual bug.
Naturalness of replacements is scored separately, 0–2, and does not change recall.

## Honesty

A fluent model can pass parts of this without the skill. Say so. Do not award the skill a point for labels the baseline was not asked to produce.
