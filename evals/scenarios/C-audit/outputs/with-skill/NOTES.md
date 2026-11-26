# C-audit notes

Review only. `locales/` was not edited. Replacements below are proposals. Nothing in this note is a native-speaker review, a linguist review, or an upstream review of this app.

Stack: i18next-style JSON catalogs. English (`locales/en.json`) is the source. No UI to register, and no layout to mirror. Arabic RTL is not applied because this pass is the catalogs only.

## Check summaries

`node skills/nativeskill/scripts/check.mjs --source locales/en.json --target locales/<tag>.json --locale <tag> --source-locale en`

| Locale | Errors | Warnings | What the checker named |
| --- | --- | --- | --- |
| ta | 1 | 2 | error `icu-syntax` on `welcome` (placeholder `{பெயர்}` breaks). warning `possible-source-copy` on `appTitle` (brand, keep) and `stopRenewalHelp` (English left in place). |
| ar | 1 | 1 | error `plural-missing` on `receiptCount` (missing zero, two, few, many). warning `possible-source-copy` on `appTitle`. |
| ja | 0 | 2 | warning `plural-unused` on `receiptCount` (`one`). warning `possible-source-copy` on `appTitle`. |
| zh | 0 | 1 | warning `possible-source-copy` on `appTitle`. |
| de | 0 | 2 | warning `possible-source-copy` on `appTitle` and on `workspace` (not a brand). |
| ms | 0 | 2 | warning `plural-unused` on `receiptCount` (`one`). warning `possible-source-copy` on `appTitle`. |
| hi | 2 | 1 | error `placeholder-mismatch` on `payNow` (`{amount}` dropped). error `plural-missing` on `receiptCount` (missing `one`). warning `possible-source-copy` on `appTitle`. |

`appTitle` = Northwind is a proper noun. The copy warning is expected and is not a finding.

Patched copies of the proposals were checked under `/tmp` (originals untouched). Each locale then exited 0. Remaining warnings: `appTitle` in every file, plus `length-blowup` on `stopRenewal` for ar (22 vs 6), de (20 vs 6), and ms (30 vs 6). Those three stay long on purpose. Shortening them back toward the one-word Cancel is how the wrong action returns. Tamil `தானியங்கி புதுப்பிப்பை நிறுத்து` did not trip the length rule.

## Formality

- Tamil: short verbs, the same shape as `சேமி` and `வெளியேறு`. No `நீ`, no stacked `தயவுசெய்து`, no `-உம்` on the new buttons.
- Arabic: MSA. Buttons that can be a masdar stay a masdar (`حفظ`, `تنزيل`, `حذف نهائي`). No dialect.
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
| `ar.json` `receiptCount` | plural | one / other only | zero, one, two, few, many, other | draft |
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
| `de.json` `stopRenewal` | `billing.stop_renewal` | Abbrechen | Verlängerung stoppen | draft |
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

`dialog.cancel_action` that stays, all source-attested for that role: Tamil `ரத்துசெய்`, Arabic `إلغاء`, Japanese `キャンセル`, Chinese `取消`, German `Abbrechen`, Malay `Batal`, Hindi `रद्द करें`.

## Native-speaker self-review

Read against the locale notes and `references/signs.md` after the first pass. Each rewrite is still a draft unless the table says source-attested.

- Tamil buttons are one verb plus at most one object. `வரைவைச் சேமி` drops “successfully” and the long `-உம்`. `காப்பகப்படுத்து` is the archive verb, not copy. `நிரந்தரமாக நீக்கு` says the delete cannot be undone. `{date} வரை அணுகல் தொடரும்.` is one sentence, Western digits via the placeholder, period because it is a sentence. `தானியங்கி புதுப்பிப்பை நிறுத்து` is long and still the stop-renewal draft, not `ரத்துசெய்`.
- Arabic `إيقاف التجديد التلقائي` is a masdar phrase, not `إلغاء`, and it does not promise a refund or an immediate end. The receipt plural changes the noun: none, singular, dual `إيصالان`, plural `إيصالات` for 3–10, accusative singular for 11–99, singular again for 100+. `تنزيل` is download. `حذف نهائي` is final. `لا توجد إيصالات بعد.` matches the statement and the period already used on `stopRenewalHelp`. No `؟` because it is not a question.
- Japanese `保存` can sit on a button. `自動更新を停止` has no `ます` and is not `キャンセル`. The receipt line keeps `領収書 # 件` and only drops the unused `one` branch. Body text `まで利用できます` already uses `ます` and was left alone.
- Chinese `停止续订` is a short button with no pronoun and no `成功地`. The help line keeps a single `您` and drops the repeated clause. `清除筛选` is the product word, not a physical filter. `归档` was already the simplified archive button and stayed.
- German `Verlängerung stoppen` is an infinitive plus one object, not `Abbrechen` and not “end the subscription now”. `Sie behalten den Zugriff bis {date}.` is Sie, not du. `Herunterladen` has no `Sie`. `Arbeitsbereich` is a noun, capitalized, and is not the brand. `Entwurf speichern`, `Endgültig löschen`, and `Archivieren` were already the right shapes.
- Malay `Hentikan pembaharuan automatik` is the stop-renewal draft, not `Batal` and not Indonesian. `Tolak` is the prompt decline. `Muat turun` replaces Indonesian `Unduh`. `Padam secara kekal` is Malay, not `Hapus permanen`. `Arkibkan` is a verb. `{count, plural, other {# resit}}` does not pluralize the noun. `Log masuk`, `Log keluar`, and `Daftar` were already the Malay set and stayed.
- Hindi `स्वतः नवीनीकरण रोकें` uses `आप` agreement and is not `रद्द करें`. `{amount} का भुगतान करें` puts the amount back and does not gender the user. `न दें` declines the camera prompt. `अभी नहीं` was not reused, and the skip draft `छोड़ें` was not put here either, because this is not a skip. `हमेशा के लिए मिटाएँ` says the delete is irreversible. The receipt plural gives 1 the singular `रसीद`.

