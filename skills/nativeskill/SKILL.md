---
name: nativeskill
license: MIT
description: Add or audit localized UI copy in existing web and mobile apps. Use for translation, i18n catalogs, locale additions, wording corrections, and RTL review. Infer intent from the UI behavior, consult the target locale's references, and preserve the app's product facts.
---

# NativeSkill

1. Identify the English source keys, target locale tags, existing i18n stack, and approved project glossary. Follow each ambiguous key to its screen, neighboring text, and action or state. Ask for context if multiple meanings still fit.
2. Match intent to [UI concepts](assets/concepts.json). Read only the requested packs via [the locale registry](assets/registry.json). Use applicable project terms and scoped pack evidence. Verify dictionary wording in context. A dictionary reference is evidence for lookup. Native review applies only to wording expressly marked as reviewed.
3. For new locales, follow the app's catalog and registration patterns. For an audit, propose targeted edits and give the key, file, current wording, intended meaning, proposed wording, and reason. Apply edits when the user requests them. Mark uncertain wording for review.
4. Preserve variables, plurals, links, accessibility labels, and facts such as dates, permissions, charges, and reversibility. Verify affected screens when possible. For right-to-left scripts and mixed-direction text, use [the RTL checks](references/rtl.md).

If the CLI is available, use `nativeskill inspect --locale <tag> --concept <id> --json` and `nativeskill validate --source <file> --target <file> --locale <tag>`. Otherwise use the bundled data and the project's own checks. Validation covers structure. Meaning requires UI context and language evidence.
