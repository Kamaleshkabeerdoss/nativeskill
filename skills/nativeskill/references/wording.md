# Wording evidence

- **Source-attested** means a named upstream project shipped the label in a comparable context. Read the cited source when the role or context differs. It is evidence of usage in that project.
- **Draft** is a NativeSkill suggestion for review. A reference attached to a draft can establish the meaning without attesting to the exact proposed phrase.
- **Uncovered** means there is no matching entry for the locale, concept, and role requested. Check the app's glossary, consult a credible reference if available, and label the proposed wording as a draft.
- **Mixed** is a lookup result, not a label. The hits disagree, or one of them is marked `preferred: false`. Never reuse a `preferred: false` line, even a source-attested one. Use `wording.preferred` when its meaning and role fit. Otherwise decide from the control and label the result `draft`. The decision table is in [SKILL.md](../SKILL.md#evidence).
- **Preferred** (`preferred: true`) is the line this catalog recommends for the intent. A preferred draft is still a `draft`.
- A language-and-script match can supply a useful candidate for a regional locale. Keep country-specific claims and script variants separate. Native review is specific to the app copy, locale, and context.

The license and revision of every source is in [sources.md](sources.md). A draft note means the phrase was not taken from those files. Telegram strings are not in the catalog.

## Examples

- A search field's **Clear text** tooltip can use `form.clear_input` with role `tooltip`. A button that clears an attachment selection uses `file.clear_selection`. A command that deletes a record is a different concept.
- For a Tamil **Sign out** button, `auth.sign_out button` returns Django's Tamil label with a link to the exact catalog. Verify that the button ends the session.
- A CRM **Leads** item names records. For `crm.sales_leads navigation-label`, check the product's definition and glossary. A Tamil entry marked Draft should be reviewed before treating it as approved product terminology.
