# Japanese (`ja`)

Left to right. Cardinal plurals are `other` only. Do not invent a `one` branch. There is no space between Japanese words.

## Buttons do not take ます

A button or menu item is a noun or the dictionary form, never the polite sentence.

| Control | Natural | Sounds like a translation |
| --- | --- | --- |
| Save | 保存 | 保存します |
| Download | ダウンロード | ダウンロードします |
| Archive | アーカイブ (Android Settings, attested) | アーカイブする |
| Restore | 復元 (attested) | 復元してください |
| Delete forever | 完全に削除 (draft) | 完全に削除してください |
| Stop renewal | 自動更新を停止 (draft) | キャンセル |
| Add | 追加 (draft) | 追加します |

`します` and `してください` are for body text and empty states, not for the control. `キャンセル` is the dialog cancel. It is the wrong word for stopping a subscription.

## Katakana

Loanwords are normal when Japanese UI already uses them: `ダウンロード`, `パスワード`, `フィルター`, `アーカイブ`. Replacing a settled loan with a rare kanji coinage sounds less native, not more. Do not katakana-spell a word that has an ordinary Japanese UI word (`保存`, not `セーブ`, unless the app is already full of `セーブ`).

`形式が無効です。` is the attested Material format error. It is a sentence, so `です` is correct there. It is not a button.

## Politeness in sentences

Body copy is です/ます. Do not drop to plain `だ` in an error and use です in the next sentence. Do not use `お前` or rough imperatives. The user is not named with an honorific you invent.

## Punctuation and width

- Japanese comma `、` and full stop `。` in sentences.
- Buttons have neither.
- Latin placeholders, brands, and codes stay halfwidth: `{amount}`, `%1$s`, `OK` only if the file already uses `OK`.
- Fullwidth Latin (`ＯＫ`, `１２`) is a tell unless the whole product uses it. Use halfwidth digits.
- Do not insert spaces around Japanese words to mimic English.
- Quotes: `「...」` for a quoted term in a sentence. Do not use English `"..."` inside a Japanese sentence if the file uses brackets.

## Dates and money

`2026年3月4日` from the `ja-JP` formatter. Yen is `¥` or `円` from the currency formatter, not both in one flow. A discount is `{amount}お得` (draft), which is storefront language. It is not the Save button `保存`.
