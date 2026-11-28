# Checks

The checker, scanner and lookup live in the skill folder and use only Node.js.

```sh
node <skill-dir>/scripts/check.mjs --source app_en.arb --target app_ar.arb --locale ar --source-locale en
node <skill-dir>/scripts/scan.mjs lib app/src
node <skill-dir>/scripts/lookup.mjs ta auth.sign_out button
```

`check.mjs` exits 0 when there are no errors, 1 when there are errors, 2 when the arguments are wrong, and 3 when a catalog could not be read. Add `--json` for a machine-readable report. `--format` is `auto`, `json`, `android`, `strings`, `xcstrings`, or `script`. `auto` treats `.xml` as Android, `.strings` as iOS strings, `.xcstrings` as a string catalog, `.ts` / `.tsx` / `.js` / `.mjs` / `.cjs` as a TS/JS dictionary, and everything else as JSON or ARB.

TS/JS dictionaries are parsed, not executed, by `scripts/dict.mjs` (no dependencies). It reads `export const ms: Dict = {...}`, `export default`, `module.exports`, `as const`, `satisfies`, arrow and `function` values, template literals, ternaries, `if` / `switch` returns, spreads, `section: en.section` aliases and relative imports, including JSON. Parameters become `{name}` placeholders spelled as in the source. The checked text is the branch a count such as 5 takes; the other branches are kept and checked too. When a file exports several objects, pass `--source-export` / `--target-export`. A value that needs running code (a call into a package, a computed key) is reported as `dynamic-value` instead of guessed. `node scripts/dict.mjs <file> [--export name] [--branches]` prints the flat JSON the checker sees.

## Coverage summary and grouping

Text output starts with a coverage line and the sections that have gaps:

```text
Coverage ms: 1171 of 1750 keys translated (67%), 110 missing, 469 still English.
Sections with gaps:
  inbox          0/139 translated   139 English  (taken from en.inbox)  <- looks untranslated
  kbTools        0/40 translated    40 missing  <- looks untranslated
```

A section is the first key segment (`inbox.title` -> `inbox`). "Taken from" names the English section a TS dictionary reuses (`inbox: en.inbox`). A section with at least 3 keys and under 10% translated is marked as looking untranslated: report it as one finding, not per key.

When the same warning, or `missing-key`, appears more than 5 times in one section, the text output prints one line for the group. `--verbose` prints every key. `--json` always has every finding, plus `summary` with `sections`, `groups` and `buckets`.

Every finding has a `bucket`: `P1` for errors (broken or missing), `P2` for wrong meaning or English left in (`possible-source-copy`, `english-in-branch`, `english-residue`, `wrong-word`, `count-noun-order`, `source-changed`, `hand-rolled-plural`, `term-inconsistent`), `P3` for polish. The text output starts with the counts per bucket and lists P1 first. The JSON report is `schema: 2` (schema 1 had no `summary`, `suppressed` or `bucket`).

## Settings: deliberate English and optional sections

Put a `.nativeskillrc` (JSON) next to the catalogs or in any parent folder, or pass `--config <file>`. `--no-config` ignores it.

```json
{
  "allowMissing": ["apiTools", "dataTools"],
  "keepEnglish": ["Acme", "WhatsApp", "/^https?:/"],
  "ignoreKeys": ["debug.*"],
  "locales": { "ar": { "allowMissing": ["marketing"] } }
}
```

- `allowMissing`: key prefixes, globs or `/regex/` for sections that fall back to English on purpose. Their `missing-key` and English-copy findings are suppressed.
- `keepEnglish`: brands and terms that stay English. A string made only of these terms, placeholders, numbers and punctuation is not reported as a copy.
- `ignoreKeys`: keys never reported.
- The same lists can be given as flags: `--allow-missing`, `--keep-english`, `--ignore-key` (repeatable).

Suppressed findings are not dropped. The summary line counts them and `--json` lists them under `suppressed` with the setting that hid them. Do not use settings to hide a real gap; say in the report which sections are deliberately English.

Android `translatable="false"` strings are skipped. A plural category that covers exactly one number may omit it: Arabic `zero`, `one`, and `two`, or German and English `one`. French `one` is not such a category, because it covers both 0 and 1. A French `one` without the number is an Android `placeholder-mismatch` and an ICU `plural-number-missing` warning. A string catalog with source strings and no target locale fails with `missing-key`.

Pass the same `.xcstrings` path as `--source` and `--target`. `--source-locale` and `--locale` pick the columns.

## What the catalog check flags

