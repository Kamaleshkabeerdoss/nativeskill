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

The skill folder is `skills/nativeskill`. Node.js 22.20 or later.

**Cursor, Claude Code, Codex, and other agents that use the skills CLI**

```sh
npx skills add Kamaleshkabeerdoss/nativeskill --skill nativeskill
```

**Claude Code plugin**

```text
/plugin marketplace add Kamaleshkabeerdoss/nativeskill
/plugin install nativeskill@nativeskill
```

The marketplace manifest is `.claude-plugin/marketplace.json`.

**Codex**

`.codex-plugin/plugin.json` points at `skills/`. Install the repo as a Codex plugin, or use the same `npx skills add` command.

You can also copy `skills/nativeskill/` into the agent's skills directory.

## Use it

Add a language:

> Use NativeSkill to add Tamil and Malay from our English catalog. Follow the i18n setup we already have. Label anything you are not sure about as a draft.

Audit:

> Use NativeSkill to audit the Arabic checkout. For each problem, show the key, the current wording, the action it should perform, the proposed wording, and whether that proposal is source-attested or a draft.

The playbook the agent follows is [skills/nativeskill/SKILL.md](skills/nativeskill/SKILL.md). Locale notes, platform steps, and the machine-translation tell list live under `skills/nativeskill/references/`.

## Check a catalog

From this repo:

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

The Flutter and Android examples pass. The buggy Arabic catalog is supposed to fail: renamed placeholder, `{{name}}` turned into `{name}`, dropped `%1$s`, unclosed plural, missing Arabic plural categories, a missing key, an extra key, an unchanged "Cancel", and a length blowup. The scanner reports `Cancel subscription` and `Pay now` and ignores `@string/` references.

After install, the same commands use `<skill-dir>/scripts/check.mjs`. Formats: ARB, JSON, i18next, Android `strings.xml`, iOS `.strings`, and `.xcstrings`. No npm packages are required for the scripts.

`npm test` in this repo runs the catalog tests and the skill script tests.

## What is bundled

110 languages and 449 regional profiles, with CLDR plural categories and direction. 3,333 source-attested UI labels from pinned revisions of OOUI, VisualEditor, Universal Language Selector, Django, Flutter, Android framework strings, devise-i18n, and Telegram for Android. Drafts cover the account and billing actions those catalogs do not, for Tamil, Malay, Arabic, and Hindi first. Drafts are not attestations.

Third-party strings keep their own licenses. See [skills/nativeskill/THIRD_PARTY_NOTICES.md](skills/nativeskill/THIRD_PARTY_NOTICES.md). Telegram labels are GPL-2.0-only and are not relicensed as MIT. Original NativeSkill material is [MIT](LICENSE).

## Maintainer

[Kamalesh Kabeerdoss](https://github.com/Kamaleshkabeerdoss). Locale updates, sources, and the difference between a draft and an attestation are in [CONTRIBUTING.md](CONTRIBUTING.md).
