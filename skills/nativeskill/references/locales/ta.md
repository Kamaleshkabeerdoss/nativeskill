# Tamil (`ta`)

Tamil script, left to right. Cardinal plurals are `one` and `other`. Consumer apps use Western digits. Do not mix Tamil digits (`௧`) with Western digits on one screen.

## Who the string talks to

Product UI addresses the user politely, without the intimate pronouns of speech. Do not translate English "you" as `நீ` on a button. The verb usually carries the person. A settings screen can use `நீங்கள்` once in a sentence. Do not stack honorifics (`தயவுசெய்து கனிவுடன்`) the way machine translation stacks "please kindly".

## Buttons

Tamil buttons are short verbs, often the bare stem or a light imperative, not a full sentence and not an English noun.

| Control | Natural | Translated-sounding |
| --- | --- | --- |
| Sign out | வெளியேறு (Django, attested) | வெளியேறுதல் செய்யவும் |
| Share | பகிர் (Android, attested) | பகிர்தல் |
| Save a draft | வரைவைச் சேமி (draft) | வரைவை வெற்றிகரமாக சேமிக்கவும் |
| Download | பதிவிறக்கு (draft) | டவுன்லோட் செய்யவும் |
| Archive | காப்பகப்படுத்து (draft) | காப்பிடு |

`காப்பிடு` is what Android Settings shipped for the archive button in the pinned revision. It means **copy**. Do not use it for `item.archive`. The lookup draft `காப்பகப்படுத்து` is the archive verb, and it stays a draft.

`அனுமதி` (Android Allow) is a **noun**, "permission". It is source-attested. On a button that grants access, either keep it and say in the report that it is a noun, or write a verb draft such as `அனுமதி` is not that verb. A verb draft is `அனுமதிக்கவும்` only if the rest of the file already uses the longer polite `-உம்` form. Do not mix `பகிர்` and `பகிரவும்` in one product.

Dialog cancel that Android ships is `ரத்துசெய்`. That is `dialog.cancel_action`. It is the wrong word for stopping a subscription renewal.

## Machine-translation tells

- `வெற்றிகரமாக` ("successfully") on a button → delete it. The button is the action.
- English word order with `உங்கள்` in every label (`உங்கள் கணக்கை உருவாக்கவும் இங்கே`) → a short verb, `கணக்கை உருவாக்கு`.
- Sanskritized or news-Tamil where the app is everyday UI (`நிராகரிப்பு செய்யப்படுகிறது`) → the spoken UI verb.
- Leaving `Cancel`, `Save`, `OK` in English inside a Tamil screen → translate the action, unless it is a brand.
- Using `காப்பிடு` for archive, or `நீக்கு` for both "remove from list" and "delete forever". Permanent delete is `நிரந்தரமாக நீக்கு` (draft). Remove-from-list stays a different concept.

## Punctuation, quotes, numbers

Tamil sentences use `.` and `?`. Buttons have no period. The attested loading string `ஏற்றுகிறது...` keeps the three dots Android shipped. New drafts do not add a period to a button.

Quotes in body text are usually `"..."` or the Tamil quotation style the app already uses. Do not invent corner quotes.

Dates: `4 மார்ச் 2026` or the locale formatter, not `03/04/2026`. Currency for rupees is `₹` from the formatter (`ta-IN`), not the letters `Rs` glued on. Placeholders stay Latin: `{amount}`, `%1$s`.

## Length

Tamil verbs are short. A clause that repeats the English ("please click here to save your draft changes") will not fit a button and sounds translated. One verb, one object. If the English is "Discard changes", `மாற்றங்களை கைவிடு` is the shape. Do not add the reason on the button. Put the reason in the body, if anywhere.