## Kept, and what I changed my mind about

- Tamil `allowCamera` is `அனுமதி`. I was going to call that a noun used as a verb and replace it. It is the Android Allow label, source-attested, and it is a noun. The rest of the file uses short verbs, so the long verb `அனுமதிக்கவும்` would mix the two shapes. Left as `அனுமதி`, and named here as a noun.
- Tamil `denyCamera` is `வேண்டாம்`. Lookup’s deny button is `நிராகரி` (AOSP, source-attested). I almost flagged it. `வேண்டாம்` still declines the prompt. It is not a grant, and it is not “not now”. Left it out of the findings. A reviewer who wants the AOSP verb would use `நிராகரி` and would still mark that choice source-attested.
- Tamil `signIn` `உள்நுழை` is a real sign-in verb. Django’s attested `உள்ளே போ` is “go inside”. The current line already means sign in, so it stays. `save` stays `சேமி` (short stem). The attested `சேமிக்க` is the same action in a longer form.
- Tamil `payNow` keeps `{amount} செலுத்து`. The pay-now draft `இப்போது செலுத்து` drops the amount, so it is not a fix.
- Arabic `payNow` stays `ادفع {amount}`, masculine singular imperative. I looked at a masdar and did not like it next to the amount. The file has no feminine address. Called out here so the gender is explicit. Not a finding.
- Arabic `denyCamera` `عدم السماح` means “don’t allow” and pairs with `السماح`. AOSP’s generic `رفض` is a different wording of the same decline. Left it.
- Arabic `signIn` stays `تسجيل الدخول`. Attested `ادخل` is a masculine “enter” and is a worse fit for this file.
- Japanese welcome keeps `さん`. The note says not to invent an honorific. Dropping `さん` makes “Welcome, {name}” sound translated. `さん` is the neutral suffix, not `様` or a title. The space is only there so the placeholder does not stick to the suffix.
- Japanese `サインイン` / `サインアウト` stay as a pair. `ログイン` / `ログアウト` are attested and mean the same actions. `許可しない` stays: it is “don’t allow”, which matches this prompt better than generic `拒否`.
- Chinese `signOut` stays `退出`. Django’s attested log-out is `注销`. In a consumer product `注销` is easy to read as closing the account. `退出` ends the session and keeps the account. `不允许` stays as “don’t allow”, next to `允许`. `创建账户` stays because the English is “Create account”, not only “注册”.
- German `Filter löschen` matches the clear-filters draft and does not delete receipts. `Nicht zulassen` matches “Don’t allow” next to `Zulassen`. `Jetzt {amount} bezahlen` already has the amount and the infinitive. None of these are findings.
- Malay `Akses kekal sehingga {date}.` reads as access lasting until that date, which is the help sentence. Left it. `Kosongkan penapis` matches the clear-filters draft.
- Hindi `संग्रहित करें` is the attested archive button. `फ़िल्टर हटाएँ` matches the clear-filters draft. `खाता बनाएँ` matches “Create account” and the `आप` form. `मिटाएँ` on delete-forever did not get this pass: I first treated it as close enough, then put it in the findings because it is the ordinary delete and the English says permanently.
- `end_subscription_now` does not appear. No replacement promises a refund or an immediate cutoff.

Check errors still open on the originals: the table above. They stay open because this request does not edit `locales/`. No locale was registered or removed. Files written: `outputs/with-skill/findings.json` and this note.
