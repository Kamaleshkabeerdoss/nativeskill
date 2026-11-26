# Tamil, Arabic, and German

Flutter ARB. Source catalog `lib/l10n/app_en.arb` (`@@locale` en). These files are the new catalogs and a replacement `main.dart`. `lib/l10n/app_en.arb` and `lib/main.dart` were not edited.

`ta`, `ar`, and `de` are registered on `MaterialApp.supportedLocales` together with English. `GlobalWidgetsLocalizations` is in `localizationsDelegates`, so Arabic takes RTL from the locale `Directionality`. The language switcher sets that locale. The back glyph uses `matchTextDirection: true`. Padding is `EdgeInsetsDirectional`, and the column uses `CrossAxisAlignment.start`. Dates go through `DateFormat.yMMMd` for the active locale. Northwind is untranslated. No Latin `fontFamily`. No bidi controls in the strings.

## Formality

- Tamil: polite product UI. Buttons are short verbs, not the longer `-உம்` form. The password-recovery question uses `நீங்கள்` once. No intimate `நீ`.
- Arabic: Modern Standard Arabic. Buttons and links are verbal nouns, so the file does not address a mixed audience with a masculine or feminine verb. `يستخدم` in the camera sentence agrees with the product, not with the user.
- German: `Sie` in sentences. Buttons are infinitives. No `du`, no `ihr`, and no `Sie` glued onto an infinitive.

## Contested strings

`dialogCancel` closes the discard dialog. `stopRenewal` stops future charges and keeps access until `{date}`. `endNow` ends access today and does not promise a refund. `payNow` charges `{amount}`. `savings` is a discount label. `allowCamera` grants the camera. `archive` keeps the item and is not copy.

| Key | Intent | Current | Proposed | Evidence |
| --- | --- | --- | --- | --- |
| `dialogCancel` (ta) | `dialog.cancel_action` | Cancel | ரத்துசெய் | source-attested, flutter `cancelButtonLabel` |
| `stopRenewal` (ta) | `billing.stop_renewal` | Cancel | தானியங்கி புதுப்பிப்பை நிறுத்து | draft |
| `endNow` (ta) | `billing.end_subscription_now` | End subscription now | சந்தாவை இப்போது முடி | draft |
| `payNow` (ta) | `billing.pay_now` | Pay {amount} | {amount} செலுத்து | draft |
| `savings` (ta) | `billing.discount_savings` | Save {amount} | {amount} சேமிப்பு | draft |
| `allowCamera` (ta) | `permissions.allow_access` | Allow | அனுமதி | source-attested, aosp `allow`. The shipped word is a noun, not a verb. The file does not use the longer `-உம்` form, so it was not rewritten as அனுமதிக்கவும். |
| `archive` (ta) | `item.archive` | Archive | காப்பகப்படுத்து | draft. Android Tamil archive is காப்பிடு, which means copy, and was not used. |
| `dialogCancel` (ar) | `dialog.cancel_action` | Cancel | إلغاء | source-attested, ooui `ooui-dialog-message-reject` |
| `stopRenewal` (ar) | `billing.stop_renewal` | Cancel | إيقاف التجديد التلقائي | draft |
| `endNow` (ar) | `billing.end_subscription_now` | End subscription now | إنهاء الاشتراك الآن | draft |
| `payNow` (ar) | `billing.pay_now` | Pay {amount} | دفع {amount} | draft. Lookup uncovered. |
| `savings` (ar) | `billing.discount_savings` | Save {amount} | توفير {amount} | draft. The catalog line وفّر {amount} is a masculine imperative and was not used. |
| `allowCamera` (ar) | `permissions.allow_access` | Allow | السماح | source-attested, aosp `allow` |
| `archive` (ar) | `item.archive` | Archive | أرشفة | source-attested, aosp-settings `archive` |
| `dialogCancel` (de) | `dialog.cancel_action` | Cancel | Abbrechen | source-attested, ooui `ooui-dialog-message-reject` |
| `stopRenewal` (de) | `billing.stop_renewal` | Cancel | Verlängerung stoppen | draft |
| `endNow` (de) | `billing.end_subscription_now` | End subscription now | Abo jetzt beenden | draft. Lookup uncovered. |
| `payNow` (de) | `billing.pay_now` | Pay {amount} | {amount} zahlen | draft. Lookup uncovered. |
| `savings` (de) | `billing.discount_savings` | Save {amount} | {amount} sparen | draft |
| `allowCamera` (de) | `permissions.allow_access` | Allow | Zulassen | source-attested, aosp `allow` |
| `archive` (de) | `item.archive` | Archive | Archivieren | source-attested, aosp-settings `archive` |

