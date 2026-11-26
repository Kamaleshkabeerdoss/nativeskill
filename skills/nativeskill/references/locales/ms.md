# Malay (`ms`)

Latin script, left to right, for `ms` and `ms-MY`. This is Bahasa Malaysia, not Indonesian. Cardinal plurals are `other` only. Copying an English `one` branch into Malay is wrong. Dewan Bahasa (https://prpm.dbp.gov.my/) is a terminology dictionary. A sentence you build from it is still a draft.

## Not Indonesian

| Action | Malay | Indonesian, do not copy |
| --- | --- | --- |
| Sign in | Log masuk (Django, attested) | Masuk |
| Sign out | Log keluar (attested) | Keluar |
| Sign up | Daftar (devise, attested) | Mendaftar |
| Download | Muat turun (draft) | Unduh |
| Delete | Padam (draft, preferred) | Hapus |
| Delete permanently | Padam secara kekal (draft) | Hapus permanen |
| Allow | Benarkan (Android, attested) | Izinkan |

If the file is `id`, use the Indonesian column. If it is `ms`, use the Malay column. A shared word (`Tambah`, `Simpan`) can appear in both. Do not assume the rest of the file can be copied.

## Buttons

Short, sentence case or the capitalization the file already uses. No English Title Case On Every Word. No `berjaya` ("successfully") on the button.

| Control | Natural | Translated |
| --- | --- | --- |
| Dialog cancel | Batal (Android, attested) | Membatalkan |
| Stop renewal | Hentikan pembaharuan automatik (draft) | Batal |
| Pay now | Bayar sekarang (draft) | Membayar sekarang |
| Deny on a prompt | Tolak (accessibility dialog, attested) | Nafi |
| Archive as a verb | Arkibkan (draft) | Arkib |

Delete is `Padam`, the word Google and Microsoft Malaysian UI use. It is a draft: no licence-compatible catalog bundled here attests it. The bundled Django `Buang` (throw away) and VisualEditor `Hapuskan` (abolish, close to Indonesian `Hapus`) are marked `preferred: false`. Permanent deletion is `Padam secara kekal`.

Android's generic deny is `Nafi`, which sounds like a legal finding. The accessibility dialog ships `Tolak` for the same decline. Prefer `Tolak` on a permission prompt and say which attested string you used.

`Arkib` (Settings) is a noun. On a verb button, the draft `Arkibkan` is the better shape. Keep the evidence label honest.

`Hantar saya arahan kata laluan set semula` is the attested devise line for sending reset instructions. It is grammatical and stiff. Shortening it is a new draft, and it must still mean "send the instructions", not "your password has changed".

## Punctuation and format

Malay uses `.` and `?` like English. Buttons have no period. Quotes follow the file, usually `"..."`.

Plurals do not change the noun. `{count} item` is one `other` string. Do not write `1 item` / `banyak item` as two English-style branches.

Dates for Malaysia are day month year from the `ms-MY` formatter (`4 Mac 2026`), not `03/04/2026`. Currency is `RM` from the formatter when the charge is in ringgit. Do not write `RM` by hand in one string and let the formatter do it in the next. Placeholders stay `{amount}` and `%1$s`.
