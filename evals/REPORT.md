# Evaluation report

Independent judge notes for scenarios A and B are in [scenarios/JUDGE.md](scenarios/JUDGE.md). The judge was a separate model pass and was not shown this report. Audit recall and precision were counted mechanically against [scenarios/C-audit/answer-key.json](scenarios/C-audit/answer-key.json). A hit is the same file and the same key. The judge did not score C.

## Checker and lookup, before and after

| Item | Before | After |
| --- | --- | --- |
| 1. Swapped `%@` and `%d` | Sorted comparison, so `"%@ and %d"` versus `"%d و %@"` was clean. That swap crashes iOS. | `placeholder-order` error. `"%2$d و %1$@"` stays clean because each argument keeps its type. |
| 2. `translatable="false"` | The brand string was `missing-key` in the target. | Those strings are skipped. A target that omits `Northwind` is clean. |
| 3. Arabic `one` without a number | `%d` missing from `عنصر واحد` was `placeholder-mismatch`. | Allowed when the category matches exactly one integer from 0 to 200. French `one` is 0 and 1, so a numberless French `one` is still an error. |
| 4. Select and `=0` | A dropped `female` branch and a dropped `=0` branch were clean. | `selector-mismatch` and `exact-choice-missing`. |
| 5. Empty string catalog | A catalog whose target locale had no translations could report nothing. | Every source string with no target localization is `missing-key`. |
| 6. `nativeskill check` and TypeScript | `cli.mjs` imported `validate.mjs`, which imports TypeScript, so `check` failed before `npm install`. | `validate` is loaded only for the `validate` command. With `node_modules/typescript` moved aside, `nativeskill check` on the Flutter fixture printed `0 errors, 0 warnings`. Simple `export default { title: "..." }` files are read by `check`. Spreads and functions still need `nativeskill validate` after `npm install`. |

These cases are locked in `skills/nativeskill/scripts/check.test.mjs`. `npm test` is 14 passing tests.

## Lookup and bad mappings

7. Fixed. If the hits disagree, or one of them is marked not preferred, `wording.status` is `mixed` and `disagreement` is true. Every hit is still returned with its own status. Hindi dismiss is `mixed`: `रद्द करें` is `preferred: false` (it means cancel) and `बंद करें` is `preferred: true`.

8. Fixed for identical Django rows. `en-AU` and `en-GB` both shipped `Save` for the same msgid. Lookup of `en-GB` now returns one `en` row with `english: "Save"`, not two regional copies. Two different projects that both say Save stay as two hits.

Demoted, with the reason stored on the entry: Hindi apply-changes `बदलाव प्रकाशित करें` (that is publish), Tamil dismiss `அகற்று` (remove), Tamil sign-in `உள்ளே போ` (go inside), Tamil cancel `கைவிடுக` (abandon; prefer `ரத்துசெய்`), Arabic delete `شطب` (cross out; prefer `احذف`), Algerian sign-out `اخرج` (prefer `تسجيل الخروج`), Malay dismiss `Abaikan` (ignore; prefer `Tutup`), German dismiss `Ausblenden` (hide; prefer `Schließen`), Hindi save `सुरक्षित कीजिये` (prefer `सहेजें`).

9. Fixed as drafts where no MIT, BSD, or Apache catalog had the line. `billing.pay_now` is now `Jetzt bezahlen`, `ادفع الآن`, `立即支付`, and `立即付款` for German, Arabic, and the two Chinese scripts. Auth, billing, permissions, dialogs, and forms are covered for ta, ms, ar, hi, zh-CN, zh-TW, ja, de, es, fr, and id. Coverage here means a draft or an attestation, not a native review.

10. Fixed in the README. 3,288 attested labels: 2,603 Wikimedia editor UI, 685 from Django, Flutter, Android, and devise-i18n. All 110 languages have plural rules and direction. They do not all have product phrases.

## Scenarios

Same model for baseline and skill. The skill run was required to read `SKILL.md` and the locale notes. The baseline was forbidden to open them.

### A. Add Tamil, Arabic, and German

| | Intent | Structure | Tamil | Arabic | German |
| --- | --- | --- | --- | --- | --- |
| Baseline | 1 | 1 | 2 | 2 | 1 |
| Skill | 2 | 2 | 1 | 1 | 2 |

The judge's scores. Both split dialog Cancel from stop-renewal in Tamil and Arabic, registered the locales, added a switcher, and mirrored Arabic. The baseline German button was `Kündigen`, which can mean the contract ends now. The skill used `Verlängerung stoppen`, which matches "access continues until {date}" and is long enough that the checker warned. The baseline Tamil was shorter and, in the judge's view, more idiomatic. The skill Tamil reused `உள்ளே போ` for sign-in, which this round now marks as not preferred. The skill wired the ARB files through the localization delegate. The baseline left most translations in a hard-coded map.

A second skill run, after the length rule, shortened the buttons to `புதுப்பிப்பை நிறுத்து`, `إيقاف التجديد`, and `Nicht verlängern`. Those stay distinct from dialog Cancel and are closer to the baseline's shorter Tamil and Arabic. `Nicht verlängern` does not mean the contract ends today. `Kündigen` can.

Verdict: the skill helps the intent split and the wiring. It does not beat an unaided model on Tamil naturalness until it is told to shorten. German is safer with the skill.

### B. Add German next to existing locales

| | Intent | Terminology | Naturalness |
| --- | --- | --- | --- |
| Baseline | 2 | 2 | 2 |
| Skill | 2 | 2 | 2 |

Both kept `Northwind`, used `Arbeitsbereich`, and kept `Abbrechen` apart from `Verlängerung stoppen`. The judge called them tied. The existing Tamil, Arabic, Japanese, and Chinese files already showed the pattern. The skill did not add a visible advantage here.

### C. Audit of 31 seeded mistakes

| | Findings | Hits | Recall | Precision | Missed |
| --- | --- | --- | --- | --- | --- |
| Baseline | 31 | 29 | 0.935 | 0.935 | Arabic `تحميل` for download, Chinese `过滤器` for filters |
| Skill | 32 | 31 | 1.000 | 0.969 | none of the 31 |
| Skill, checklist rerun | 32 | 31 | 1.000 | 0.969 | none of the 31 |

The baseline also claimed Tamil plurals have only `other`, which is false, and flagged a Tamil deny that was not in the key. The skill's extra finding is Malay `Arkib`, a noun on a verb button. That is a real style issue and a false positive against the key. The rerun did not move the numbers. The first skill pass had already read the locale notes that name `تنزيل` and `筛选`.

Replacements in the skill findings use the draft catalog (`தானியங்கி புதுப்பிப்பை நிறுத்து`, `إيقاف التجديد التلقائي`, `自動更新を停止`, `停止续订`, `Verlängerung stoppen`, `Hentikan pembaharuan automatik`, `स्वतः नवीनीकरण रोकें`). They keep the meaning. Several are longer than a native button. They are drafts, not a review.

## Verdict

The skill helps an agent when the mistake is a known trap: the same Cancel word for two actions, Arabic download versus upload, Chinese filter wording, a numberless Arabic `one`, a swapped `%@`, an empty string catalog. It does not turn the model into a native speaker. Scenario B shows a capable model already follows sibling files. Scenario A shows the skill can make Tamil worse by trusting a bad attested line, which is why those lines are now marked not preferred. Japanese, Chinese, Malay, and Hindi were not judged for naturalness beyond the audit keys.

A human native reviewer is still required before shipping ta, ar, de, ja, zh, ms, or hi, especially for billing, permissions, and anything marked draft or `preferred: false`.
