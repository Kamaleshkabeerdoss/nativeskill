# Contributing to NativeSkill

- Keep the launch roster in `scripts/launch-languages.json`. Member tags such as Bokmål, Nynorsk, and Central Kurdish are nested under the user's named language family. They do not change the 110-language count.
- Record locale exceptions in `scripts/extra-locales.json` and dictionary links in `scripts/language-references.json`. Cite an actual source for the requested language or variant. Record the scope when a dictionary covers just one member or regional form. Link to the source unless there is a clear redistribution license for the actual data.
- Regenerate the packs with `npm ci` and `npm run generate:locales`, then run `npm test`. Review the generated changes. Use original app examples in fixtures.
- A proposed wording submission should include the locale and script, concept ID, UI role, original phrase, scope, reference and version or access date. Include native-review evidence and tested examples before marking a wording entry Verified. A reviewer must confirm that the phrase preserves the intended action and works on that type of screen.


## Add source-attested wording

Map a message in `scripts/wording-sources.json` only if its source UI action and role fit the concept. Use the checked-in wording corpus for normal locale generation. To update upstream samples, extract each pinned source archive into a directory named `<repository>-<revision>`. Flutter needs the listed ARB files and its LICENSE. Run `npm run import:wording -- /path/to/extracted-sources`, then `npm run generate:locales` and `npm test`. The importer requires the checked-in locale registry, checks mapped English source labels, skips empty or fuzzy entries, and copies the relevant notices.

Put independently authored drafts in `scripts/wording-drafts.json`. Supply a scope note and a reference link. Keep evidence distinct from native review. A draft is an unreviewed suggestion. Do not mark it source-attested.

Sources with `"manual": true` in `scripts/wording-sources.json` were checked in from pinned upstream files and are preserved when `npm run import:wording` rebuilds the other catalogs. Do not relabel a string when the translation does not preserve the English action. Hindi AOSP `skip_button_label` means "not now", and Hindi Django "This field is required." does not mean a form field, so those pairs are excluded.
