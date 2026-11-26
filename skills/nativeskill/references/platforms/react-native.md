# React Native

Use this when the app is React Native or Expo and also has a JS catalog. The strings follow [react-i18next.md](react-i18next.md) or the JSON shape the app already uses. This note is only the native part.

## Locale and direction

- `expo-localization` or `react-native-localize` supplies the device language. The catalog still needs an explicit list of languages the app ships, or the device language falls through to English.
- Adding Arabic or Hebrew means `I18nManager.allowRTL(true)` and, when that locale is active, `I18nManager.forceRTL(true)`. Changing forceRTL does not apply until the app reloads. Say that in the report if you change it.
- Mirror directional icons (back, forward, next). Do not mirror play, pause, checkmarks, or logos.
- Prefer `start`/`end` padding and flex `row` with the writing direction over hardcoded `left`/`right`.

## Strings

Do not call `I18n.t('Hello ' + name)`. Pass `{{name}}` or the library's equivalent. Plurals use the library's plural API, with the CLDR categories for the language, not a JavaScript ternary on `count === 1`.

Run `check.mjs` on the JSON files and `scan.mjs` on screens for `Text('...')` literals. A `Text` whose child is a translation call is fine.

If the same product also has Flutter, iOS, or Android catalogs, translate each catalog. Do not assume one JSON file feeds the native apps.
