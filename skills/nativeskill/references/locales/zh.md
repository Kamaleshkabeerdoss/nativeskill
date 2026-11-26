# Chinese (`zh`)

Two writing systems. `zh-CN` and `zh-Hans` are Simplified. `zh-TW` and `zh-Hant` are Traditional. Do not copy a Simplified string into a Traditional file. Cardinal plurals are `other` only. There is no `one` branch to translate.

## Voice

Android Simplified Allow is `允许`. Traditional Share is `分享`. Buttons stay short, with no spaces between Chinese words and no English title case. Use `您` for a formal product and `你` only when that product already uses it. Do not mix them.

Mainland and Taiwan also differ in vocabulary, not only in characters: `软件` / `軟體`, `信息` / `資訊`, `视频` / `影片`. Match the region of the locale you are writing. A `zh-Hans-MY` or `zh-Hant-HK` profile is not `zh-CN` or `zh-TW`. Look up the tag and keep the script the profile names.

## What is not covered

The pinned catalogs do not include a source-attested stop-renewal or pay-now for Chinese. Those proposals are drafts. Say so. Do not borrow an English "Cancel" and do not assume Traditional is a character-by-character conversion of Simplified.

## Format

Fullwidth punctuation in Chinese sentences (`，` `。`). Leave placeholders and brand names in their original characters, isolated if they sit inside a sentence. Format currency and dates with `Intl` for `zh-CN` or `zh-TW`, not with a US pattern.
