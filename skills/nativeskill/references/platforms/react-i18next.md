# react-i18next and web JSON

Use this when the app calls `useTranslation`, creates an i18next instance, or stores `locales/<lng>/<namespace>.json`.

## Find the setup

Look at the `i18n` init for `supportedLngs`, `fallbackLng`, `ns`, and `interpolation`. Note whether plurals are suffix keys (`item_one`, `item_other`) or ICU (`{count, plural, ...}`), which usually means the `i18next-icu` plugin. Write the new file in that style.

## Add a locale

1. Copy each source namespace JSON to the new language folder. Keep the key tree. Translate values.
2. Placeholders are `{{name}}`. An unescaped value is `{{- name}}`. Do not rewrite either as `{name}`.
3. Add the language to `supportedLngs`. If the detector only allows listed languages, a file on disk will never load.
4. Set `interpolation.escapeValue` the way the app already does. React already escapes. Turning it off without a reason, or on inside React, creates double-escaped or raw HTML bugs. Do not change it as part of adding a language.
5. For suffix plurals, emit every CLDR category that locale needs: Arabic gets `item_zero`, `item_one`, `item_two`, `item_few`, `item_many`, and `item_other`. Malay gets `item_other` only.

```sh
node <skill-dir>/scripts/check.mjs \
  --source locales/en/common.json \
  --target locales/ms/common.json \
  --locale ms --source-locale en
```

## Layout

On the document element, set `lang` and `dir`. i18next's `dir()` returns `rtl` for Arabic and Hebrew. Use logical CSS (`margin-inline-start`, `text-align: start`). See [rtl.md](../rtl.md).

Format dates and numbers with `Intl.DateTimeFormat` and `Intl.NumberFormat` using the same language tag. Do not put `$` or `MM/DD` into the JSON.

Nested JSON is flattened with dots for the check (`auth.signOut`). Keys that start with `@` are ignored, so an ARB file in a web repo still works.
