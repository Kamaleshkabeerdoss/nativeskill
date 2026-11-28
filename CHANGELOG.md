# Changelog

## 0.3.1

A second run on the same real project (a SaaS dashboard, its chat widget and its marketing site) found three release blockers in 0.3.0. The widget and marketing shapes are anonymised in [evals/real-world/locale-tables-2026-11](evals/real-world/locale-tables-2026-11/README.md).

### Fixed

- The read error for a file with several exports said `Pass --export <name>`, a flag `check.mjs` did not have. Errors now name the caller's real flag (`--source-export`, `--target-export`, `--source-key`, `--target-key`, `--resolve`), and `check.mjs` accepts `--export` as an alias for both sides. A new test checks that every flag in the help texts, the docs and the error suggestions exists and that following a suggestion works.
- `english-in-branch` now compares every branch, the main count branch included, so `n ? 'Import {n} into knowledge base' : '<translated>'` is reported. A branch counts as English when it equals a source branch or reads like one; one finding per key, in place of `possible-source-copy`.
- Exit 0 no longer passes a locale that is mostly English. `check.mjs` exits 1 when a finding at or above `--fail-on` remains (default P1, `--strict` is P2) or coverage is under `--min-coverage` (default 80, 0 turns it off), and its last line says why (`exit` in `--json`). SKILL.md no longer says exit 0 means the audit is done: read the triage line and work through P2.

### Catalogs

- TS/JS tables keyed by locale: `{ en: {...}, ms: {...} }`, `Record<Locale, Dict>` built from unexported constants, and overlays merged by a resolver such as `resolveStrings(lang)` (found by itself when exported, or `--resolve`). The entry follows `--source-locale` / `--locale`, or `--source-key` / `--target-key`; the same file can be source and target. The text output starts with what was read.
- Evaluated without running code: top-level `TABLE['ar-SA'] = TABLE['ar-AE']`, `??` / `||` fallbacks, static computed keys, local helpers called with literal arguments, `Object.fromEntries`, `.map` / `.slice` / `.join` on literal arrays, and spreads inside arrays. Anything else is an error or a `dynamic-value` that names the construct.
- A local helper called with words, such as `plural(n, 'file', 'files')`, is a `dynamic-value` naming the helper and the words, instead of being read as `{n} {n}`.
- JSON arrays are read as `key.0`, `key.1`. JSON syntax errors name the file, line and column; a missing file says so. Unknown options say `Unknown option --x` in every script, and unknown locale tags are rejected.

### Fewer false positives

- `possible-source-copy` leaves URLs, e-mail addresses, placeholder-only text, known brands, CamelCase names and acronyms in `suppressed` (reason `brand-or-url`).
- A literal `</body>` in a sentence is no longer rich-text markup. When only one side mentions it, the new P2 `code-mismatch` says the translation probably describes older English.
- `hand-rolled-plural` ignores plural categories no count from 0 to 1000 reaches, so fr, es, pt and it no longer fire.
- Thai `count-noun-order` names the real noun and is P3 until a Thai speaker confirms the rule.
- The 您/你 checks skip sample visitor questions (`skipKeys` in `audit-patterns.json`); `english-residue` skips product names such as "Outlook on the web".
- `scan.mjs` skips files of per-locale exports and `n === 1 ? 'x' : 'x'` with identical branches.
- `--verbose` lists suppressed findings in the text output.

## 0.3.0

Driven by a real audit of a typed TypeScript dictionary (about 1,700 keys, 9 locales). The anonymised case is in [evals/real-world/saas-ts-dict-2026-11](evals/real-world/saas-ts-dict-2026-11/README.md); every finding in it is now a hard test.

### Catalogs

- `check.mjs` reads TS/JS dictionaries directly (`.ts`, `.tsx`, `.js`, `.mjs`, `.cjs`) through the new zero-dependency `scripts/dict.mjs`. It handles typed exports, `as const` / `satisfies`, arrow and `function` values, template literals, ternaries, `if` / `switch` returns, spreads, `section: en.section` aliases and relative imports. Parameter names come from the source, so `{id}` stays `{id}`. Every function branch is checked. `--source-export` / `--target-export` pick an export.
- New exit code 3 for a catalog that cannot be read, with a message that says what failed. The message no longer points at the repo-only `nativeskill validate`.
- `scan.mjs` scans TS/JS source, skips files that are locale dictionaries, and reports hand-rolled English plurals.

### Settings

- `.nativeskillrc` (found from the target folder upward, or `--config`): `allowMissing`, `keepEnglish`, `ignoreKeys`, `glossary`, `oldSource`, and per-locale overrides. Matching flags: `--allow-missing`, `--keep-english`, `--ignore-key`, `--no-config`. Suppressed findings are listed, not dropped.

### Report

- Coverage summary per section, with sections that look untranslated and the English section a dictionary reuses. Repeated warnings and missing keys are grouped per section in text output; `--verbose` lists every key.
- Every finding has a triage bucket: P1 broken or missing, P2 wrong meaning or still English, P3 polish. `--json` is `schema: 2` with `summary` (coverage, sections, groups, buckets) and `suppressed`.
- SKILL.md's Report section starts with triage counts, coverage, deliberate English and a native-review sampling rule.

### New checks

- `placeholder-spacing`, `invisible-character`, `english-residue`, `count-noun-order` (ms, id, vi, fil, ar, and Thai classifiers), `english-in-branch`, `hand-rolled-plural`, `source-changed` (`--old-source`), `term-inconsistent` (`--glossary`).
- `wrong-word`: the audit checklist as data in `assets/audit-patterns.json`, plus the wrong senses from the real-world case. `--no-audit` turns it off. SKILL.md's checklist is now FLAG-if lines that name the check covering each one.

### Changed checks

- A placeholder the source repeats but the translation says once is `placeholder-repeat-dropped` (warning) instead of an error.
- `length-blowup` allows 3.5× for Filipino, measured on the real catalog. Other locales stay at 3×.
- The guidance no longer calls Indonesian `Daftar` a Malay leak.

### Locale notes and wording

- New notes: Thai, Vietnamese, Filipino, Korean, Telugu. Fixed a garbled sentence in the Tamil note.
- New concepts `status.generic_error` (source-attested from OOUI in 91 locale rows), `auth.revoke_access` and `api.scope` (drafts).
- Drafts for sales leads (ms, id, vi, ar, th), API scope, revoke, a Tamil Back button and Indonesian `Daftar`. Known machine-translation mistakes are stored as rejected entries (`preferred: false`).
- `scripts/import-wording.mjs --only <source>` refreshes one pinned source.

### Tests

- The skill's own tests run from an installed copy of the skill folder: the repo-only CLI test skips itself there. `docs.test.mjs` checks every relative link in the skill documents.

## 0.2.0

Earlier releases are described in the git history.
