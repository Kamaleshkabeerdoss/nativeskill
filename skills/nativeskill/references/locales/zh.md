# Chinese (`zh`)

Two writing systems. Do not convert by stroke and hope.

| Tag | Script | Examples already in the catalog |
| --- | --- | --- |
| `zh`, `zh-CN`, `zh-Hans` | Simplified | 允许, 归档, 恢复, 格式无效。 |
| `zh-TW`, `zh-Hant`, `zh-HK` | Traditional | 分享, 封存, 還原 |

`归档` (archive an app, Mainland) and `封存` (Taiwan) are both source-attested and they are not interchangeable. `恢复` and `還原` are the matching restore buttons. A Traditional file that contains `归档` is wrong even if a reader can guess it.

Cardinal plurals are `other` only. There is no singular branch. A count sits in the placeholder: `{count} 项` is still one string, not two keys, unless the app's format uses suffixes. Chinese does not pluralize the noun the way English does. Do not write `项s`.

## 您 or 你

Pick one for the file.

- `您` for account, billing, and anything that handles money, unless the product is already casual.
- `你` only when the rest of the product uses it.
- Never both. A machine translation that uses `您` in the title and `你` in the error is the bug.

Buttons usually have no pronoun at all: `保存草稿`, `下载`, `停止续订`.

## Buttons

Short, no spaces between Chinese characters, no English title case, no `成功地`.

| Control | Simplified | Traditional | Avoid |
| --- | --- | --- | --- |
| Save draft | 保存草稿 | 儲存草稿 | 成功地保存您的草稿 |
| Discard | 放弃更改 | 放棄變更 | 取消 (that is the dialog) |
| Download | 下载 | 下載 | Download |
| Clear filters | 清除筛选 | 清除篩選 | 清除过滤器 (dictionary-word, not UI) |
| Stop renewal | 停止续订 | 停止續訂 | 取消 |
| Invalid format | 格式无效。 (attested) | 格式無效。 (draft) | 你的格式是错误的 |

`筛选` / `篩選` is the product word for filters. `过滤器` is a physical or technical filter and sounds translated.

## Punctuation

Fullwidth `，` `。` `？` `：` in sentences. Buttons have no full stop. The attested error `格式无效。` keeps the period because it is a sentence, not a button. Halfwidth digits and Latin placeholders stay halfwidth. Do not fullwidth the placeholder `{amount}`.

Quotes: `「」` or `""` matching the file. Do not introduce Japanese `「」` into a file that uses `“”`, and the reverse.

## Dates and money

`2026年3月4日` from the formatter for the tag you are writing (`zh-CN` vs `zh-TW`). Currency follows the tag: `¥` / `CN¥` is not `NT$`. Do not hardcode either if the app formats the amount. A discount label keeps `{amount}`: `立省{amount}` (Simplified draft) and `省下{amount}` (Traditional draft).
