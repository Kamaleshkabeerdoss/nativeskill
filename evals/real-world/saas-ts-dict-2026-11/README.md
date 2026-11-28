# Real-world case: typed TypeScript dictionary, 9 locales (November 2026)

nativeskill was run as an audit on a production SaaS dashboard. The app is a multi-tenant chat product, so its strings cover billing, integrations, an inbox and a knowledge base. Its catalog is a typed TypeScript dictionary of about 1,700 English keys translated into ja, zh, ms, id, th, vi, fil, ar and ta. Most of the translations started out as machine translation.

The app is a separate product, so this folder holds only a small, anonymised excerpt: 34 keys, 7 target locales, and the product name replaced with `Acme`. It keeps each defect class the run found, plus a few the run missed that a second review caught. The strings themselves are exactly as shipped.

## What the run showed

- **The checker could not read the catalog.** `check.mjs` refuses any `.ts` file containing `=>`, `...` or `function` (exit 2). Its error message sends the user to a `nativeskill validate` command, which lives only in this repo's unpublished CLI and does not ship with the installed skill. The auditor had to write an esbuild adapter before anything could be checked.
- **Once the catalog was flattened to JSON, the checker caught about a third of the real problems.** These were wrong function signatures, dropped placeholders and English left in place. The English warnings came out as 400–500 ungrouped `possible-source-copy` lines per locale, so nobody could see that whole sections were untranslated.
- **Most of the other problems are mechanical and could be caught by a script.** They are:
  - the count placed after the noun (`Mesej {count}`, which reads as "message number 5")
  - spaces inside quotes or before punctuation (`" {name} "`, `{workspace} ?`)
  - strings that went stale after the English changed
  - one concept translated with two terms
  - English inside a function branch
  - a leftover English `(s)`
  - zero-width spaces
- **The rest are meaning errors only a reader catches.** Many come from English words with more than one meaning:
  - Back was translated as "again" and Clear as "clarity" (Tamil).
  - Scopes became "camera lens" (Vietnamese).
  - Sales *lead* became the verb "to lead", "tracks", the metal lead, or "clue", depending on the language.

## Files

| Path | What it is |
| --- | --- |
| `ts/types.ts`, `ts/<locale>.ts` | The excerpt in its original shape: `export const ms: Dict = {...}`, arrow functions, `inbox: en.inbox` aliases, a non-type `import { Dict }`, an optional `extras` section, and an Indonesian export named `id` (which makes a naive esbuild bundle rename a parameter `id` to `id2`). It type-checks with `tsc --strict`, including the wrong `confirmDisconnect` signature. |
| `json/<locale>.json` | The same catalog flattened. Each function was called with `{param}` strings, so a truthy argument picks the first branch. This is what `check.mjs` can read today. |
| `json/en.baseline.json` | The previous English, reconstructed from what the stale translations say, for a future `--baseline` stale check. |
| `expected.json` | Every defect and false alarm, tagged `currently-caught` or `known-gap`, `checker` or `agent`, and mapped to a fix-plan item (1–8). |
| `case.test.mjs` | Runs in `npm test`. Entries that are caught today are hard tests. Known gaps are `todo` tests that describe the wanted behaviour, so they report as todo without failing the run. |

## Running it

```bash
node --test evals/real-world/saas-ts-dict-2026-11/case.test.mjs
node skills/nativeskill/scripts/check.mjs --source evals/real-world/saas-ts-dict-2026-11/json/en.json --target evals/real-world/saas-ts-dict-2026-11/json/ms.json --locale ms
```

When a fix lands, its todo test starts passing. Change that entry to `"status": "currently-caught"` in `expected.json` and move its check into the hard set. Then it can't regress. A todo test that still fails after its fix means the fix is incomplete.

## Notes on the linguistic entries

The suggested replacements in `expected.json` are drafts. Two reviewers read them, and they are not a native-speaker review. The Tamil, Thai and Filipino calls in particular should be confirmed by a native speaker. These rows are clearly wrong in context:
- Tamil `மீண்டும்` for Back
- Tamil `தெளிவு` for Clear
- Malay `Sesuatu telah berlaku.` for "Something went wrong."
- Vietnamese `Ống kính` for scopes
- Arabic `الرصاص` for sales leads

The Arabic `إلغاء` for Revoke is a style point, not an error.

`login.signupCta` = `Daftar` in Indonesian is correct. It is in this case so that no future rule "fixes" it.
