# NativeSkill

**Stop agents translating the word. Make them translate the action.**

NativeSkill is an agent skill for adding a language to an app that already has a UI, and for auditing translations that are already there. A subscription **Cancel** stops renewal or ends access. A dialog **Cancel** closes the dialog. Those are different strings. The skill makes the agent name the action first, then pick wording, then prove the catalog still has the same placeholders and the right plural forms.

It does not claim a native speaker reviewed the result. Every proposed string is `source-attested` (a pinned upstream UI shipped it for that action), `draft` (an unreviewed suggestion), or `uncovered` (no bundled phrase).

## Before and after

Malay subscription settings. The button stops the next charge. Access continues until the period ends.

| | Wording | What the user understands |
| --- | --- | --- |
| Before | Batal | The same word Android uses to dismiss a dialog |
| After | Hentikan pembaharuan automatik | Renewal stops. Evidence: **draft**, not a native review |

The dialog button that abandons an edit stays **Batal**. That one is source-attested. The skill's job is to keep those two apart.

Tamil sign-out is the other kind of hit. `node skills/nativeskill/scripts/lookup.mjs ta auth.sign_out button` returns Django's `வெளியேறு`, status `source-attested`. `lookup.mjs ms-MY billing.stop_renewal button` returns the draft above, not `uncovered`.

## Install

Run this from the app you want to localize with Node.js 22.20 or later. Select Codex, Cursor, Claude Code, or another supported agent when prompted.

```sh
npx skills add Kamaleshkabeerdoss/nativeskill --skill nativeskill
```

## Use it

Add a language:

> Use NativeSkill to add Tamil and Malay from our English catalog. Follow the i18n setup we already have. Label anything you are not sure about as a draft.

Audit:

> Use NativeSkill to audit the Arabic checkout. For each problem, show the key, the current wording, the action it should perform, the proposed wording, and whether that proposal is source-attested or a draft.

The playbook the agent follows is [skills/nativeskill/SKILL.md](skills/nativeskill/SKILL.md). Locale notes, platform steps, and the machine-translation tell list live under `skills/nativeskill/references/`.

## Check a catalog

The skill includes a Node.js catalog checker and a source scanner that run without extra dependencies. The checker supports ARB, JSON, i18next, Android `strings.xml`, iOS `.strings` and `.xcstrings`, and typed TS/JS dictionaries (`export const ms: Dict = {...}` with arrow functions, spreads and section aliases, or one table keyed by locale such as `Record<Locale, Dict>`, with overlays merged by a resolver function), which it parses without running them. It exits 1 when a P1 finding remains or coverage is under 80% (`--fail-on`, `--strict`, `--min-coverage` change that); warnings below the threshold still need reading. Your agent can run both scripts from the installed skill folder. [Check commands and report codes](skills/nativeskill/references/checks.md)

Try them on the examples in this repo:

```sh
node skills/nativeskill/scripts/check.mjs \
  --source skills/nativeskill/examples/flutter/lib/l10n/app_en.arb \
  --target skills/nativeskill/examples/flutter/lib/l10n/app_ms.arb \
  --locale ms --source-locale en

node skills/nativeskill/scripts/check.mjs \
  --source skills/nativeskill/examples/buggy/app_en.arb \
  --target skills/nativeskill/examples/buggy/app_ar.arb \
  --locale ar --source-locale en

node skills/nativeskill/scripts/scan.mjs \
  skills/nativeskill/examples/flutter/lib/main.dart \
  skills/nativeskill/examples/android/res/layout
```

Every report starts with triage counts (P1 broken or missing, P2 wrong meaning or still English, P3 polish) and per-section coverage, and groups repeated warnings. Besides placeholders and plurals it flags machine-translation tells (padded placeholders, zero-width spaces, `(s)` left in), the count after the noun in Malay, Indonesian, Vietnamese, Filipino and Arabic, missing Thai classifiers, hand-rolled English plurals, known wrong senses from the audit checklist, stale strings (`--old-source`) and glossary drift (`--glossary`). Brands and sections that are English on purpose go in a `.nativeskillrc`.

The Flutter and Android examples pass. The buggy Arabic catalog is supposed to fail: renamed placeholder, `{{name}}` turned into `{name}`, dropped `%1$s`, unclosed plural, missing Arabic plural categories, a missing key, an extra key, an unchanged "Cancel", and a length blowup. The scanner reports `Cancel subscription` and `Pay now` and ignores `@string/` references.

## What is bundled

110 languages and 449 regional profiles. Every one has CLDR plural categories and direction. Phrase coverage is narrower. 3,379 source-attested labels are bundled. 2,694 of those come from Wikimedia editor catalogs (OOUI, VisualEditor, the language picker). 685 come from Django, Flutter, Android, and devise-i18n. Drafts fill account, billing, permission, dialog, and form actions for the locales with notes when no compatible catalog had the line. Machine translations known to be wrong are kept as rejected entries so lookups warn about them. Drafts are not attestations. The provenance table is [skills/nativeskill/references/sources.md](skills/nativeskill/references/sources.md).

Third-party strings keep their own licenses. See [skills/nativeskill/references/sources.md](skills/nativeskill/references/sources.md) and [skills/nativeskill/THIRD_PARTY_NOTICES.md](skills/nativeskill/THIRD_PARTY_NOTICES.md). GPL and AGPL catalogs, including Telegram, are not bundled. Original NativeSkill material is [MIT](LICENSE).

Changes by release are in [CHANGELOG.md](CHANGELOG.md).

## Maintainer

[Kamalesh Kabeerdoss](https://github.com/Kamaleshkabeerdoss). Locale updates, sources, and the difference between a draft and an attestation are in [CONTRIBUTING.md](CONTRIBUTING.md).
