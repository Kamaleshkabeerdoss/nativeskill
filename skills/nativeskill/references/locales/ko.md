# Korean (`ko`)

Hangul, left to right. Cardinal plurals are `other` only. Do not invent a `one` branch, and do not add `들` to mark English plurals. Spaces separate words (eojeol), unlike Japanese and Chinese.

## Speech level

Pick one level for the product and keep it.

- Buttons, menu items and tabs: a noun (`저장`, `삭제`, `편집`) or the bare noun + `하기`. Not a sentence.
- Messages and dialogs: `합니다` style (formal polite) is the common default in software; `해요` style is friendlier. Do not mix the two in one flow.
- Never use `해` / `한다` (plain) style for messages addressed to the user.

## Buttons

| Control | Natural | Translated-sounding |
| --- | --- | --- |
| Save | 저장 (Django, attested) | 저장합니다 |
| Delete | 삭제 (Django, attested) | 삭제하십시오 |
| Back | 뒤로 (OOUI, attested) | 다시 |
| Cancel | 취소 (OOUI, attested) | 취소합니다 |
| Sign in | 로그인 (Django, attested) | 서명 |

OOUI ships `다시 시도하세요` and `파일을 선택하세요` as button labels. They are attested but sentence-shaped; a button reads better as `다시 시도` / `파일 선택` (draft).

## Machine-translation tells

- `당신` for "you". Korean UI drops the pronoun or says `회원님` in membership contexts. `당신의 계정` → `계정`.
- Particles glued to a placeholder that may end in a vowel or a consonant: `{name}을` is wrong half the time. Use `{name}을(를)`, rewrite to avoid the particle, or use a library that picks it.
- Calques such as `무언가가 잘못되었습니다` (OOUI's attested "Something went wrong") are acceptable; `문제가 발생했습니다` is the more common product phrasing (draft).

## Punctuation, numbers

Western digits, `1,234`. Currency `₩` from the `ko-KR` formatter, usually without decimals. Dates `2026년 3월 4일` from the formatter.

## Length

Korean is shorter than English in characters but wider per character. Check length in the rendered control, not by count.
