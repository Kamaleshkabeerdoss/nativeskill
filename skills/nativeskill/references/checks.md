# Checks

Both scripts live in the skill folder and use only Node. They do not install packages.

```sh
node <skill-dir>/scripts/check.mjs --source app_en.arb --target app_ar.arb --locale ar --source-locale en
node <skill-dir>/scripts/scan.mjs lib app/src
node <skill-dir>/scripts/lookup.mjs ta auth.sign_out button
```

`check.mjs` exits 0 when there are no errors, 1 when there are errors, and 2 when the arguments are wrong. Add `--json` for a machine-readable report. `--format` is `auto`, `json`, `android`, `strings`, or `xcstrings`. `auto` treats `.xml` as Android, `.strings` as iOS strings, `.xcstrings` as a string catalog, `.ts` and `.js` as a simple `export` object of strings, and everything else as JSON or ARB.

`.ts` and `.js` catalogs that spread another object, call a function, or compute a key are not read here. Those need `nativeskill validate` after `npm install`, because that command uses the TypeScript parser. `nativeskill check` itself does not import TypeScript.

Android `translatable="false"` strings are skipped. An exact plural category (Arabic `one` is only 1; French `one` is 0 and 1) may omit the number. A string catalog with source strings and no target locale fails with `missing-key`.

Pass the same `.xcstrings` path as `--source` and `--target`. `--source-locale` and `--locale` pick the columns.

## What the catalog check flags

| Code | Severity | Meaning |
| --- | --- | --- |
| `missing-key` | error | The source has a message the target does not. |
| `extra-key` | warning | The target has a key the source does not. |
| `empty-message` | error | The translation is blank. |
| `value-type-mismatch` | error | One side is a plural and the other is a single string. |
| `placeholder-mismatch` | error | A named or printf placeholder was added, removed, or retyped. |
| `placeholder-order` | error | Unnumbered `%@` / `%d` placeholders swapped. Keep the order, or number them `%1$@` and `%2$d`. A numbered swap that keeps each argument's type is allowed. |
| `selector-mismatch` | error | An ICU `select` branch was renamed or removed. |
| `exact-choice-missing` | error | An exact plural such as `=0` was added or removed. |
| `markup-mismatch` | error | Rich-text tags changed. |
| `icu-syntax` | error | A brace, a plural, or a placeholder is not closed, or a plural has no `other`. |
| `plural-missing` | error | A plural is missing a CLDR category for this locale. |
| `plural-unused` | warning | A plural has a category this locale does not use. |
| `possible-source-copy` | warning | The text equals the source and the language changed. Keep it only for a brand or a shared glossary term. |
| `length-blowup` | warning | The translation is more than three times the source and at least 12 characters longer. Check the control. |

Plural categories come from `Intl.PluralRules` for the target locale. Exact choices such as `=0` are allowed on top of the categories. Android `<plurals>` quantities and i18next `_one` / `_other` suffixes (or a nested `one` / `other` object) are checked the same way.

ARB metadata keys that start with `@` are ignored. iOS `.strings` comments are ignored.

## What the scanner flags

`scan.mjs` looks in Dart, Kotlin, Java, Swift, TSX, JSX, XML, and Vue for string literals in `Text(...)`, `setText(...)`, `title` / `label` / `hint` / `placeholder`, and `android:text` / `android:hint` / `android:contentDescription`. It skips `@string/` references, URLs, hex colors, and tokens with no spaces. It exits 1 when it finds any. Catalog files are not source code. A hit is a candidate, not proof. Confirm it is user-facing before you extract it.

## Fixtures

From `skills/nativeskill`:

```sh
node scripts/check.mjs --source examples/flutter/lib/l10n/app_en.arb --target examples/flutter/lib/l10n/app_ms.arb --locale ms --source-locale en
node scripts/check.mjs --source examples/android/res/values/strings.xml --target examples/android/res/values-ta/strings.xml --locale ta --format android
node scripts/check.mjs --source examples/buggy/app_en.arb --target examples/buggy/app_ar.arb --locale ar --source-locale en
node scripts/scan.mjs examples/flutter/lib/main.dart examples/android/res/layout
```

The first two exit 0. The buggy catalog and the scanner exit 1 and name the seeded problems. `node --test scripts/check.test.mjs` locks that behavior.
