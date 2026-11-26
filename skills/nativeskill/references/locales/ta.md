# Tamil (`ta`)

Tamil script, left to right. Cardinal plurals are `one` and `other`. Apps in this catalog use Western digits unless the product already uses Tamil digits. Do not mix the two in one screen.

## Voice

Buttons are short and verb-final. Django ships `வெளியேறு` for Log out (`auth.sign_out`) and Android ships `பகிர்` for Share, `சமர்ப்பி` for Submit, and `ஏற்றுகிறது...` for Loading. Prefer that length. Do not add "please kindly" around them.

## Traps in the bundled data

- Android `allow` is `அனுமதி`. That is a noun, "permission", not a verb meaning "allow". It is source-attested for `permissions.allow_access` because Android shipped it. If the control is a button that grants access, say you are reusing a noun, or write a verb as a `draft`. Do not call the noun a verb.
- Android `skip_button_label` is `தவிர்`, a clipped verb. It is attested for `navigation.skip_step`. It is not "cancel".
- There is no source-attested Sign up, Change password, or Stop renewal. The drafts are `கணக்கை உருவாக்கு`, `கடவுச்சொல்லை மாற்று`, and `தானியங்கி புதுப்பிப்பை நிறுத்து`. They are unreviewed. Stop-renewal is not the dialog word and not "end access today".
- Dialog Cancel in Android is `ரத்துசெய்` (`dialog.cancel_action`). Keep it off the subscription button.
- Django's "This field is required." is attested as `இந்த  புலத்தில் மதிப்பு தேவை` (`form.required_field`). The double space is in the upstream file. You may tidy it only if you relabel the result `draft`.

## Format

Keep `{name}` and `%1$s` in Latin as they appear. Tamil letters do not belong inside the placeholder. Format currency with the locale. `₹` is the rupee sign when the charge is in rupees. Do not invent a different currency.
