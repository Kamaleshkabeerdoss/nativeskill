---
name: nativeskill
license: MIT
description: Add a language to an existing app, or audit and correct the translations it already has. Use for localize, translate, i18n, l10n, internationalize, internationalization, localization, add Tamil, add Malay, add Arabic, add Hindi, add Chinese, add Japanese, add German, add Spanish, add French, add Indonesian, ARB, l10n.yaml, Localizable.xcstrings, Localizable.strings, strings.xml, i18next, RTL, right-to-left, plurals, placeholders, or when a translation sounds wrong or like Google Translate. Decide the UI intent before choosing words, so a subscription Cancel is not a dialog Cancel. Keep placeholders byte-exact and label every proposal source-attested, draft, or uncovered.
---

# NativeSkill

Localize an app that already has a UI. Two jobs: add a language, or audit and fix translations that are already there. The work is meaning first. The same English word is often several actions, and those actions do not share a translation.

`Cancel` on a dialog abandons that dialog (`dialog.cancel_action`). `Cancel` on a subscription either stops future renewal (`billing.stop_renewal`) or ends access today (`billing.end_subscription_now`). Malay Android ships `Batal` for the generic cancel. Putting `Batal` on "stop renewal" tells the user the wrong thing about their money. Look the intent up, then the wording.

