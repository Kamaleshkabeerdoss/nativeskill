# Task

Northwind is English-only. Add Tamil, Arabic (with right-to-left layout), and German.

The product:
- "Northwind" stays untranslated.
- `dialogCancel` closes a discard dialog. `stopRenewal` stops future charges and keeps access until {date}. They are both the English word Cancel and they must not become the same translation.
- `endNow` ends access today and does not promise a refund.
- `payNow` charges {amount} now. `savings` is a discount label, not the Save button.
- `allowCamera` / `denyCamera` are the permission prompt for the camera.

Also add a language switcher for English, Tamil, Arabic, and German, register the locales, and fix the layout so Arabic mirrors (no physical left/right padding, back icon follows direction).

Write only under this scenario's `outputs/` directory. Do not edit `lib/l10n/app_en.arb` or `lib/main.dart` in place. Put new ARB files, a replacement `main.dart`, and `NOTES.md` in the output folder you were given.
