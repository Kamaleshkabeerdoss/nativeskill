# Tamil, Arabic, and German

Northwind is never translated. It stays `Northwind` in `appTitle` and inside `cameraBody`.

`dialogCancel` only closes the discard dialog. `stopRenewal` stops future charges and keeps access until `{date}`. English uses Cancel for both, so the translations are deliberately different:

| Locale | dialogCancel | stopRenewal | endNow |
| --- | --- | --- | --- |
| ta | ரத்துசெய் | புதுப்பிப்பை நிறுத்து | சந்தாவை இப்போதே முடி |
| ar | إلغاء | إيقاف التجديد | إنهاء الاشتراك الآن |
| de | Abbrechen | Kündigen | Abonnement jetzt beenden |

`endNow` ends access today. None of the three languages mention a refund.

`payNow` is the charge happening now (`{amount} செலுத்து`, `ادفع {amount}`, `{amount} bezahlen`). `savings` is the discount badge (`தள்ளுபடி {amount}`, `وفّر {amount}`, `Spare {amount}`), not the Save button (`சேமி`, `حفظ`, `Speichern`).

`allowCamera` / `denyCamera` are the camera permission prompt: அனுமதி / அனுமதிக்க வேண்டாம், السماح / عدم السماح, Zulassen / Nicht zulassen.

German address is formal Sie. Arabic receipt counts use zero, one, two, few, many, and other. Tamil and German use one and other. Placeholder names `{name}`, `{date}`, `{amount}`, and `{count}` match the English catalog. Metadata keys other than `@@locale` are omitted because they already live on the template.

`main.dart` keeps English and registers `ta`, `ar`, and `de`. The app bar menu switches among English, தமிழ், العربية, and Deutsch. `GlobalWidgetsLocalizations` sets Arabic to right-to-left. Horizontal padding uses `EdgeInsetsDirectional` start/end, the column aligns to `CrossAxisAlignment.start`, and the app bar uses `BackButton`, whose arrow follows text direction. The subscription title and the stop-renewal button on that screen use the same wording as the catalogs.
