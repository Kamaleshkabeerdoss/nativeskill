# Japanese (`ja`)

Left to right. Cardinal plurals are `other` only. Do not copy an English `one` branch.

## Voice

UI labels are short. Android ships `許可` for Allow and `拒否` for Deny. Body text that speaks to the user is です/ます. Buttons are nouns or short verbs (`保存`, `キャンセル`, `共有`) without です. Pick that pattern and keep it. Do not put a full sentence on a button.

There is no source-attested Japanese stop-renewal in the pinned catalogs. A proposal for `billing.stop_renewal` is a draft, and it must not say the subscription ends today unless the intent is `billing.end_subscription_now`.

## Script

Use kanji and kana the way standard UI does. Do not insert spaces between Japanese words. Halfwidth Latin stays for placeholders, product names, and codes. Fullwidth punctuation (`、` `。`) belongs in Japanese sentences. A Latin question mark inside Japanese body text is a slop tell.

## Format

Format yen and dates with the `ja-JP` formatter when that is the locale. `¥` and the currency code come from the formatter, not from a translated sentence that also spells the amount out.
