---
name: nativeskill
license: MIT
description: Add or audit localized UI copy in existing web and mobile apps. Identify what each action means, look up source-attested wording by locale and UI role, and flag wording that needs review. Use for translation, i18n catalogs, wording corrections, and RTL review.
---

# NativeSkill

1. Identify the source locale, target locale, i18n files, and project glossary. Trace ambiguous keys to the screen and action. Decide the [intent and UI role](assets/concepts.json) before choosing wording.
2. Run `node <skill-dir>/scripts/lookup.mjs <locale> <concept-id> [ui-role]` for contested terms. Without Node, locate the pack through [the registry](assets/registry.json) and read its `wording.entries`. Match locale, script, role, and meaning. Prefer an approved project term when it fits. [Evidence rules and examples](references/wording.md).
3. To add a locale, draft the catalog in the app's existing format and reuse matching evidence. For an audit, report the key, current wording, intended meaning, proposed wording, and evidence status. Apply edits when requested.
4. Preserve placeholders, plurals, links, and product facts. Use the app's validation and preview affected screens. Check [RTL behavior](references/rtl.md) when needed.