Bundled labels are evidence of what another product shipped, or an unreviewed draft. They are not a native-speaker review of this app. Every proposed string gets one of three labels: `source-attested`, `draft`, or `uncovered`. A lookup can also come back `mixed`; resolve it with the [Evidence](#evidence) table before you label the string.

## Rules

1. Name the intent and the UI role before you write a word. Roles include button, link, title, field label, error, and status. The catalog is [references/intent.md](references/intent.md). Contested words go through the lookup below.
2. Keep placeholders byte-exact. `{count}`, `{amount}`, `%1$s`, `%@`, `%d`, and `{{name}}` stay character for character, including the index and the brace style. Do not translate the name inside, do not drop one, and do not turn `{{name}}` into `{name}`. Unnumbered `%@` and `%d` keep their order. Swapping them crashes iOS. If the sentence order must change, number them `%1$@` and `%2$d`.
3. Use that locale's CLDR plural categories. English `one`/`other` is not Arabic (`zero`, `one`, `two`, `few`, `many`, `other`) and not Malay, Indonesian, Japanese, or Chinese (`other` only). Include every category the locale uses. Never build the sentence by gluing a number to a noun.
4. One formality for the whole language. Do not mix French `tu` and `vous`, German `du` and `Sie`, or Hindi `तू` and `आप`. Match the formality the app already uses. If it has none, pick one, name it in the report, and use it everywhere.
5. Leave brand names, legal entity names, trademarks, and product codes untranslated when the product treats them as proper nouns. A bundled example loses to the project's glossary.
6. Format dates, numbers, and currency with the platform locale APIs (`intl`, `DateFormat`, `NumberFormatter`, `android.icu`). Do not hardcode `$`, `MM/DD/YYYY`, or a digit shape inside a string the app already formats.
7. Label the evidence. `source-attested` means a pinned upstream UI shipped that phrase for this intent and role, and no reviewer marked it `preferred: false`. `draft` means an unreviewed suggestion, including every sentence you compose. `uncovered` means lookup found nothing. Never say a native speaker, a linguist, or the upstream project reviewed this app's copy.
8. Read the locale note before writing a language you have not already checked in this task: [ta](references/locales/ta.md), [ms](references/locales/ms.md), [ar](references/locales/ar.md), [hi](references/locales/hi.md), [zh](references/locales/zh.md), [ja](references/locales/ja.md), [de](references/locales/de.md), [es](references/locales/es.md), [fr](references/locales/fr.md), [id](references/locales/id.md). Machine-translation tells are in [references/signs.md](references/signs.md). RTL layout is in [references/rtl.md](references/rtl.md).

Lookup, from the installed skill directory:

```sh
node <skill-dir>/scripts/lookup.mjs ms-MY billing.stop_renewal button
node <skill-dir>/scripts/lookup.mjs ta auth.sign_out button
```

Read `wording.status`, `wording.preferred`, and `wording.disagreement` before any entry text. A `preferred: false` entry is rejected even when it is `source-attested`. If `wording.preferred` is set and its meaning and role fit the control, use it. The full decision table is in [Evidence](#evidence).

## Detect the stack

Look at the repo before you choose a format.

| You find | Stack | Guide |
| --- | --- | --- |
| `l10n.yaml`, `*.arb`, `flutter gen-l10n` | Flutter | [flutter.md](references/platforms/flutter.md) |
| `Localizable.xcstrings`, `Localizable.strings`, `knownRegions` | iOS | [ios.md](references/platforms/ios.md) |
| `res/values/strings.xml`, `locales_config.xml` | Android | [android.md](references/platforms/android.md) |
| `i18next`, `useTranslation`, `locales/en/common.json` | Web | [react-i18next.md](references/platforms/react-i18next.md) |
| `I18nManager`, `expo-localization`, React Native plus one of the above | React Native | [react-native.md](references/platforms/react-native.md) |

Write new strings in the format that stack already uses. Do not add a second catalog system beside the first. Register the locale in the place that stack actually reads: Flutter `supportedLocales` / generated locales, iOS `knownRegions` and the string catalog, Android `locales_config.xml`, i18next `supportedLngs`.

## Add a language

1. Find the source catalog and the source locale. Record the format: ARB, JSON or i18next, `strings.xml`, `.strings`, or `.xcstrings`.
2. Find hardcoded user-facing strings. Run `node <skill-dir>/scripts/scan.mjs <app-dir>`. Move each hit into the catalog under a key that names the intent (`billing.stopRenewal`, not `cancel2`). Leave logs, test names, and analytics events alone.
3. Walk every source string. Decide the intent from the screen and the control. A key named `cancel` is not an intent. Open the widget if the key is ambiguous.
4. Look up contested intents, especially account, billing, and permission actions. Reuse a matching `source-attested` phrase. Otherwise write a draft and label it.
5. Create the target file. Copy keys exactly. Translate values. For plurals, emit the categories [references/checks.md](references/checks.md) lists for that locale, not a copy of the English branches.
6. Register the locale using the platform guide. A file that nothing loads is not an added language.
7. Run the check below. Fix every error. Run it again. Stop when it exits 0.
8. Deliver the report. Do not describe the new language as reviewed.

Worked split, Malay subscription settings:

| Control | Intent | Wording | Evidence |
| --- | --- | --- | --- |
| Dialog button that closes without changes | `dialog.cancel_action` | Batal | source-attested, Android `cancel` |
| Button that stops the next charge and keeps access until the period ends | `billing.stop_renewal` | Hentikan pembaharuan automatik | draft |
| Button that charges the card on this step | `billing.pay_now` | Bayar sekarang | draft |

`Batal` is correct on the dialog and wrong on the subscription. The two drafts are unreviewed suggestions. Say that in the report.

## Audit and fix

1. Detect the stack the same way. Read the source catalog and the locale under audit. Do not rewrite strings that already mean the right thing.
2. Run the check before you edit, so missing keys, placeholder drift, broken ICU, incomplete plurals, length blowups, and unchanged source copies are listed first.
3. Read what remains against [references/signs.md](references/signs.md) and the locale note. A string can pass the check and still be the wrong action, the wrong formality, or a calque.
4. For each problem, keep the key, the current text, the intent, the proposed text, and the evidence label. Apply the edit when the user asked for a fix. A review-only request gets the table and no file changes.
5. Run the check again. The audit is finished when it exits 0 and every change is in the report.

Common audit catches:

- One word used for both `dialog.cancel_action` and `billing.stop_renewal`.
- `{name}` translated, or `%1$s` rewritten as `%s`.
- English `one`/`other` pasted into Arabic or Malay.
- A button whose translation is much longer than the control (`length-blowup`).
- Tamil `அனுமதி` (a noun Android shipped for Allow) used as if it were a verb.
- Hindi `अभी नहीं` (AOSP's skip string, which means "not now") used for `navigation.skip_step`.
- French `Inscription` (a noun devise shipped for Sign up) used where the control should be a verb. If you change it, the replacement is a draft.

## Check until it passes

```sh
node <skill-dir>/scripts/check.mjs --source <source-catalog> --target <target-catalog> --locale <tag> --source-locale <source-tag>
node <skill-dir>/scripts/scan.mjs <app-dir>
```

`check.mjs` has no dependencies. It reads ARB, JSON, i18next (including `{{name}}` and `_one`/`_other` keys), Android `strings.xml` including `<plurals>`, iOS `.strings`, and `.xcstrings`. Exit 0 means no errors. Warnings still print. Exit 1 means at least one error. Fix the catalog, then run the same command again. Do not edit the script to hide a finding.

`examples/flutter` and `examples/android` are clean fixtures and must pass. `examples/buggy` is an Arabic catalog seeded with a renamed placeholder, a `{{name}}` turned into `{name}`, a dropped `%1$s`, an unclosed plural, Arabic categories missing, a missing key, an extra key, an unchanged "Cancel", and a length blowup. Use it to see the codes. The codes and the CLDR rule are in [references/checks.md](references/checks.md).

On `.xcstrings`, pass the same file as both `--source` and `--target`. The source locale and `--locale` select the columns.

## Read it as a native speaker

Do this after the first draft and before the report. The check script cannot hear a calque.

1. Open the locale note and [references/signs.md](references/signs.md). Walk every new or changed string, out loud if you can.
2. Ask, for each one: would a native speaker of this locale tap this on this screen, or does it sound translated from English? Rewrite the ones that sound translated. The rewrite is still a `draft` unless a source-attested line already says it.
3. Check the button shape the note requires. Tamil buttons are short verbs, not English nouns. German buttons are infinitives (`Speichern`), not `Sie speichern`. Japanese buttons are `保存` or `ダウンロード`, not `保存します`. Chinese uses `您` or `你` for the whole file, never both. Arabic stays MSA, uses `،` and `؟`, and does not use English title case.
4. Check gender and number. Arabic and Hindi agree with the person the product addresses. Do not leave a masculine verb if the string speaks to a mixed audience and the locale note says to avoid it.
5. Check length on the real control. A German or Tamil line that is correct and three times the English still fails if the button clips it. Shorten the draft.
6. Read the string next to its neighbors. One file, one register. If sign-in says `vous` and the new error says `tu`, fix the new string.
7. If `check.mjs` reports `length-blowup`, do not stop. Shorten the button without collapsing it into the dialog word. When the body already says what happens ("access continues until {date}"), the button can be the short verb. Record the shorter line. If it still cannot fit, say in the report that the control must grow, and do not switch to Cancel/Abbrechen/إلغاء/取消/キャンセル/Batal/ரத்துசெய்/रद्द करें.

## Audit checklist

On an audit, check every locale for these even when the string is grammatical:

- The subscription or renewal control uses the same word as dialog Cancel.
- Arabic download is `تحميل` (that is upload or loading). Download is `تنزيل`.
- Chinese filters say `过滤器`. UI says `筛选` or `篩選`.
- Tamil archive is `காப்பிடு` (that means copy).
- Hindi skip or deny is `अभी नहीं` (that means not now).
- German has `Sie` glued to an infinitive (`Herunterladen Sie`) or `du` next to `Sie`.
- Japanese buttons end in `します` or `してください`.
- One Chinese sentence uses both `您` and `你`.
- A Malay file uses Indonesian `Unduh`, `Hapus`, or `Mendaftar`.
- A placeholder was translated or dropped (`{name}`, `{amount}`, `%1$s`, `{{name}}`).
- A whole English sentence is still in a non-English file, and it is not a brand.

## Report

End every add and every audit with this table:

| Key | Intent | Current | Proposed | Evidence |
| --- | --- | --- | --- | --- |
| `subscription.cancel` | `billing.stop_renewal` | Batal | Hentikan pembaharuan automatik | draft |
| `dialog.cancel` | `dialog.cancel_action` | Batal | Batal | source-attested |

Then, in a few lines: check errors still open, locales registered, files changed, and the formality you committed to. One sentence must say that nothing in the table is a native-speaker review.

## Placeholders

Copy the token. Change only the words around it.

| Source | Wrong | Why it fails |
| --- | --- | --- |
| `Pay {amount}` | `ادفع {المبلغ}` | The placeholder name changed. |
| `Hello, {{name}}` | `مرحبا {name}` | i18next braces became ICU braces. |
| `Pay %1$s` | `ادفع` | The argument disappeared. |
| `{count, plural, one {# item} other {# items}}` | `{count, plural, one {# عنصر}` | The plural is not closed and `other` is gone. |

`#` inside a plural is the number. Leave it. Rich-text tags such as `<b>` and `</b>` stay, in the same order. A link label may be translated. The URL may not, unless the product has a localized URL and the glossary says to use it.

## Plurals

Ask the check, or `Intl.PluralRules`, which categories the locale needs. Then write those branches.

- English, Tamil, Hindi, German, Spanish: `one`, `other`.
- Malay, Indonesian, Japanese, Chinese: `other` only. An English `one` branch copied into Malay is unused, and a Malay file that only has `other` is complete.
- Arabic: `zero`, `one`, `two`, `few`, `many`, `other`. `one` and `other` alone are an error.
- French also has `many` for very large numbers. Include it when the message is a real plural.

Android uses `<plurals>` and `quantity`. i18next v4 uses `items_one` and `items_other`, or a nested `{ "one": "", "other": "" }`. Flutter and iOS string catalogs usually use ICU inside one string. Follow the file you are editing. Do not invent a second plural style in the same catalog.

## Evidence

`lookup.mjs` prints JSON. Read these fields of `wording` first, then each entry's `text`, `role`, `status`, `preferred`, `note`, and `source`.

| Field | Values | Meaning |
| --- | --- | --- |
| `status` | `source-attested`, `draft`, `mixed`, `uncovered` | `mixed` means the hits disagree: different texts, attested and draft together, or at least one entry marked `preferred: false`. |
| `disagreement` | `true` / `false` | `true` whenever `status` is `mixed`. Do not pick the first entry. Work through the table below. |
| `preferred` | an entry or `null` | The entry the catalog recommends for this locale and intent. It can be a `draft`. |
| entry `preferred` | `true`, `false`, or absent | `false` means a reviewer of this catalog rejected that line for this intent. Its `note` says why and usually names the better word. |

Decide in this order. Stop at the first row that applies.

| Lookup result | What you do | Evidence label in the report |
| --- | --- | --- |
| An entry has `preferred: false` | Never reuse it, even if it is `source-attested`. Skip it in every row below. | Mention it as rejected only if the current catalog already uses it. |
| `wording.preferred` is set, and its meaning and role fit the control | Use it. | The entry's own status: `source-attested` or `draft`. A preferred draft stays `draft`. |
| `wording.preferred` is set, but the control is a different role or meaning | Do not force it. Treat the lookup as `uncovered` for this control. | `draft` |
| `status` is `source-attested` and every usable entry has the same text | Use it when the role matches. Reuse is still subject to the locale note. A noun shipped as a button stays a noun. | `source-attested`, naming the source id from [references/sources.md](references/sources.md) |
| `status` is `draft` | A starting point. Keep it or rewrite it. | `draft` |
| `status` is `mixed`, nothing is preferred, and two or more usable entries remain | Open the screen and decide what the control does. Choose the candidate whose meaning fits, or write a better one. | `draft`, with both candidates and the reason in the report (`mixed: Hapuskan / Buang, chose Buang because ...`) |
| `status` is `mixed` and only rejected entries remain | Use the replacement the rejected entry's `note` names, or write one. | `draft` |
| `status` is `uncovered` | Write the smallest accurate phrase. Point at the intent id so a reviewer can see what you aimed at. | `draft` |

Length variants of one meaning are not a conflict. `Keine Ergebnisse` and `Es wurden keine Ergebnisse gefunden.` both mean no results. Pick the one that fits the control and keep the attested label.

Worked example, Tamil sign-in. `lookup.mjs ta auth.sign_in button` returns `status: mixed`. Django's `உள்ளே போ` is `source-attested` and `preferred: false`, because it means "go inside". `wording.preferred` is the draft `உள்நுழை`. The button gets `உள்நுழை`, labelled `draft`. It is not labelled `source-attested`, because the attested line was rejected.

Account, billing, and permission strings are where a wrong action costs the user money or access. Prefer a short draft you can explain over a fluent sentence that blurs "stop renewal", "cancel this payment", and "close the dialog".

Screens that mirror in Arabic, Hebrew, Persian, Urdu, or other RTL locales still follow the placeholder and plural rules. Layout rules for those screens are in [references/rtl.md](references/rtl.md). Apply them in the same change as the strings when you are adding that language, not as a later pass that nobody runs.

## Never

- Do not claim a native speaker, a linguist, or the upstream project approved this app's wording.
- Do not reuse one translation of Cancel, Save, or Remove for every intent that uses that English word.
- Do not translate the inside of a placeholder, and do not concatenate fragments to make a plural.
- Do not copy Hindi AOSP `skip_button_label` onto a skip action, and do not describe Tamil AOSP `allow` as a verb.
- Do not reuse an entry marked `preferred: false` because it is `source-attested`. The rejection wins.
- Do not promote a draft to `source-attested` because it sounds familiar or because a similar language uses it. Indonesian `Mendaftar` is not Malay `Daftar`. Simplified Chinese is not Traditional Chinese.