Dialog Cancel and stop-renewal are different in each language: Tamil ரத்துசெய் / தானியங்கி புதுப்பிப்பை நிறுத்து, Arabic إلغاء / إيقاف التجديد التلقائي, German Abbrechen / Verlängerung stoppen.

Nothing in this table is a native-speaker review. A bundled line is evidence that another product shipped those words, or it is an unreviewed draft. It is not a review of this app.

## Other keys

| Key | Intent | Proposed (ta / ar / de) | Evidence |
| --- | --- | --- | --- |
| `appTitle` | brand | Northwind / Northwind / Northwind | glossary. Intentionally the same as English. |
| `signIn` | `auth.sign_in` | உள்ளே போ / تسجيل الدخول / Anmelden | ta source-attested, django-admin. ar draft (django ادخل is a masculine imperative and was not used). de source-attested, django-admin. |
| `createAccount` | `auth.create_account` | கணக்கை உருவாக்கு / التسجيل / Registrieren | ta draft. ar source-attested, devise-i18n. de source-attested, devise-i18n. |
| `signOut` | `auth.sign_out` | வெளியேறு / تسجيل الخروج / Abmelden | source-attested, django-admin |
| `email` | field label | மின்னஞ்சல் / البريد الإلكتروني / E-Mail | draft. Lookup uncovered. |
| `password` | field label | கடவுச்சொல் / كلمة المرور / Passwort | draft. Lookup uncovered. |
| `forgotPassword` | `auth.reset_password` | கடவுச்சொல்லை மறந்துவிட்டீர்களா? / استعادة كلمة المرور / Haben Sie Ihr Passwort vergessen? | ta draft. ar draft (devise نسيت كلمة مرورك؟ is a masculine question and was not used; this link only starts recovery). de source-attested, devise-i18n link. |
| `welcome` | greeting | வணக்கம், {name} / مرحبًا، {name} / Willkommen, {name} | draft. Lookup uncovered. `{name}` unchanged. |
| `dialogTitle` | `form.discard_changes` | சேமிக்காத மாற்றங்களை கைவிடவா? / تجاهل التغييرات غير المحفوظة؟ / Ungespeicherte Änderungen verwerfen? | draft |
| `discardChanges` | `form.discard_changes` | மாற்றங்களை கைவிடு / تجاهل التغييرات / Änderungen verwerfen | draft |
| `save` | `form.save_changes` | சேமிக்க / حفظ / Speichern | ta source-attested, django-admin. ar source-attested, visualeditor-mediawiki (حفظ, not the masculine احفظ). de source-attested, visualeditor-mediawiki. |
| `saveDraft` | `form.save_draft` | வரைவைச் சேமி / حفظ المسودة / Entwurf speichern | draft |
| `renewTitle` | `billing.stop_renewal` | தானியங்கி புதுப்பிப்பை நிறுத்தவா? / إيقاف التجديد التلقائي؟ / Verlängerung stoppen? | draft |
| `renewBody` | `billing.stop_renewal` | அணுகல் {date} வரை தொடரும். இனி கட்டணம் இல்லை. / يستمر الوصول حتى {date}. لا رسوم جديدة. / Sie behalten den Zugriff bis {date}. Es wird nichts mehr berechnet. | draft. `{date}` unchanged. Access continues. No refund. |
| `paymentPending` | `billing.payment_pending` | கட்டணம் நிலுவையில் / الدفع قيد الانتظار / Zahlung ausstehend | ta draft (the catalog line sounded like the payment had failed). ar draft. de draft, lookup uncovered. |
| `cameraTitle` | permission title | கேமரா அணுகல் / الوصول إلى الكاميرا / Kamerazugriff | draft. Lookup uncovered. |
| `cameraBody` | permission body | Northwind கேமராவால் ரசீதுகளை வருடுகிறது. / يستخدم Northwind الكاميرا لمسح الإيصالات ضوئيًا. / Northwind nutzt die Kamera zum Scannen von Belegen. | draft. Lookup uncovered. |
| `denyCamera` | `permissions.deny_access` | நிராகரி / رفض / Ablehnen | source-attested, aosp `deny` |
| `receiptCount` | plural | ta: # ரசீது / # ரசீதுகள். ar: zero لا إيصالات, one إيصال واحد, two إيصالان, few # إيصالات, many # إيصالًا, other # إيصال. de: # Beleg / # Belege. | draft. Lookup uncovered. `{count}` unchanged. |
| `download` | `content.download` | பதிவிறக்கு / تنزيل / Herunterladen | draft. Arabic is تنزيل, not تحميل. |
| `restore` | `item.restore` | மீட்டெடு / استعادة / Wiederherstellen | source-attested, aosp-settings `restore` |
| `deleteForever` | `item.delete_permanently` | நிரந்தரமாக நீக்கு / حذف نهائي / Endgültig löschen | draft |
| `clearFilters` | `search.clear_filters` | வடிகட்டிகளை அழி / مسح عوامل التصفية / Filter löschen | draft |
| `noResults` | `search.no_results` | இந்த வடிகட்டிகளுக்குப் பொருந்தும் ரசீதுகள் இல்லை. / لا توجد إيصالات مطابقة لعوامل التصفية. / Keine Belege passen zu diesen Filtern. | draft. Names receipts and filters. The generic attested "no results" lines were not reused. |
| `back` | `navigation.go_back` | முந்தைய பக்கம் / رجوع / Zurück | ta source-attested, flutter tooltip `backButtonTooltip`. ar source-attested, ooui. de source-attested, ooui. |
| `continueAction` | `navigation.continue` | தொடர் / المتابعة / Fortfahren | ta source-attested, flutter `continueButtonLabel` (not தொடரவும், so the file does not mix in `-உம்`). ar source-attested, flutter (المتابعة, not masculine استمر). de source-attested, ooui. |
| `requiredEmail` | `form.required_field` | மின்னஞ்சல் முகவரியை உள்ளிடு. / عنوان البريد الإلكتروني مطلوب. / Geben Sie eine E-Mail-Adresse ein. | draft. Names the email. The generic attested field errors do not. |
| `invalidEmail` | `form.invalid_format` | தவறான வடிவம். / التنسيق غير صالح. / Ungültiges Format. | source-attested, flutter |
| `language` | language label | மொழி / اللغة / Sprache | draft. Lookup for this label was uncovered. `language.search` is a search field and was not reused. |

