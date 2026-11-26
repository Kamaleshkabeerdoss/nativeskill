# Flutter

Use this when the app has `l10n.yaml`, ARB files, or `flutter gen-l10n`.

## Find the setup

- `l10n.yaml` names `arb-dir` and `template-arb-file`. The template is the source catalog. Its `@@locale` is the source locale.
- `pubspec.yaml` should set `flutter: generate: true` and depend on `flutter_localizations` and `intl`.
- Generated delegates usually appear as `AppLocalizations.localizationsDelegates` and `AppLocalizations.supportedLocales`.

## Add a locale

1. Copy the template ARB to `app_<locale>.arb` in the same directory. Set `@@locale` to the language or the full tag the app uses (`ms`, `ta`, `ar`, `zh_Hans`).
2. Translate the messages. Keep `{amount}` and `{count, plural, ...}` intact. The `@key` placeholder metadata in the template describes types. Repeat it on the target only if this project already copies metadata into every ARB. Do not invent a second placeholder name.
3. Malay, Indonesian, Japanese, and Chinese need only the `other` plural branch. Arabic needs `zero`, `one`, `two`, `few`, `many`, and `other`. Tamil, Hindi, German, and Spanish need `one` and `other`.
4. On `MaterialApp` or `CupertinoApp`, keep:

```dart
localizationsDelegates: AppLocalizations.localizationsDelegates,
supportedLocales: AppLocalizations.supportedLocales,
```

`supportedLocales` is generated from the ARB files. A hand-written `supportedLocales: [Locale('en')]` that ignores the generated list will hide the new language. Add `Locale('ta')` or `Locale('ms', 'MY')` only when the app lists locales itself.

5. Run `flutter gen-l10n`, then the skill check:

```sh
node <skill-dir>/scripts/check.mjs \
  --source lib/l10n/app_en.arb \
  --target lib/l10n/app_ms.arb \
  --locale ms --source-locale en
```

6. Call `AppLocalizations.of(context).signOut` from widgets. Do not leave `Text('Cancel subscription')` in the tree. `scripts/scan.mjs` finds those literals.

## Do not

- Do not concatenate `count.toString()` with a noun. Use the plural message.
- Do not set a Latin-only `fontFamily` on the app theme when the new locale is Tamil, Arabic, Hindi, or Chinese. The platform font already covers the script.
- Do not set `TextDirection.rtl` on one widget and leave the rest LTR. For Arabic, set the locale and let `Directionality` follow it. See [rtl.md](../rtl.md).
- Format dates and currency with `intl`, using the same locale as the catalog.

`examples/flutter` is a tiny ARB pair that passes the check, plus a `Text('Cancel subscription')` the scanner is meant to find.
