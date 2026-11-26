# Contributing to NativeSkill

- Keep the launch roster in `scripts/launch-languages.json`. Member tags such as Bokmål, Nynorsk, and Central Kurdish are nested under the user's named language family. They do not change the 110-language count.
- Record locale exceptions in `scripts/extra-locales.json` and dictionary links in `scripts/language-references.json`. Cite an actual source for the requested language or variant. Record the scope when a dictionary covers just one member or regional form. Link to the source unless there is a clear redistribution license for the actual data.
- Regenerate the packs with `npm ci` and `npm run generate:locales`, then run `npm test`. Review the generated changes. Use original app examples in fixtures.
- A proposed wording submission should include the locale and script, concept ID, UI role, original phrase, scope, reference and version or access date. Include native-review evidence and tested examples before marking a wording entry Verified. A reviewer must confirm that the phrase preserves the intended action and works on that type of screen.
