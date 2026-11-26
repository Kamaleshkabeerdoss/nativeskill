# Android

Use this when the app has `res/values/strings.xml`.

## Resource folders

The default `res/values/strings.xml` is the source, usually English. Add a sibling folder:

| Locale | Folder |
| --- | --- |
| Tamil | `values-ta` |
| Malay | `values-ms` (`values-my` is Burmese) |
| Arabic | `values-ar` |
| Hindi | `values-hi` |
| Indonesian | `values-in` (legacy code) or `values-id` if the project already uses it |
| Simplified Chinese | `values-zh-rCN` |
| Traditional Chinese | `values-zh-rTW` |
| Japanese | `values-ja` |
| German, Spanish, French | `values-de`, `values-es`, `values-fr` |

Copy the string `name` attributes exactly. Translate the text. Keep `%1$s`, `%d`, and `%1$d` byte-exact, including the index.

Plurals:

```xml
<plurals name="item_count">
    <item quantity="one">%d item</item>
    <item quantity="other">%d items</item>
</plurals>
```

Arabic also needs `zero`, `two`, `few`, and `many`. Malay, Indonesian, Japanese, and Chinese need `other` only.

## Register the locale

A `values-ta` folder is not enough when the app uses per-app language or resource shrinking.

- API 33 per-app language: `res/xml/locales_config.xml` lists every locale, and the manifest has `android:localeConfig="@xml/locales_config"`. Add the new `<locale android:name="ta" />` there.
- If `build.gradle` sets `resourceConfigurations` or `androidResources.localeFilters`, add the language or the folder will be stripped from release builds.
- `android:supportsRtl="true"` on `<application>` when you add an RTL language.

## Check

```sh
node <skill-dir>/scripts/check.mjs \
  --source app/src/main/res/values/strings.xml \
  --target app/src/main/res/values-ta/strings.xml \
  --locale ta --format android
```

`android:text="@string/sign_out"` is already cataloged. `android:text="Pay now"` is hardcoded. `scripts/scan.mjs` reports the second and skips the first.

Use `start`/`end` and padding-start, not `left`/`right`, so Arabic mirrors. Do not translate `translatable="false"` names. Format money with `NumberFormat.getCurrencyInstance(locale)`.

`examples/android` is a strings pair that passes, plus a layout button the scanner should flag.
