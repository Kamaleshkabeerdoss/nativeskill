# Changelog

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
