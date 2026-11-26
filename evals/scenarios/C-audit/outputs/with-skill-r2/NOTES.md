# C-audit notes (with-skill r2)

Review only. `locales/` was not edited. Replacements are proposals. Nothing in this note is a native-speaker review, a linguist review, or an upstream review of this app.

Stack: flat JSON catalogs. English (`locales/en.json`) is the source. There is no app shell to register a locale in, and no layout to mirror. Arabic RTL is not applied because this pass is the catalogs only.

`check.mjs` was run from `en.json` to each other file before any proposal was written:

```sh
node skills/nativeskill/scripts/check.mjs --source locales/en.json --target locales/<tag>.json --locale <tag> --source-locale en --json
```

| Locale | Errors | Warnings | What the checker named |
| --- | --- | --- | --- |
| ta | 1 | 2 | error `icu-syntax` on `welcome` (`{பெயர்}`). warning `possible-source-copy` on `appTitle` (brand, keep) and `stopRenewalHelp` (English left in place). |
| ar | 1 | 1 | error `plural-missing` on `receiptCount` (missing zero, two, few, many). warning `possible-source-copy` on `appTitle`. |
| ja | 0 | 2 | warning `plural-unused` on `receiptCount` (`one`). warning `possible-source-copy` on `appTitle`. |
| zh | 0 | 1 | warning `possible-source-copy` on `appTitle`. |
| de | 0 | 2 | warning `possible-source-copy` on `appTitle` and on `workspace` (not a brand). |
| ms | 0 | 2 | warning `plural-unused` on `receiptCount` (`one`). warning `possible-source-copy` on `appTitle`. |
| hi | 2 | 1 | error `placeholder-mismatch` on `payNow` (`{amount}` dropped). error `plural-missing` on `receiptCount` (missing `one`). warning `possible-source-copy` on `appTitle`. |

`appTitle` = Northwind is a proper noun. The copy warning is expected and is not a finding.

Patched copies of the proposals were checked under `/tmp` (originals untouched). Each locale then exited 0. Remaining warnings: `appTitle` in every file, plus `length-blowup` on `stopRenewal` for ar (22 vs 6) and ms (30 vs 6). Those two stay long on purpose. The button has to grow. Shortening them back to the dialog Cancel is how the wrong action returns. Tamil `தானியங்கி புதுப்பிப்பை நிறுத்து` (17) and Hindi `स्वतः नवीनीकरण रोकें` (12) stay under the length rule.

## Audit checklist

Each item was checked in every locale, including strings that are grammatical.

| Checklist item | Result |
| --- | --- |
| Subscription or renewal uses the same word as dialog Cancel | Hit in all seven files on `stopRenewal`. `dialogCancel` itself is the right dialog word in every file and is not a finding. |
| Arabic download is `تحميل` | Hit. `ar.json` `download` is `تحميل`. Replacement `تنزيل`. |
| Chinese filters say `过滤器` | Hit. `zh.json` `clearFilters` is `清除过滤器`. Replacement `清除筛选`. Simplified, because the file is Simplified. |
| Tamil archive is `காப்பிடு` | Hit. `ta.json` `archive`. Replacement `காப்பகப்படுத்து`. |
| Hindi skip or deny is `अभी नहीं` | Hit. `hi.json` `denyCamera` is `अभी नहीं`. There is no skip key. `empty` uses `अभी` as “yet” (“no receipts yet”) and stays. |
| German `Sie` glued to an infinitive, or `du` next to `Sie` | Hit both. `download` is `Herunterladen Sie`. `stopRenewalHelp` is `du`. No `ihr`. |
| Japanese buttons end in `します` or `してください` | Hit `します` on `ja.json` `save` (`保存します`). No button ends in `してください`. `ます` on `stopRenewalHelp` is a sentence and stays. |
| One Chinese sentence uses both `您` and `你` | Hit. `zh.json` `stopRenewalHelp`. No other string in the file uses either pronoun. |
| Malay uses Indonesian `Unduh`, `Hapus`, or `Mendaftar` | Hit `Unduh` on `ms.json` `download`. `Hapus` is absent (`deleteForever` is `Padam`). `Mendaftar` is absent (`createAccount` is `Daftar`). `Log masuk` / `Log keluar` / `Benarkan` are already the Malay set. |
| A placeholder was translated or dropped | Hit `ta.json` `welcome` (`{பெயர்}`) and `hi.json` `payNow` (`{amount}` dropped). `{name}`, `{date}`, `{amount}`, `{count}`, and `#` match everywhere else. |
| A whole English sentence remains, and it is not a brand | Hit `ta.json` `stopRenewalHelp`. `de.json` `workspace` is a single English word, not a sentence, and is still not a brand, so it is filed separately. `Northwind` stays in every file. |