| Code | Severity | Meaning |
| --- | --- | --- |
| `missing-key` | error | The source has a message the target does not. |
| `extra-key` | warning | The target has a key the source does not. |
| `empty-message` | error | The translation is blank. |
| `value-type-mismatch` | error | One side is a plural and the other is a single string. |
| `placeholder-mismatch` | error | A named or printf placeholder was added, removed, or retyped. A numbered `%1$s` that becomes `%1$d` is reported as a type change. |
| `placeholder-order` | error | Unnumbered `%@` / `%d` placeholders swapped. Keep the order, or number them `%1$@` and `%2$d`. A numbered swap that keeps each argument's type is allowed. |
| `selector-mismatch` | error | An ICU `select` branch was renamed or removed. |
| `exact-choice-missing` | error | An exact plural such as `=0` was added or removed. |
| `markup-mismatch` | error | Rich-text tags changed. |
| `icu-syntax` | error | A brace, a plural, or a placeholder is not closed, or a plural has no `other`. |
| `plural-missing` | error | A plural is missing a CLDR category for this locale. |
| `plural-unused` | warning | A plural has a category this locale does not use. |
| `possible-source-copy` | warning | The text equals the source and the language changed. Keep it only for a brand or a shared glossary term. |
| `plural-number-missing` | warning | An ICU plural branch has no `#` (or `{count}`) although the source shows the number, and that category covers more than one number in this locale. French `one {un fichier}` also shows for 0. |
| `length-blowup` | warning | The translation is more than three times the source (3.5 for Filipino, whose short verbs become phrases: `Rename` → `Palitan ang pangalan`) and at least 12 characters longer, counted in graphemes. Check the control. On a real 1,100-string catalog this fired for 5 of about 10,000 strings across nine locales. |
| `placeholder-repeat-dropped` | warning | Every placeholder is kept but one the source repeats appears fewer times. Often correct (the second mention becomes a pronoun); check nothing is lost. Dropping a placeholder entirely is still `placeholder-mismatch`. |
| `dynamic-value` | warning | A TS/JS dictionary value could not be resolved without running code. Check it by hand. |
| `placeholder-spacing` | warning | A space the source does not have: after an opening quote (`" {name}`), before a closing quote, before `? ! . , : ;` (French is exempt), or inside brackets. A machine-translation tell. |
| `invisible-character` | warning | U+200B, U+2060 or U+FEFF that the source does not have. Thai, Lao, Khmer, Burmese and Tibetan may use U+200B; ZWJ/ZWNJ are only flagged in all-Latin text without emoji. |
| `english-residue` | warning | An English plural marker such as `(s)` or `{noun}s` in a translation, or a run of English words with at least two function words (`the`, `of`, `your`) inside non-Latin text. |
| `count-noun-order` | warning | The source counts a plural noun (`{count} files`) and the translation puts the count after the noun (`Fail {count}`, `Tin nhắn {count}`, `رسائل {count}`), which reads as a label or an ID. Checked for ms, id, vi, fil, ar. For Thai the count needs a classifier after it (`ไฟล์ {count} ไฟล์`). |
| `english-in-branch` | warning | A TS/JS function returns the translation for one input and English for another (`n ? 'Import {n}' : 'Import'`). |
| `hand-rolled-plural` | warning | The source picks a form with `n === 1 ? … : …` and the target locale has more than two plural forms (Arabic, Russian, Polish…), while the translation has fewer forms than the locale needs. Use ICU or `Intl.PluralRules`. |
| `source-changed` | warning | With `--old-source <previous English>`: the English changed after this was translated and the translation was not updated. |
| `term-inconsistent` | warning | With `--glossary <file>`: the translation does not use the glossary term for this locale, or uses a rejected one. |
| `wrong-word` | warning | A known wrong sense from the audit checklist in [assets/audit-patterns.json](../assets/audit-patterns.json): the dialog Cancel word on a renewal, Arabic `تحميل` for download, Tamil `மீண்டும்` for Back, sales "lead" as the metal, and others. The message ends with the pattern id and a suggestion; suggestions marked draft are not attested. `--no-audit` turns these off. |

### Stale strings and glossary

`--old-source` takes the English catalog the translations were made from (a git copy such as `git show HEAD~20:src/en.ts > /tmp/en.old.ts`, or the last release). Every key whose English changed since then and whose translation was not touched is reported as `source-changed`. `oldSource` in `.nativeskillrc` does the same.

`--glossary` (or `glossary` in `.nativeskillrc`) is JSON with one entry per concept:

```json
{
  "lead": { "source": "\\bleads?\\b", "ms": "prospek", "id": "prospek", "avoid": { "ms": ["petunjuk"], "id": ["petunjuk"] } }
}
```

`source` is a case-insensitive regex for the English; each locale value is the required term (a string, a list of accepted terms, or `/regex/`); `avoid` lists rejected terms. Use it so one concept has one name across the product.

Plural categories come from `Intl.PluralRules` for the target locale. Exact choices such as `=0` are allowed on top of the categories. Android `<plurals>` quantities and i18next `_one` / `_other` suffixes (or a nested `one` / `other` object) are checked the same way.

ARB metadata keys that start with `@` are ignored. iOS `.strings` comments are ignored.

## What the scanner flags

`scan.mjs` looks in Dart, Kotlin, Java, Swift, TS, TSX, JS, JSX, XML, and Vue for string literals in `Text(...)`, `setText(...)`, `title` / `label` / `hint` / `placeholder`, and `android:text` / `android:hint` / `android:contentDescription`. It skips `@string/` references, URLs, hex colors, and tokens with no spaces. It also reports hand-rolled English plurals (`count === 1 ? '' : 's'`, `n > 1 ? 'items' : 'item'`) as `hand-rolled-plural`, in code and in dictionaries. It exits 1 when it finds any. Catalog files are not source code: a `.ts` / `.js` file that is itself a locale dictionary is skipped for literals. A hit is a candidate, not proof. Confirm it is user-facing before you extract it.

## Fixtures

From `skills/nativeskill`:

```sh
node scripts/check.mjs --source examples/flutter/lib/l10n/app_en.arb --target examples/flutter/lib/l10n/app_ms.arb --locale ms --source-locale en
node scripts/check.mjs --source examples/android/res/values/strings.xml --target examples/android/res/values-ta/strings.xml --locale ta --format android
node scripts/check.mjs --source examples/buggy/app_en.arb --target examples/buggy/app_ar.arb --locale ar --source-locale en
node scripts/scan.mjs examples/flutter/lib/main.dart examples/android/res/layout
```

The first two exit 0. The buggy catalog and the scanner exit 1 and name the seeded problems. `node --test scripts/check.test.mjs` locks that behavior.
