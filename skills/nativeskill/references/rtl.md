# RTL layout

Apply this when the locale profile's direction is `rtl` (Arabic, Hebrew, Persian, Urdu, and the other packs that say so) or when the screen must mirror. String quality rules still apply. A correct Arabic sentence in a left-to-right layout is not done.

## Direction

Set language and direction at the root the platform already uses.

- Web: `lang` and `dir="rtl"` on the document, or the element that owns the screen. Use i18next `dir()` when that app already does.
- Flutter: the locale's `Directionality`. Do not wrap one `Row` in `TextDirection.rtl` and leave the scaffold LTR.
- iOS: leading and trailing constraints. SwiftUI follows `layoutDirection`.
- Android: `android:supportsRtl="true"`, and `start`/`end` instead of `left`/`right`.
- React Native: `I18nManager.allowRTL(true)` and `forceRTL` for the active locale. The process reloads before it takes effect.

## What mirrors

Back, forward, and next chevrons mirror. Lists, form labels, and the primary button swap sides. Progress fills from the inline start.

Play, pause, checkmarks, logos, and clocks do not mirror. A phone number, an email, a URL, and an order id stay left to right inside the RTL sentence. On the web, wrap them in `bdi` or `dir="auto"`. Do not paste bidi control characters into the translation when the widget can isolate the run.

## Type

Do not apply Latin letter-spacing to Arabic. Do not fake bold or italic with a Latin font that falls back to a system Arabic face. Use a family that has the Arabic weights. Line height has to clear dots and vowel marks. Use Arabic comma `،` and question mark `؟`.

## Plurals and numbers

Arabic cardinal categories are `zero`, `one`, `two`, `few`, `many`, and `other`. Test with 0, 1, 2, 3, 11, and 100. Pick one digit system for the screen. Do not show `٣` next to `3`.

Mongolian (`Mong`) and other vertical scripts are not solved by `dir` alone. The profile's script is the clue. Do not pretend a direction flag covers them.

[W3C structural RTL markup](https://www.w3.org/International/questions/qa-html-dir) · [Unicode locale data](https://cldr.unicode.org/)
