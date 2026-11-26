# German (`de`)

Formality is **Sie** for the whole language. The shipped catalogs are not German, so there was no `du` voice to match. No new string uses `du` or informal `ihr`. Buttons are infinitives (`Anmelden`, `Speichern`), not `Sie`-conjugated verbs.

Read before writing: `locales/en.json`, `locales/ta.json`, `locales/ar.json`, `locales/ja.json`, `locales/zh.json`.

## Terms copied from those files

- **Product name.** Copied `Northwind` unchanged. It is the same word in `en.json`, `ta.json`, `ar.json`, `ja.json`, and `zh.json`.
- **Workspace.** Copied the treatment, not a German word: every shipped file translates this label and does not treat it as the product name (`Workspace`, `பணியிடம்`, `مساحة العمل`, `ワークスペース`, `工作区`). German follows that with `Arbeitsbereich`.
- **The two Cancel buttons.** Copied the split. `dialogCancel` and `stopRenewal` are different words in every shipped file (`ரத்துசெய்` / `புதுப்பிப்பை நிறுத்து`, `إلغاء` / `إيقاف التجديد`, `キャンセル` / `自動更新を停止`, `取消` / `停止续订`). German keeps them different: `Abbrechen` and `Verlängerung stoppen`.

## Native-speaker self-review

Read each new string against the German locale note and the machine-translation signs. This pass is not a native-speaker review.

No string was rewritten after the pass. Buttons stay infinitives, nouns stay capitalized, and nothing uses `Bitte`, `Erfolgreich`, title case on every word, or an English `-ing` calque. `language` stays the short label `Sprache`, same shape as `言語` and `语言`, not the language-search placeholder. `stopRenewal` stays `Verlängerung stoppen` even though the check warns about length: dropping `Verlängerung` would make it the same kind of generic stop as dialog cancel.

| Key | Intent | Current | Proposed | Evidence |
| --- | --- | --- | --- | --- |
| `appTitle` | product name | Northwind | Northwind | copied from en, ta, ar, ja, zh |
| `workspace` | workspace label | Workspace | Arbeitsbereich | draft |
| `signIn` | `auth.sign_in` | Sign in | Anmelden | source-attested, django-admin `Log in` |
| `signOut` | `auth.sign_out` | Sign out | Abmelden | source-attested, django-admin `Log out` |
| `createAccount` | `auth.create_account` | Create account | Registrieren | source-attested, devise-i18n `devise.registrations.new.sign_up` |
| `welcome` | welcome | Welcome, {name} | Willkommen, {name} | draft |
| `save` | `form.save_changes` | Save | Speichern | source-attested, visualeditor-mediawiki `visualeditor-dialog-media-save` (not Django `Sichern`) |
| `dialogCancel` | `dialog.cancel_action` | Cancel | Abbrechen | source-attested, ooui `ooui-dialog-message-reject` |
| `stopRenewal` | `billing.stop_renewal` | Cancel | Verlängerung stoppen | draft |
| `stopRenewalHelp` | access until `{date}` | Access continues until {date}. | Der Zugriff gilt bis {date}. | draft |
| `payNow` | `billing.pay_now` | Pay {amount} | {amount} bezahlen | draft |
| `allowCamera` | `permissions.allow_access` | Allow | Zulassen | source-attested, aosp `allow` |
| `denyCamera` | `permissions.deny_access` | Don't allow | Ablehnen | source-attested, aosp `deny` |
| `receiptCount` | receipt plural | {count, plural, one {# receipt} other {# receipts}} | {count, plural, one {# Quittung} other {# Quittungen}} | draft |
| `download` | `content.download` | Download | Herunterladen | draft |
| `empty` | empty receipts | No receipts yet. | Noch keine Quittungen. | draft |
| `language` | language label | Language | Sprache | draft |

Nothing in this table is a native-speaker review. Source-attested rows are phrases a pinned upstream UI shipped for that intent and role. Draft rows are unreviewed suggestions, including the catalog draft for stop-renewal and every sentence composed here.

## Check

```sh
node skills/nativeskill/scripts/check.mjs \
  --source evals/scenarios/B-add-german/locales/en.json \
  --target evals/scenarios/B-add-german/outputs/with-skill/de.json \
  --locale de --source-locale en
```

Exit 0. Errors still open: none. Warnings still open: `possible-source-copy` on `appTitle` (kept on purpose; the product name is shared) and `length-blowup` on `stopRenewal` (20 characters against a source of 6).

`de` is registered in `outputs/with-skill/i18n.js` `supportedLngs`. `fallbackLng` stays `en`. Files written: `de.json`, `i18n.js`, `NOTES.md`. The existing locale files were not modified.

Placeholders `{name}`, `{date}`, `{amount}`, and `{count}` are unchanged. The receipt plural uses German `one` and `other`.
