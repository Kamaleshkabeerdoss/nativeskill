# Task

Audit the Northwind catalogs in `locales/`. English is the source. The other files are Tamil, Arabic, Japanese, Simplified Chinese, German, Malay, and Hindi.

Find wording that a native speaker would reject: the wrong action (especially a billing Cancel translated as a dialog cancel or "abort"), mixed formality, wrong or extra plural categories, unnatural or machine-translated phrasing, English left untranslated, Indonesian copied into Malay, and broken placeholders.

Do not read `answer-key.json`.

Write `outputs/<which>/findings.json` as a list of objects `{id, file, key, problem, replacement}` where replacement is the corrected string or null if you only flag it. Also write `NOTES.md` with anything you changed your mind about.

You may edit copies of the locale files under `outputs/<which>/locales/` if you apply fixes. The originals stay put.
