# NativeSkill

**Give coding agents the context to choose the right words for your app.**

NativeSkill helps Codex, Cursor, and Claude Code add languages and audit existing translations in web and mobile apps. It guides the agent from an English UI string to the screen, action, and locale-specific references that explain how to translate it.

For example, **Cancel** can close a dialog, cancel a payment, or stop a subscription renewal. Those are three different actions. NativeSkill helps the agent understand which action the label represents before it edits the translation.

## Install the skill

This repository is private. With repository access, clone it to your machine, then run the skill installer from the app you want to localize. Node.js 22.20 or later is required for the installer and CLI.

```sh
gh repo clone Kamaleshkabeerdoss/nativeskill /path/to/nativeskill
cd /path/to/your-app
npx skills add /path/to/nativeskill --skill nativeskill
```

Select your coding agent when prompted. You can also copy the entire [skill folder](skills/nativeskill/) to your agent's skill directory.

**Add languages**

> Use NativeSkill to add Tamil, Malay, and Arabic from our English catalog. Follow our existing i18n setup and flag wording that needs review.

**Audit existing translations**

> Use NativeSkill to review Malay checkout. For each issue, show the key, the current wording, the intended action, and your proposed correction.

## Language coverage

The [registry](skills/nativeskill/assets/registry.json) covers **110 languages and 449 regional profiles**. Each language pack links to at least one dictionary or terminology source. The [50 UI concepts](skills/nativeskill/assets/concepts.json) describe the product behavior and facts the translation needs to preserve.

The packs are at **Foundation** status. They provide script, direction, plural metadata, and scoped references. Verified wording requires native review for the specific locale and usage.

## Optional CLI

From the NativeSkill checkout:

```sh
npm ci
node packages/cli/src/cli.mjs locales list
node packages/cli/src/cli.mjs inspect --locale ta-MY --concept billing.stop_renewal
npm test
```

The CLI checks JSON and static JS or TS catalogs for missing keys, placeholder changes, ICU syntax, and rich-text tag mismatches. The coding agent reviews meaning using the app's context.

To test the CLI as a package, run `npm pack` in the NativeSkill checkout, then install the resulting tarball in your app:

```sh
npm install --save-dev /path/to/nativeskill/nativeskill-cli-0.1.0.tgz
npx nativeskill validate --source locales/en.json --target locales/ta-MY.json --locale ta-MY
```

The npm registry release is pending. The skill and the bundled CLI data work locally after installation.

## Maintainer and license

Maintained by [Kamalesh Kabeerdoss](https://github.com/Kamaleshkabeerdoss). Original NativeSkill materials use the [MIT License](LICENSE). Bundled Unicode data and linked dictionaries are covered in the [data notices](skills/nativeskill/THIRD_PARTY_NOTICES.md).

See [CONTRIBUTING.md](CONTRIBUTING.md) for locale updates, sources, and wording review.
