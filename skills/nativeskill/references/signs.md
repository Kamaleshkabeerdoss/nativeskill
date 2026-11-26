# Signs of translation slop

Go through the locale you are editing and note each sign with the key it lives on. The left side is the tell. The right side is the fix. A hit is a draft until a source-attested phrase for that intent says otherwise.

## The wrong action

- One translation of Cancel on a dialog, a payment, and a subscription → split `dialog.cancel_action`, `billing.cancel_payment`, and `billing.stop_renewal`. Stop-renewal keeps access until the period ends. End-now does not. The dialog abandons the dialog.
- "Remove" used both for taking a row off a list and for deleting the record → `item.remove_from_list` leaves the record. `item.delete` and `item.delete_permanently` do not.
- "Save" on a draft, a settings form, and a discount → `form.save_draft` stays unpublished. `form.save_changes` stores the edit. `billing.discount_savings` is money off a price.
- Sign out worded like account deletion → `auth.sign_out` ends the session and keeps the account.
- "Forgot password" worded as if the password already changed → `auth.reset_password` matches the step. Sending a link is not the success state.
- A permission Allow worded like a generic OK → `permissions.allow_access` names the grant. `permissions.deny_access` declines it.

## Placeholders and grammar

- `{amount}` renamed, translated, or dropped → put the original token back
- `{{name}}` rewritten as `{name}`, or `%1$s` rewritten as `%s` → restore the brace style and the index
- "You have " + count + " items" built in code → one plural message with the locale's CLDR categories
- English `one` / `other` pasted into Arabic, or Arabic's six forms pasted into Malay → use that locale's categories only
- A plural with no `other`, or an unclosed `{count, plural, ...` → close it and include `other`
- Tags such as `<b>` or `<link>` reordered or translated → keep the tags, translate the words inside them

## Machine-translation voice

- "Successfully" on every button, as in "Successfully save the changes" → the button is the action: Save, Pay, Stop renewal
- Calques that follow English word order and mean nothing as a label → a short label a person would tap
- Title Case On Every Malay, Arabic, or Hindi Word → the target language's own casing. Malay and Arabic do not use English title case.
- Exclamation marks on errors and buttons → a plain statement
- "Please kindly be informed that your session has been expired" → the session ended, and the next step is to sign in again (`auth.session_expired`)
- A noun where the control is a verb. Tamil Android ships `அனுமதி` for Allow, and that word is a noun. French devise ships `Inscription` for Sign up, and that word is a noun. If the control needs a verb, write a draft and say why. Do not call the noun a verb.
- Hindi Android `skip_button_label` is `अभी नहीं` ("not now"). Using it for `navigation.skip_step` changes the action. The skip draft is `छोड़ें`, and it stays a draft.
- Malay Android `deny` is `Nafi`, which sounds legal. The accessibility dialog ships `Tolak` for the same decline. Prefer `Tolak` on a prompt button. Both are source-attested. Say which one you used.
- Indonesian wording copied into Malay, or the reverse. `Mendaftar` is the Indonesian devise string. `Daftar` is the Malay one. `Log masuk` / `Log keluar` are the Malay Django pair.
- Simplified Chinese copied into a Traditional locale, or the reverse (`允许` versus `允許`, `软件` versus `軟體`)

## Formality, names, and format

- `tu` and `vous`, `du` and `Sie`, or `तू` and `आप` in the same language → pick the formality the app already uses and apply it to every new string
- A brand, the company legal name, or a product code translated → leave it as the glossary spells it
- `$12` and `03/04/2026` typed into the string → locale number, currency, and date formatters, with the unit outside the translated sentence only when the API inserts it
- Western digits in one paragraph and native digits in the next → one digit set for the locale
- Arabic comma and question mark left as `,` and `?` inside Arabic sentences → `،` and `؟`

## Layout that makes good words look wrong

- An Arabic or Hebrew string in a left-aligned button, or a back chevron that still points left → [rtl.md](rtl.md)
- A translation that is three times the English and no longer fits the button → shorten the draft, or give the control room, and keep the `length-blowup` warning until it fits
- A font that only covers Latin applied to Tamil, Arabic, Hindi, or Chinese → a font that has the script, usually the platform default
