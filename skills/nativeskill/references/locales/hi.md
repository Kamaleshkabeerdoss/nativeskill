# Hindi (`hi`)

Devanagari, left to right. Cardinal plurals are `one` and `other`. Address the user as `आप`, not `तू`, unless the app already uses the intimate form everywhere.

## Voice

Android ships `अनुमति दें` for Allow. Deny is `अस्वीकारें` on the generic string and `न दें` on the accessibility dialog. Both denies are source-attested. Share is the loanword `शेयर करें`, which Android shipped. A glossary that wants `साझा करें` is a draft, not a correction of the attestation.

devise ships `साइन अप करें` for sign up. It is a loanword and it is attested. The session-expired line is also attested. Read it. It says the time ended and asks the user to sign in again.

## Traps

- Android `skip_button_label` is `अभी नहीं`, which means "not now", not "skip this step". It is not in the catalog for `navigation.skip_step`. The draft for skip is `छोड़ें`, and it stays a draft.
- Django's Hindi for "This field is required." uses `क्षेत्र` (region) and does not mean a form field. It is excluded from the catalog. Write `form.required_field` as a draft that names the field.
- There is no source-attested change-password or stop-renewal. Drafts: `पासवर्ड बदलें` for the signed-in change, and `स्वतः नवीनीकरण रोकें` for stopping future renewal without ending access today. `अभी भुगतान करें` is the unreviewed pay-now draft.

## Format

Use Western digits unless the product already uses Devanagari digits. Format rupee amounts with the locale currency formatter when the charge is in INR. Do not put `Rs` and `₹` in the same flow.
