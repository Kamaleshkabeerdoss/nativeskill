# German (`de`)

Left to right. Cardinal plurals are `one` and `other`.

## Sie or du, once

Pick one address for the whole language and write it in the report.

- `Sie` is the default for account, billing, and permission screens when the product has no voice yet. Verbs are `Speichern Sie` only in body text. **Buttons stay infinitives**: `Speichern`, `Abbrechen`, `Herunterladen`, `Archivieren`.
- `du` only if the product already says `du` on every screen. Then body text is `du`, and buttons are still infinitives, not `Speicher`.
- Never mix `Sie` in the error and `du` on the button. Never use `ihr` for a single user.

Android ships `Archivieren` and `Wiederherstellen` for archive and restore. Those infinitives are the button shape to copy. `Abbrechen` is the dialog cancel. Stopping renewal is `Verlängerung stoppen` (draft), not `Abbrechen`.

## Buttons and compounds

German compounds get long. The button is one infinitive plus at most one object.

| Control | Natural | Too long or translated |
| --- | --- | --- |
| Save draft | Entwurf speichern | Als Entwurf erfolgreich speichern |
| Discard | Änderungen verwerfen | Änderungen nicht speichern und verwerfen |
| Delete forever | Endgültig löschen | Dieses Element permanent löschen für immer |
| Download | Herunterladen | Herunterladen Sie die Datei |
| Discount | {amount} sparen | Sparen Sie {amount} Geld |

`Herunterladen Sie` is ungrammatical. The infinitive does not take `Sie`.

Nouns are capitalized (`Entwurf`, `Passwort`). Do not capitalize every word. `Passwort ändern` is the signed-in change. `Passwort zurücksetzen` is recovery. Do not swap them. The devise and Settings strings that match those actions are the ones to follow. A recovered Telegram string is not in the catalog.

## Machine-translation tells

- `Bitte` on every button → drop it. `Bitte` belongs in a sentence, rarely.
- English `-ing` calques (`Speichernd...`) → `Wird gespeichert …` for a status, infinitive for a button.
- `Erfolgreich` glued to a button → the success is a status, the button is the verb.
- Straight quotes are normal in German UI. Guillemets `»...«` only if the file already uses them. Use the German lower quote style `„...“` in marketing sentences if the app already does. Do not introduce a third style.
- Decimal comma and thousands dot come from the formatter: `1.234,56 €` in de-DE. `de-CH` uses `CHF` and a different grouping. Do not format a Swiss price as euros.
- Date order is day.month.year (`04.03.2026`) from the formatter, not `03/04/2026`.

## Length

If the infinitive no longer fits, drop the object before you drop the verb. `Löschen` can be enough when the dialog title already says what is deleted. `Endgültig` stays when the point is that it cannot be undone.
