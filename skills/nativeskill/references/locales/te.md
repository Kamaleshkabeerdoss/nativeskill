# Telugu (`te`)

Telugu script, left to right. Cardinal plurals are `one` and `other`. Apps use Western digits.

## Who the string talks to

UI addresses the user with the respectful plural (`మీరు`, verb ending `-ండి`). Do not use `నువ్వు`. The verb carries the person, so most labels need no pronoun.

## One verb form per product

The pinned catalogs mix two shapes: the bare imperative (`తొలగించు`, `కాపీచేయి`, `వెతుకు`) and the polite `-ండి` form (`ప్రవేశించండి`, `దస్త్రాన్ని ఎంచుకోండి`). Both are used in Telugu UI. Pick one for buttons and keep it; do not show `తొలగించు` next to `ఎంచుకోండి`.

## Buttons

| Control | Natural | Translated-sounding |
| --- | --- | --- |
| Delete | తొలగించు (Django, attested) | తొలగింపు చేయండి |
| Save | భద్రపరచు (VisualEditor, attested) | సేవ్ చేయడం |
| Sign in | ప్రవేశించండి (Django, attested) | సైన్ ఇన్ చేయుట |
| Try again | మళ్ళీ ప్రయత్నించు (OOUI, attested) | మళ్ళీ ఒకసారి ప్రయత్నం చేయండి |
| Continue | కొనసాగించు (OOUI, attested) | కొనసాగింపు |

OOUI ships `తీసివేయి` ("remove") for its dismiss button. For a close button use a close verb (`మూసివేయి`, draft), not remove.

## Machine-translation tells

- Verbal nouns (`-ట`, `-డం`) on buttons: `సేవ్ చేయడం` means "the saving". A button is an imperative.
- English loanwords transliterated where the product already uses a Telugu word, or the reverse, inside one screen.
- `విజయవంతంగా` ("successfully") on a button or in every toast.
- Formal Sanskritised vocabulary where everyday UI words exist.

## Punctuation, numbers

Sentences end with `.`; buttons have no period. Currency is `₹` from the `te-IN` formatter; Indian digit grouping (`1,23,456`) comes from the formatter. Placeholders stay Latin.

## Length

Telugu words are long when written out; agglutinated verb forms add characters. Keep buttons to one verb and its object.
