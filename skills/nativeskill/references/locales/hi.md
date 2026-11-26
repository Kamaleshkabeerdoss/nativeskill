# Hindi (`hi`)

Devanagari, left to right. Cardinal plurals are `one` and `other`. Address the user as `आप`. `तू` and `तुम` do not belong in product UI unless the entire app is already that intimate, which it almost never is.

## Buttons

The polite imperative or a short compound. Do not translate "please" as `कृपया` on every control.

| Control | Natural | Why the other one fails |
| --- | --- | --- |
| Allow | अनुमति दें (Android, attested) | A bare English `Allow` |
| Deny on the generic string | अस्वीकारें (attested) | |
| Deny on the accessibility prompt | न दें (attested) | Different control, different words. Say which one. |
| Share | शेयर करें (attested loan) | `साझा करें` is a fine draft if the glossary wants it. It is not what Android shipped. |
| Skip | छोड़ें (draft) | Android's skip string is `अभी नहीं`, which means **not now**. Do not use it for `navigation.skip_step`. |
| Download | डाउनलोड करें (draft) | The loan is normal Hindi UI. A rare Sanskrit coinage sounds less native. |
| Stop renewal | स्वतः नवीनीकरण रोकें (draft) | `रद्द करें` is the dialog cancel. |
| Required field | write a draft that says फ़ील्ड or the field's name | Django's Hindi line uses क्षेत्र (region). It is not in the catalog. |

`साइन अप करें` is the attested devise sign-up. It is a loan and it is what that product shipped. If the rest of the file avoids English loans, a draft `खाता बनाएँ` is clearer for "create an account". Say that it is a draft.

## Agreement

`आप` takes plural agreement (`करें`, `सकते हैं`) even for one person. A machine translation that uses `करो` or a singular `है` toward `आप` sounds wrong. Participles that gender (`गया` / `गई`) should not assume a male user. Prefer a form that does not gender the user (`हो गया` for the thing, not the person) when the product does not know.

## Punctuation, numbers, dates

Hindi sentences use `।` as the full stop in prose. Product UI often uses `.` when the file already does. Match the file. Do not put `।` on a button.

Digits are Western (`3`) in almost every app. Devanagari digits (`३`) only if the product already uses them everywhere.

Dates: `4 मार्च 2026` from `hi-IN`, not `03/04/2026`. Rupees are `₹` from the currency formatter. `{amount}` stays in Latin braces.

The attested format error `अमान्य फ़ॉर्मैट` uses the English loan "format". That is what Material shipped. A draft `अमान्य प्रारूप` is acceptable only if you mark it a draft and the file is avoiding loans.

## Length

Hindi polite imperatives are one word longer than English (`सहेजें`, `हटाएँ`). That is normal. A relative clause on the button is not. Put the explanation in the body.
