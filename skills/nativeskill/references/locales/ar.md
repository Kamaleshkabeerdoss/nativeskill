# Arabic (`ar`)

Arabic script, right to left. Cardinal plurals are `zero`, `one`, `two`, `few`, `many`, and `other`. A catalog with only `one` and `other` is incomplete. Read [rtl.md](../rtl.md) before editing layout.

## Voice

Write Modern Standard Arabic unless the product is already in a dialect. Do not mix dialect and MSA in one locale. devise ships `التسجيل` and Telegram ships `تسجيل` for sign up. Both are source-attested nouns for `auth.create_account`. A verb such as "create an account" would be a draft. Telegram ships `تغيير كلمة المرور` for change password and `إعادة تعيين كلمة المرور` for reset password, in the revisions this catalog pins.

Android ships `السماح` for Allow and `سماح` on the accessibility dialog, and `رفض` for Deny. The session-expired line from devise is attested and is a full sentence, not a button.

## Billing

There is no source-attested Arabic "stop renewal" in the pinned catalogs. Telegram's Arabic file in that revision does not translate `Cancel Subscription`. The draft is `إيقاف التجديد التلقائي`: stop future renewal, access continues until the paid period ends. Do not use the dialog cancel word for that button, and do not imply the subscription ends today. `الدفع قيد الانتظار` is an unreviewed draft for payment pending.

## Punctuation and digits

Use `،` and `؟` inside Arabic sentences. Keep Latin placeholders (`{amount}`, `%1$s`) and isolate emails, order ids, and brand names so they do not flip the punctuation. Pick one digit set, Western or Arabic-Indic, and use it on the whole screen.
