# Vietnamese (`vi`)

Latin script with diacritics, left to right. Use precomposed characters (NFC); decomposed tone marks break search. CLDR 49 data gives cardinal `one` (0 and 1) and `other`; many runtimes still report `other` only. Always write `other`, and treat a `one` branch as optional. Vietnamese does not inflect nouns for number.

## Who the string talks to

UI addresses the user as `bạn`, or uses no pronoun. Avoid `quý khách` outside formal commerce flows and never mix it with `bạn` in one product. Do not use `mày` / `anh` / `chị` in UI.

## Count before the noun

Vietnamese counts as number + noun: `5 tin nhắn`, `3 tệp`, `{count} trang`. `Tin nhắn {count}` reads as "message number {count}". Do not add `các` / `những` before a counted noun (`Các trang {n}` is wrong; `{n} trang` is right). The checker reports both as `count-noun-order`.

## Buttons

| Control | Natural | Translated-sounding |
| --- | --- | --- |
| Save | Lưu (VisualEditor, attested) | Tiến hành lưu |
| Delete | Xóa (Django, attested) | Thực hiện xóa |
| Try again | Thử lại (OOUI, attested) | Vui lòng thử lại một lần nữa |
| Sign in | Đăng nhập (Django, attested) | Vào hệ thống |
| Close | Đóng (VisualEditor, attested) | Bỏ qua |

OOUI ships `Bỏ qua` for its dismiss button; it means "skip / ignore". Use `Đóng` for a close button.

## Words machine translation gets wrong

- **scope** (OAuth, API permission): `phạm vi` or `quyền` (draft). `Ống kính` means a camera lens. Rejected.
- **lead** (sales): `khách hàng tiềm năng` (draft). `dẫn đầu` means "to lead / be in first place". Rejected.
- **revoke** (a token, access): `thu hồi` (draft). `Hủy bỏ` is cancel, not revoke.
- **Something went wrong**: `Đã xảy ra sự cố` (OOUI, attested).

## Machine-translation tells

- U+200B pasted between syllables (`sử ​​dụng`). Vietnamese never uses it; the checker reports `invisible-character`.
- A space after an opening quote or before `?` (`" {name} "?`).
- `(các)` before a noun to copy English `(s)`. Better: rephrase without plural marking.
- Every sentence starting with `Vui lòng` ("please").

## Punctuation, numbers

Thousands separator is `.`, decimal is `,` (`1.234,5`), from the `vi-VN` formatter. Currency `₫` follows the number (`10.000 ₫`). Dates are day-month-year.

## Length

Vietnamese runs a little longer than English (median 1.1× on a 1,100-string SaaS catalog). Correct nouns can be much longer than a one-word English nav label (`Khách hàng tiềm năng` for "Leads"), so length-blowup on a short label is a layout question, not a translation error.
