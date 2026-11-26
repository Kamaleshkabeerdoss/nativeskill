# Arabic (`ar`)

Arabic script, right to left. Cardinal plurals are `zero`, `one`, `two`, `few`, `many`, `other`. Layout rules are in [rtl.md](../rtl.md). Read them in the same change as the strings.

## Register

Write Modern Standard Arabic for a product that is not already in a dialect. Do not mix Egyptian or Gulf verbs into an MSA file, and do not "simplify" MSA into dialect to sound friendly. Friendliness in MSA is shorter sentences, not `عايز` or `تبي`.

Address the user in the second person. Pick masculine, feminine, or a plural `كم` and keep it for the whole locale. A mixed audience that the product does not gender should avoid a verb that only agrees with one gender when a nominal button works (`حفظ`, `إلغاء`, `تنزيل`). If you do use a gendered verb, say which person you chose in the report.

## Buttons

Arabic buttons are often a verbal noun (masdar), not an English sentence.

| Control | Natural | Translated-sounding |
| --- | --- | --- |
| Sign up | التسجيل or تسجيل (both attested) | قم بإنشاء حساب جديد الآن |
| Back | رجوع (attested) | العودة إلى الخلف |
| Download | تنزيل (draft) | تحميل |
| Stop renewal | إيقاف التجديد التلقائي (draft) | إلغاء |
| Allow | السماح (attested noun) | نعم |

`تحميل` in many interfaces means upload or "loading", not download. Use `تنزيل` for a file coming to the device. `إلغاء` is the dialog cancel (OOUI ships it). It does not mean "stop the subscription".

## Plurals you must actually write

Test 0, 1, 2, 3, 11, and 100. `one` and `other` alone are a failed catalog.

- 0 → `zero`
- 1 → `one`
- 2 → `two`
- 3–10 → `few`
- 11–99 → `many`
- 100 and the rest → `other`

The noun changes shape. Do not paste the singular noun into every branch.

## Machine-translation tells

- English title case or a capitalized product verb in the middle of Arabic → Arabic has no title case.
- `,` and `?` inside an Arabic sentence → `،` and `؟`.
- `تم بنجاح` ("was done successfully") on every confirmation → say the outcome once, in the body, not on the button.
- A literal `هل أنت متأكد أنك تريد أن` in front of every destructive button → the button is `حذف نهائي`. The confirmation title can ask. The button cannot be the whole question.
- Leaving `Cancel`, `OK`, or `Save` in Latin on an Arabic screen.
- Translating a brand or an email address.

## Numbers and dates

Pick one digit set for the screen, Western (`3`) or Arabic-Indic (`٣`). Do not mix them. Isolate order ids, emails, and `{amount}` so the bidi algorithm does not drag the punctuation. Format currency with the locale (`ar-EG`, `ar-SA`, or the tag you were given). Egyptian and Gulf currency are not interchangeable. Do not write `$` into an Arabic string.

Quotes: `«...»` or `"..."` matching the app. New strings follow the file, not a new style.
