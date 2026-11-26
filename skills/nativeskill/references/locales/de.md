# German (`de`)

Left to right. Cardinal plurals are `one` and `other`.

## Voice

Pick `Sie` or `du` for the whole language and do not mix them. A product that already says `du` stays `du`. A product with no voice yet should use `Sie` for account, billing, and permission screens unless the user says otherwise. Name the choice in the report.

devise ships `Registrieren` for sign up. Telegram ships `Passwort ändern` for change password and `Passwort zurücksetzen` for reset password. Android ships `Zulassen` for Allow, `Ablehnen` for Deny, and `Überspringen` for Skip. Those are source-attested for those intents. `Abbrechen` is the Android dialog cancel. It is not stop-renewal.

## Compounds and length

German compounds get long. Watch `length-blowup` on buttons. Prefer one compound the control can hold over a calque of the English word order. Nouns are capitalized. Do not capitalize every word the way English title case does.

## Format

`1.234,56 €` is the usual de-DE pattern, and it comes from the formatter, not from a hand-built string. Switzerland (`de-CH`) uses a different apostrophe and currency. If the locale tag is `de-CH`, do not reuse de-DE grouping. The catalog profile for the tag is the one to follow.