## Formality

- Tamil: short verbs, the same shape as `சேமி` and `வெளியேறு`. No `நீ`, no stacked `தயவுசெய்து`, no `-உம்` on the new buttons.
- Arabic: MSA. Buttons that can be a masdar stay a masdar (`حفظ`, `تنزيل`, `حذف نهائي`). `payNow` stays the masculine singular `ادفع {amount}`. The file has no feminine address. No dialect.
- German: Sie in the one billing sentence. Every button is an infinitive. No `du`, no `ihr`.
- Japanese: buttons without `ます` or `してください`. Body text stays `です`/`ます`.
- Chinese: `您` for the file. No `你`. Simplified throughout.
- Malay: Bahasa Malaysia, sentence case. Not Indonesian.
- Hindi: `आप` agreement (`करें`, `रोकें`, `मिटाएँ`). No `तू` or `तुम`. No `कृपया` on the buttons.

## Findings

32 proposals. `dialogCancel` is the dialog word in every locale and is not in the list. `stopRenewal` is flagged in all seven locales.

| Key | Intent | Current | Proposed | Evidence |
| --- | --- | --- | --- | --- |
| `ta.json` `welcome` | greeting | வணக்கம், {பெயர்} | வணக்கம், {name} | draft |
| `ta.json` `stopRenewal` | `billing.stop_renewal` | ரத்துசெய் | தானியங்கி புதுப்பிப்பை நிறுத்து | draft |
| `ta.json` `stopRenewalHelp` | access continues until `{date}` | Access continues until {date}. | {date} வரை அணுகல் தொடரும். | draft |
| `ta.json` `saveDraft` | `form.save_draft` | வரைவை வெற்றிகரமாக சேமிக்கவும் | வரைவைச் சேமி | draft |
| `ta.json` `deleteForever` | `item.delete_permanently` | நீக்கு | நிரந்தரமாக நீக்கு | draft |
| `ta.json` `archive` | `item.archive` | காப்பிடு | காப்பகப்படுத்து | draft |
| `ar.json` `stopRenewal` | `billing.stop_renewal` | إلغاء | إيقاف التجديد التلقائي | draft |
| `ar.json` `receiptCount` | plural | one / other only | zero, one, two, few, many, other, noun changes | draft |
| `ar.json` `download` | `content.download` | تحميل | تنزيل | draft |
| `ar.json` `empty` | empty state | لا توجد إيصالات بعد? | لا توجد إيصالات بعد. | draft |
| `ar.json` `deleteForever` | `item.delete_permanently` | حذف | حذف نهائي | draft |
| `ja.json` `save` | `form.save_changes` | 保存します | 保存 | source-attested |
| `ja.json` `stopRenewal` | `billing.stop_renewal` | キャンセル | 自動更新を停止 | draft |
| `ja.json` `receiptCount` | plural | one and other | other only, same wording | draft |
| `zh.json` `stopRenewal` | `billing.stop_renewal` | 取消 | 停止续订 | draft |
| `zh.json` `stopRenewalHelp` | access continues until `{date}` | 您 … 你 … | 您的访问权限持续到 {date}。 | draft |
| `zh.json` `clearFilters` | `search.clear_filters` | 清除过滤器 | 清除筛选 | draft |
| `de.json` `workspace` | workspace label | Workspace | Arbeitsbereich | draft, uncovered |
| `de.json` `stopRenewal` | `billing.stop_renewal` | Abbrechen | Nicht verlängern | draft |
| `de.json` `stopRenewalHelp` | access continues until `{date}` | Du behältst den Zugriff bis {date}. | Sie behalten den Zugriff bis {date}. | draft |
| `de.json` `download` | `content.download` | Herunterladen Sie | Herunterladen | draft |
| `ms.json` `stopRenewal` | `billing.stop_renewal` | Batal | Hentikan pembaharuan automatik | draft |
| `ms.json` `denyCamera` | `permissions.deny_access` | Nafi | Tolak | source-attested, accessibility dialog |
| `ms.json` `receiptCount` | plural | one and other | other only | draft |
| `ms.json` `download` | `content.download` | Unduh | Muat turun | draft |
| `ms.json` `deleteForever` | `item.delete_permanently` | Padam | Padam secara kekal | draft |
| `ms.json` `archive` | `item.archive` | Arkib | Arkibkan | draft |
| `hi.json` `stopRenewal` | `billing.stop_renewal` | रद्द करें | स्वतः नवीनीकरण रोकें | draft |
| `hi.json` `payNow` | `billing.pay_now` | भुगतान करें | {amount} का भुगतान करें | draft |
| `hi.json` `denyCamera` | `permissions.deny_access` | अभी नहीं | न दें | source-attested, accessibility dialog |
| `hi.json` `receiptCount` | plural | other only | one {# रसीद} other {# रसीदें} | draft |
| `hi.json` `deleteForever` | `item.delete_permanently` | मिटाएँ | हमेशा के लिए मिटाएँ | draft |

`dialog.cancel_action` that stays, source-attested for that role: Tamil `ரத்துசெய்`, Arabic `إلغاء`, Japanese `キャンセル`, Chinese `取消`, German `Abbrechen`, Malay `Batal`, Hindi `रद्द करें`.

## Read as a native speaker

Each rewrite is still a draft unless the table says source-attested.

- Tamil buttons are one verb plus at most one object. `வரைவைச் சேமி` drops “successfully” and the long `-உம்`. `காப்பகப்படுத்து` is the archive verb. `நிரந்தரமாக நீக்கு` says the delete cannot be undone. `{date} வரை அணுகல் தொடரும்.` is one sentence, period because it is a sentence, Western digits via the placeholder.
- Arabic `إيقاف التجديد التلقائي` is a masdar phrase. It does not promise a refund or an immediate end. The receipt plural changes the noun: singular for 0, 1, and 100+, dual `إيصالان` for 2 (the dual itself is the number, so no extra digit), sound plural `إيصالات` for 3–10, accusative singular for 11–99. `#` stays so the formatter supplies the digit. `تنزيل` is download. `حذف نهائي` is final. `لا توجد إيصالات بعد.` matches the statement and the period already used on `stopRenewalHelp`.
- Japanese `保存` can sit on a button. `自動更新を停止` has no `ます` and is not `キャンセル`. The receipt line keeps `領収書 # 件` and only drops the unused `one` branch.
- Chinese `停止续订` is a short button with no pronoun and no `成功地`. The help line keeps a single `您` and drops the repeated clause. `清除筛选` is the product word. `归档` was already the simplified archive button and stayed. `下载` was already the download draft and stayed.
- German `Nicht verlängern` is the short infinitive. `Sie behalten den Zugriff bis {date}.` is Sie. `Herunterladen` has no `Sie`. `Arbeitsbereich` is a noun, capitalized, and is not the brand. `Entwurf speichern`, `Endgültig löschen`, `Archivieren`, and `Filter löschen` were already the right shapes.
- Malay `Hentikan pembaharuan automatik` is the stop-renewal draft. `Tolak` is the prompt decline. `Muat turun` replaces Indonesian `Unduh`. `Padam secara kekal` is Malay. `Arkibkan` is a verb. `{count, plural, other {# resit}}` does not pluralize the noun.
- Hindi `स्वतः नवीनीकरण रोकें` uses `आप` agreement. `{amount} का भुगतान करें` puts the amount back and does not gender the user. `न दें` declines the camera prompt. `हमेशा के लिए मिटाएँ` says the delete is irreversible. The receipt plural gives 1 the singular `रसीद`. `stopRenewalHelp` uses `रहेगी` to agree with `पहुँच`, the thing, not a male user.

## What I changed my mind about

- German `stopRenewal`. I first wrote `Verlängerung stoppen`, the catalog draft. It is 20 characters against `Cancel` at 6, so `check.mjs` reports `length-blowup`. The help line already says access lasts until `{date}`. The locale note’s shorter draft for that case is `Nicht verlängern` (16 characters, no warning). That is the replacement. It is not `Abbrechen` and it is not `Kündigen`.
- Arabic and Malay `stopRenewal`. I looked for a shorter line that still means “stop the next renewal.” Anything short enough collapses toward the dialog word. The long drafts stay, and the note above says the control has to grow.
- Tamil `allowCamera` is `அனுமதி`. I was going to call that a noun used as a verb and replace it. It is the Android Allow label, source-attested, and it is a noun. The rest of the file uses short verbs, so the long verb `அனுமதிக்கவும்` would mix the two shapes. Left as `அனுமதி`, and named here as a noun.
- Tamil `denyCamera` is `வேண்டாம்`. Lookup’s deny button is `நிராகரி` (AOSP, source-attested). `வேண்டாம்` still declines the prompt. It is not a grant, and it is not “not now.” Left out of the findings.
- Tamil `signIn` `உள்நுழை` already means sign in. Django’s attested `உள்ளே போ` is “go inside.” The current line stays. `save` stays `சேமி`. `payNow` keeps `{amount} செலுத்து`. The pay-now draft `இப்போது செலுத்து` drops the amount, so it is not a fix.
- Arabic `payNow` stays `ادفع {amount}`, masculine singular, called out above. `denyCamera` `عدم السماح` means “don’t allow” and pairs with `السماح`. `signIn` stays `تسجيل الدخول`, a masdar, in a file of masdar buttons. `clearFilters` already matches the draft `مسح عوامل التصفية`. `archive` `أرشفة` is the attested archive button.
- Japanese `サインイン` / `サインアウト` stay as a pair. `ログイン` / `ログアウト` are attested and mean the same actions. `許可しない` stays: it is “don’t allow,” which matches this prompt. `ダウンロード`, `アーカイブ`, `完全に削除`, and `フィルタをクリア` already match the catalog. The space in `ようこそ、{name} さん` separates the placeholder from `さん`. I left it. `さん` is the ordinary suffix, not an honorific invented for this product.
- Chinese `signOut` stays `退出`. Django’s attested log-out is `注销`. In a consumer product `注销` is easy to read as closing the account. `退出` ends the session and keeps the account. `不允许` stays as “don’t allow,” next to `允许`. `创建账户` stays because the English is “Create account.” `receiptCount` already has only `other`, with the measure word `张`.
- German `Filter löschen` matches the clear-filters draft and does not delete receipts. `Nicht zulassen` matches “Don’t allow” next to `Zulassen`. `Jetzt {amount} bezahlen` already has the amount and the infinitive. The receipt plural `Beleg` / `Belege` is already `one` / `other`.
- Malay `Akses kekal sehingga {date}.` reads as access lasting until that date. `sehingga` bounds it. Left it. `Kosongkan penapis` matches the clear-filters draft. `Daftar` is the attested sign-up button for “Create account.” `Belum ada resit.` is ordinary Malay.
- Hindi `संग्रहित करें` is the attested archive button. `फ़िल्टर हटाएँ` matches the clear-filters draft. `डाउनलोड करें` matches the download draft. `खाता बनाएँ` matches “Create account” and the `आप` form. `साइन इन करें` / `साइन आउट करें` stay as a pair. The skip draft `छोड़ें` was not put on `denyCamera`, because this is a deny, not a skip.

`billing.end_subscription_now` does not appear. No replacement promises a refund or an immediate cutoff.

Check errors still open on the originals: the table above. They stay open because this request does not edit `locales/`. No locale was registered or removed. Files written: `outputs/with-skill-r2/findings.json` and this note.
