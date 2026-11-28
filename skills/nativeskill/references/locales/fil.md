# Filipino (`fil`, also `tl`)

Latin script, left to right. Cardinal plurals are `one` and `other`. `fil` is the standard tag; Android and some catalogs use `tl`. Pick one per project. Product UI in the Philippines commonly keeps English tech terms (`account`, `file`, `upload`, `email`) inside Filipino grammar; that is normal, not a defect.

## Who the string talks to

Use `ka` / `mo` / `iyong` for "you", or no pronoun. Formal `po` / `ninyo` belongs in support and banking flows; do not mix it with informal `ka` in one product. Buttons are verbs, often the `i-` / `mag-` imperative: `I-save`, `Mag-upload`, `Idiskonekta`.

## Count before the noun

`{count} na mensahe`, `Mag-upload ng {count} file`. `Mga mensahe ng {count}` reads as "messages of {count}". The checker reports it as `count-noun-order`. Do not put `mga` before a counted noun (`{n} na file`, not `{n} mga file`).

## Buttons

| Control | Natural | Translated-sounding |
| --- | --- | --- |
| Cancel | Kanselahin (Flutter, attested) | Huwag ituloy (OOUI, attested, stiff for a dialog button) |
| Close | Isara (Flutter, attested) | Isa-isantabi (OOUI dismiss: "set aside") |
| Continue | Magpatuloy (Flutter, attested) | Ipagpatuloy ang proseso |
| Edit | Baguhin (VisualEditor, attested) | Gumawa ng pagbabago |

## Machine-translation tells

- Fully Tagalogised tech terms nobody uses (`base ng kaalaman` for knowledge base in a product that says `knowledge base` elsewhere). Follow the product's glossary.
- `(mga)` to copy English `(s)`. Rephrase.
- A space before `?` or after an opening quote.

## Punctuation, numbers

English-style numbers: `1,234.5`. Currency `₱` from the `fil-PH` formatter. Dates follow English order (`Marso 4, 2026`) or the formatter.

## Length

Filipino is the longest of the common Southeast Asian UI languages: median 1.27× English on a 1,100-string SaaS catalog, and a one-word English verb often becomes a three-word phrase (`Rename` → `Palitan ang pangalan`). The checker gives Filipino a 3.5× length-blowup threshold for that reason. Design buttons to wrap or grow.
