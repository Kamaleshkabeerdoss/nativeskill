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
- When a file exports several objects, name the one to check: `--source-export en --target-export ms`.
- When a value needs real code (a call into a package, a computed key), the checker reports `dynamic-value` for that key. It does not guess.
- To see exactly what the checker reads: `node <skill-dir>/scripts/dict.mjs src/dict/ms.ts --branches`.

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
