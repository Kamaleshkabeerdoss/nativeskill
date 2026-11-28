# Typed TS/JS dictionaries

Many web apps skip i18n libraries and keep one typed object per locale:

```ts
// en.ts
export const en = {
  common: { save: 'Save' },
  kb: { uploadFiles: (count: number) => `Upload ${count} file${count === 1 ? '' : 's'}` },
}
export type Dict = typeof en

// ms.ts
import { Dict } from './types'
import { en } from './en'
export const ms: Dict = {
  common: { save: 'Simpan' },
  kb: { uploadFiles: (count) => `Muat naik ${count} fail` },
  inbox: en.inbox, // falls back to English on purpose
}
```

## Check it

```sh
node <skill-dir>/scripts/check.mjs --source src/dict/en.ts --target src/dict/ms.ts --locale ms
```

The checker parses the files without running them, so it needs no build and no dependencies.

- A function's text is checked with its parameters as `{count}`, `{name}`, spelled exactly as in the source. The branch a count such as 5 takes is the main text. The other branches are checked as well, so English left in the `count === 1` branch is still caught.
- `inbox: en.inbox` and `...en.common` are followed into `en.ts`. Every key they bring in is checked and the section is reported as taken from the source.
- When a file exports several objects, name the one to check: `--source-export en --target-export ms` (`--export` sets both). A top-level constant that is not exported can be named the same way.
- When a value needs real code (a call into a package, a computed key), the checker reports `dynamic-value` for that key. It does not guess.

### Tables keyed by locale

One file can hold every language:

```ts
const en: ExtraDict = { cta: 'Start free trial' }
const ms: ExtraDict = { ...en, cta: 'Cuba percuma' }
export const EXTRA: Record<Locale, ExtraDict> = { en, ms }
```

The checker picks the entry whose key matches `--source-locale` and `--locale` (`ms` matches `ms` or `ms-MY`), so the same file is both `--source` and `--target`:

```sh
node <skill-dir>/scripts/check.mjs --source src/i18n/extra.ts --target src/i18n/extra.ts --source-locale en --locale ms
```

When the language alone is ambiguous (`ar-AE` and `ar-SA`), or the keys are not locale tags, name the key: `--source-key en-IN --target-key ar-SA` (aliases `--source-locale-key`, `--target-locale-key`).

Overlays merged by a function are evaluated too. For a file like this, the exported resolver is found by itself and called with the locale key; `--resolve <function>` names it when there are several:

```ts
export const LOCALES: Record<string, Strings> = { 'en-IN': {...}, 'ta-IN': {...} }
const TICKET_I18N: Record<string, Partial<Strings>> = { 'ta-IN': {...} }
TICKET_I18N['ar-SA'] = TICKET_I18N['ar-AE']
export function resolveStrings(lang: string): Strings {
  return { ...LOCALES['en-IN'], ...(LOCALES[lang] ?? {}), ...(TICKET_I18N[lang] ?? {}) }
}
```

The first line of the output says what was read: `Read: source resolveStrings("en-IN") · target resolveStrings("ta-IN")`. Keys a language has in no table fall back to English and are reported as `possible-source-copy`, as they would show on screen.

Supported without running code: top-level `TABLE['key'] = ...` assignments, `a ?? b` and `a || b`, static keys (`T['ar-AE']`, `list[i]`), local helper functions called with literal arguments, `Object.fromEntries`, and `.map`, `.slice` and `.join` on literal arrays. Anything else (a call into a package, a key computed at run time, a loop) gives an error or a `dynamic-value` that names the construct. Then print the dictionary as JSON from your own build step and check the JSON.

A local helper that picks words at run time, such as `${n} ${plural(n, 'file', 'files')}`, is reported as `dynamic-value` naming the helper and its words. Read that entry by hand, or switch to `Intl.PluralRules`.
- To see exactly what the checker reads: `node <skill-dir>/scripts/dict.mjs src/dict/ms.ts --branches` (with `--locale <tag>`, `--key <key>` or `--resolve <function>` for tables keyed by locale).

TypeScript does not catch a wrong translation signature: `(clientName) => ...` is assignable to `(provider, nounPlural) => string`. The checker does, because the placeholders differ.

## Write it

- Keep one export per locale and type it with the English shape (`Dict`), so a missing key fails the build.
- Do not build plurals with `count === 1 ? '' : 's'`. That only works for English. Use `Intl.PluralRules`:

```ts
const rules = new Intl.PluralRules('ar')
uploadFiles: (count: number) => ({
  zero: 'لا ملفات', one: 'ملف واحد', two: 'ملفان',
  few: `${count} ملفات`, many: `${count} ملفًا`, other: `${count} ملف`,
})[rules.select(count)],
```

- Format numbers, dates and money with `Intl.NumberFormat` / `Intl.DateTimeFormat`, not inside the string.
- A section that deliberately falls back to English (`inbox: en.inbox`) should be listed in `.nativeskillrc` under `allowMissing` or `keepEnglish`, so the report separates choices from gaps.
