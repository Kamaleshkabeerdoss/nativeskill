# Malay (`ms`)

Latin script, left to right, for `ms` and `ms-MY`. Cardinal plurals are `other` only. An English `one` branch does not belong in a Malay plural. Dewan Bahasa dan Pustaka (https://prpm.dbp.gov.my/) is the terminology reference for Malaysia. It does not make a sentence attested.

## Voice

Malaysia Malay, not Indonesian. Django ships `Log masuk` for sign in and `Log keluar` for sign out. devise ships `Daftar` for sign up. Android ships `Benarkan` for Allow, `Tolak` on the accessibility deny button, and `Batal` for the generic Cancel. Indonesian devise uses `Mendaftar` for the same sign-up intent. Do not copy it into Malay.

## Traps

- `Batal` is the dialog and Android cancel word. It is the wrong word for `billing.stop_renewal`. The draft for stopping future renewal, while access continues until the period ends, is `Hentikan pembaharuan automatik`. It is unreviewed.
- `Bayar sekarang` is an unreviewed draft for `billing.pay_now` (submit the payment). It is not the button that only opens the payment screen.
- Android's generic `deny` is `Nafi`, which reads as a legal term. The accessibility dialog's `Tolak` is the prompt button. Both are source-attested. Prefer `Tolak` on a permission prompt and say so.
- `Hantar saya arahan kata laluan set semula` is the attested devise sentence for sending reset instructions. It is stiff. You may shorten it only as a `draft`, and it still has to mean "send the reset instructions", not "your password has changed".
- There is no source-attested "change password while signed in". The draft is `Tukar kata laluan`. The longer devise line belongs to the reset step.

## Format

No special plural suffix. "1 item" and "5 items" share the `other` string, with the number in the placeholder. Use Western digits. Format dates as the app's locale formatter does for Malaysia, not as US `MM/DD`.