## Self-review

Read against the locale notes and the machine-translation signs after the first draft.

- Cancel is not one word. Dialog dismiss, stop-renewal, and end-now each have their own wording. End-now does not mention a refund. Pay, savings, and Save do not share a verb. Archive is not copy, and Allow is not a generic OK.
- Placeholders stayed `{name}`, `{date}`, `{amount}`, and `{count, plural, ...}`. `#` stayed the number. Arabic `receiptCount` has `zero`, `one`, `two`, `few`, `many`, and `other`, and the noun changes shape (إيصال، إيصالان، إيصالات، إيصالًا). Tamil and German use `one` and `other` only.
- Tamil buttons are short verbs. German buttons are infinitives. Arabic buttons are masdars. Arabic sentences use `،` and `؟`. The ASCII commas inside `receiptCount` are ICU syntax.
- No "successfully" on a button, no `Bitte` on a German button, no `تم بنجاح`, no English title case in Arabic, and no `du`.
- Tamil renewal body was rewritten from a long passive to இனி கட்டணம் இல்லை. Tamil payment status was rewritten so it does not sound as if the charge failed. Arabic renewal body was rewritten to drop `يتم` and to say there is no new charge, rather than "no charge after the date".
- `stopRenewal` is longer than English Cancel on purpose. The subscription button is full width, so Verlängerung stoppen and إيقاف التجديد التلقائي fit on that control. The checker still warns (see below) because it compares them with the six-letter source word.

## Check

`node skills/nativeskill/scripts/check.mjs --source evals/scenarios/A-add-ta-ar-de/lib/l10n/app_en.arb --target <catalog> --locale <tag> --source-locale en`

| Catalog | Exit | Errors | Warnings |
| --- | --- | --- | --- |
| `app_ta.arb` | 0 | 0 | `possible-source-copy` on `appTitle` (the brand Northwind) |
| `app_ar.arb` | 0 | 0 | `possible-source-copy` on `appTitle`; `length-blowup` on `stopRenewal` (22 against 6) |
| `app_de.arb` | 0 | 0 | `possible-source-copy` on `appTitle`; `length-blowup` on `stopRenewal` (20 against 6) |

No check errors remain. `scan.mjs` on `main.dart` exits 0. Locales `en`, `ta`, `ar`, and `de` are registered, and the switcher can select each of them. Files written: `app_ta.arb`, `app_ar.arb`, `app_de.arb`, `main.dart`, `NOTES.md`.
