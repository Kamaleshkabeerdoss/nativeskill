# Locale tables: a SaaS chat widget and its marketing site

Anonymised from a real project, with the product renamed Acme. Version 0.3.0 could not read either file shape, so the widget, which was 63% English in five locales, could only be checked after a manual extraction.

| File | Shape |
| --- | --- |
| `widget/locales.ts` | An exported base table keyed by locale (`'en-IN'`, `'ta-IN'`, ...), unexported overlay tables, a top-level `TICKET_I18N['ar-SA'] = TICKET_I18N['ar-AE']`, and an exported `resolveStrings(language)` that spreads them together. |
| `widget/booking.ts` | An overlay imported by the resolver. |
| `marketing/extra.ts` | One unexported constant per language, gathered in `export const EXTRA: Record<Locale, ExtraDict> = { en, ja, ms }`. |
| `marketing/docs.ts` | Labels built by a local `labels()` helper from `Object.fromEntries(SLUGS.map(...))`. |
| `marketing/helper.ts` | A local `plural(n, 'file', 'files')` helper inside a template, and `['a', 'b'].join(', ')`. |

`case.test.mjs` checks that the resolver is found and evaluated per locale, that keys missing from every overlay are reported as English, that an ambiguous language (`ar`) names `--target-key`, and that the helpers are read or reported precisely.

```sh
node skills/nativeskill/scripts/check.mjs --source evals/real-world/locale-tables-2026-11/widget/locales.ts \
  --target evals/real-world/locale-tables-2026-11/widget/locales.ts --source-locale en --locale ms
```
