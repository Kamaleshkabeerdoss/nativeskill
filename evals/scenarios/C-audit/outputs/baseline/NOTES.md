# Audit notes

English in `locales/en.json` is the source. `Northwind` is the product name in every file, so it stays as is. Locale originals were not edited.

## Billing Cancel

`dialogCancel` and `stopRenewal` are both "Cancel" in English, and they are different actions. Dialog dismiss can be the ordinary cancel or abort word. Stopping a renewal has to name the subscription or use the contract word (`Kündigen`, `解約`, and the equivalents below). Every non-English file had copied the dialog label onto `stopRenewal`.

Replacements:

- Tamil: சந்தாவை ரத்துசெய்
- Arabic: إلغاء الاشتراك
- Japanese: 解約
- Chinese: 取消续订
- German: Kündigen
- Malay: Batalkan langganan
- Hindi: सदस्यता रद्द करें

## Plural categories

Judged from each language's plural rules, not by copying English `one` / `other`.

- Tamil, Japanese, Chinese, and Malay have only `other`. Chinese already had only `other`, with the measure word 张, so `zh.json` `receiptCount` is not a finding. Japanese and Malay had an extra `one` branch whose text matched `other`; the fix removes it. Tamil is worse: `one` never matches, so 1 is shown as the plural ரசீதுகள். I kept a singular by switching that branch to an exact `=1` selector.
- German `one` / `other` (`Beleg` / `Belege`) is right. Not flagged.
- Hindi needs `one` (0 and 1) and `other`. The file had only `other`, so 1 would read 1 रसीदें.
- Arabic needs `zero`, `one`, `two`, `few`, `many`, and `other`, and the noun form changes. The file copied English's two categories and put إيصالات (the 3–10 form) on `other`, which is the form for 100 and above.

## Formality

- Japanese `save` was the polite sentence 保存します. Buttons in that file are plain labels, so the replacement is 保存. The polite ます in `stopRenewalHelp` is a full sentence, which is fine.
- Chinese `stopRenewalHelp` mixes 您 and 你 and adds 你可以继续使用, which the English does not say. I dropped the pronoun instead of picking 您 or 你, because no other Chinese string addresses the user.
- German `download` is the ungrammatical "Herunterladen Sie", and `stopRenewalHelp` uses Du. I first rewrote the help text with Sie, taking the Sie on the download button as the product voice. I changed that. That Sie is a broken suffix (the other buttons are infinitives), not a consistent formal voice. The help text is now pronoun-free: "Der Zugriff bleibt bis {date} bestehen." The download button is "Herunterladen".

## Malay versus Indonesian

`download` is Unduh, which is Indonesian. Malay is Muat turun. I checked the rest for Indonesian copies and did not find another one.

- resit (not resi), penapis (not saringan), Padam (not Hapus), Arkib (not Arsip), sehingga (not sampai), Benarkan (not Izinkan), Log masuk / Log keluar.
- "Belum ada resit" is ordinary Malay.
- "Akses kekal sehingga {date}". I almost flagged kekal as "permanent", which would contradict a deadline. "Kekal sehingga" is the usual "remains in force until" pattern, so I left it.
- "Daftar" for Create account. I almost flagged it as the wrong action (register, and the account is not named). It is the usual Malay sign-up button, so I left it.
- "Arkib" is a noun; "Arkibkan" would be the verb. Acceptable on a button, the same way English "Archive" is. Left it.

## Other calls I dropped

- Arabic تحميل for Download. Guides that pair تنزيل (download) with تحميل (upload) would change it. On this button, تحميل is ordinary product Arabic. Left it.
- German "Jetzt {amount} bezahlen" adds "now". The English string does not, but the key is payNow and the line is natural. Left it.
- Chinese 清除过滤器. 筛选 would be slightly more specific for catalog filters. 过滤器 is still understandable. Left it.
- Hindi फ़िल्टर हटाएँ. हटाएँ is "remove", close enough to clear. Left it.
- Tamil வணக்கம் for "Welcome". That is the normal greeting. The bug on that string is only the placeholder {பெயர்}.
- Loanwords that are the usual UI term: サインイン, ダウンロード, साइन इन, डाउनलोड, Log masuk. Not treated as leftover English.
- German, Japanese, and Chinese `deleteForever` already say permanently (Endgültig, 完全に, 永久). Tamil, Arabic, Malay, and Hindi had collapsed it to a plain delete.

## Placeholders

`{name}`, `{date}`, `{amount}`, `{count}`, and `#` have to stay as tokens. Tamil welcome translated the token to {பெயர்}. Hindi `payNow` dropped `{amount}`.
