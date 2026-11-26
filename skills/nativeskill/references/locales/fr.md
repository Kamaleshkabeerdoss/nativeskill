# French (`fr`)

Left to right. Cardinal plurals are `one`, `many`, and `other`. `many` matters for very large numbers. Include it on real plurals. Do not stop at the English pair.

## Voice

`vous` is the default for account, billing, and permission copy. Use `tu` only when the product already uses it everywhere. Do not mix them in one locale.

devise ships `Inscription` for sign up. That is a noun. It is source-attested for `auth.create_account`. If the control is a verb button, `S'inscrire` or `Créer un compte` is a draft, and the report should say the attested word was a noun. Android ships `Autoriser` for Allow and `Refuser` for Deny.

## Spacing

In France, put a narrow no-break space before `:` `;` `!` `?` inside body text. Canada (`fr-CA`) does not use that space the same way. Match the tag. Buttons usually have no colon.

## Format

`1 234,56 €` is the usual fr-FR shape and comes from the formatter. `fr-CA` uses a different currency symbol and grouping. Do not format a Canadian price with the French Euro pattern.
