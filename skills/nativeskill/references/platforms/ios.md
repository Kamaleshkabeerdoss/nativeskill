# iOS

Use this when the project has `Localizable.xcstrings`, `Localizable.strings`, or a `knownRegions` list in the Xcode project.

## Pick the file the app already uses

- A `.xcstrings` string catalog is one file with a column per locale. Add the locale inside that file. Do not also create a parallel `.strings` file for the same keys.
- Older projects use `Localizable.strings` per `.lproj`, and `Localizable.stringsdict` for plurals. Add `<locale>.lproj` beside the existing ones.

## Register the locale

The new language has to be a project localization, not only a file on disk.

- In the Xcode project, add the locale so `knownRegions` in `project.pbxproj` includes it (`ta`, `ms`, `ar`, `hi`, `zh-Hans`, `zh-Hant`).
- `Info.plist` `CFBundleLocalizations` lists the same locales when the app declares them there. `CFBundleDevelopmentRegion` stays the source language.
- String catalog keys stay stable. Translate `stringUnit.value`. For plurals, fill `variations.plural` with the CLDR categories for that locale.

## Check

`.strings` is `"key" = "value";`. Placeholders look like `%@`, `%d`, `%1$@`, `%ld`. They stay byte-exact.

```sh
node <skill-dir>/scripts/check.mjs \
  --source en.lproj/Localizable.strings \
  --target ms.lproj/Localizable.strings \
  --locale ms --format strings

node <skill-dir>/scripts/check.mjs \
  --source Localizable.xcstrings \
  --target Localizable.xcstrings \
  --locale ms --source-locale en --format xcstrings
```

## Layout

Use leading and trailing constraints, not left and right. SwiftUI follows the locale's `layoutDirection` when the locale is actually applied. A back chevron is directional and mirrors. A media play icon does not. Numbers, emails, and product names inside Arabic need isolation. See [rtl.md](../rtl.md).

Format dates and currency with `Date.FormatStyle` and `Decimal.FormatStyle` (or `DateFormatter` / `NumberFormatter`) using the locale. Do not assemble them with `+`.

`examples/ios` has a `.strings` pair and a `.xcstrings` catalog that pass the check.
