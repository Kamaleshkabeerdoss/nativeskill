# Thai (`th`)

Thai script, left to right. Cardinal plurals are `other` only. Thai writes no spaces between words; a space separates phrases or clauses. U+200B (zero width space) is sometimes used to mark word breaks for line wrapping, so the checker does not flag it in Thai. Do not add spaces between words to make text "look" separated.

## Who the string talks to

Product UI is neutral and polite without particles. Do not end buttons or labels with `ครับ` / `ค่ะ`; they mark the speaker's gender and belong in chat, not in UI. `คุณ` ("you") is fine in a sentence but most labels need no pronoun.

## Counting needs a classifier

Thai counts as noun + number + classifier: `ไฟล์ 3 ไฟล์`, `ข้อความ 5 ข้อความ`, `ผู้ใช้ 2 คน`. The noun can be dropped when context is clear (`3 ไฟล์`), but the classifier cannot. `ไฟล์ {count}` with nothing after the number reads as "file number {count}". The checker reports it as `count-noun-order` in bucket P3: a short UI label without a classifier can be acceptable, and this rule has not been confirmed by a Thai speaker, so ask one before changing many strings. Pick the classifier for the noun (`คน` for people, `รายการ` for items, `หน้า` for pages, the noun itself for many tech nouns).

## Buttons

Short verbs or verb phrases, no sentence.

| Control | Natural | Translated-sounding |
| --- | --- | --- |
| Save | บันทึก (Django, attested) | ทำการบันทึก |
| Delete | ลบ (Django, attested) | ดำเนินการลบ |
| Sign in | เข้าสู่ระบบ (Django, attested) | ลงชื่อเข้า |
| Try again | ลองอีกครั้ง (OOUI, attested) | กรุณาลองใหม่อีกครั้งค่ะ |
| Cancel | ยกเลิก (OOUI, attested) | ยกเลิกการดำเนินการ |

`ยกเลิก` is dialog cancel. Stopping a subscription renewal is a different concept; say what stops.

## Machine-translation tells

- `ทำการ` / `ดำเนินการ` ("perform the action of") in front of every verb.
- English punctuation inside Thai sentences: a full stop at the end of a Thai sentence. Thai ends sentences with a space or line break, not `.`.
- The count after the noun with no classifier (`ข้อความ {count}`).
- English plural markers copied through (`{noun}(s)`).

## Punctuation, numbers

Use Western digits in apps; Thai digits (`๑๒๓`) only if the whole product does. Dates come from the `th-TH` formatter, which defaults to the Buddhist calendar (2569 for 2026). Do not hand-write the year. Currency is `฿` from the formatter.

## Length

Thai is usually shorter than English in characters. Measured on a 1,100-string SaaS catalog, the median Thai string was 0.8× the English. A Thai string much longer than its source usually carries an added politeness phrase; cut it.
