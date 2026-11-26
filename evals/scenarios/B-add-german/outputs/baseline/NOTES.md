German (`de`) was added from `locales/en.json` and checked against `ta`, `ar`, `ja`, and `zh`.

- All 17 English keys are present, in the same order, with no extras.
- `appTitle` stays `Northwind` in every shipped locale, so it is unchanged here.
- `{name}`, `{date}`, `{amount}`, and `{count}` are copied byte-exact.
- `dialogCancel` is `Abbrechen` (dialog dismiss). `stopRenewal` is `Verlängerung stoppen` (stop the subscription renewal). Those labels differ in Tamil, Arabic, Japanese, and Chinese, and they differ here too.
- `stopRenewalHelp` keeps the “access lasts through {date}” meaning: `Zugriff besteht bis {date}.`
- Receipt copy uses `Quittung` / `Quittungen` (payment receipt, same sense as 領収書 / 收据 / إيصال). German ICU plurals are `one` and `other` only.
- Buttons stay short labels (`Anmelden`, `Speichern`, `Zulassen`, `Nicht zulassen`), not polite sentences.
- `supportedLngs` is `en`, `ta`, `ar`, `ja`, `zh`, `de`. `fallbackLng` remains `en`.
- Existing files under `locales/` and the scenario `i18n.js` were not modified.
