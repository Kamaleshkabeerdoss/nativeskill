import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DictionaryError, flatten, readDictionary } from './dict.mjs';

function files(map) {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-dict-'));
  for (const [name, text] of Object.entries(map)) writeFileSync(join(dir, name), text);
  return dir;
}

test('typed TS dictionaries with arrow functions, aliases and spreads are read without running them', () => {
  const dir = files({
    'types.ts': 'export type Dict = {\n  common: { save: string; files: (count: number) => string }\n  inbox: { title: string }\n}\n',
    'en.ts': "import { Dict } from './types'\n\nconst shared = { ok: 'OK' } as const\nexport const en: Dict = {\n  common: {\n    ...shared,\n    save: 'Save',\n    files: (count: number): string => `${count} file${count === 1 ? '' : 's'}`,\n    greet: function (name) { if (!name) return 'Hello'; return `Hello, ${name}` },\n  },\n  inbox: { title: 'Inbox' },\n} satisfies Dict\n",
    'id.ts': "import type { Dict } from './types'\nimport { en } from './en'\n\nexport const id: Dict = {\n  common: { ...en.common, save: 'Simpan', files: (count) => `${count} berkas` },\n  inbox: en.inbox,\n  contacts: { externalId: (id) => `ID: ${id}` },\n}\n"
  });
  const en = readDictionary(join(dir, 'en.ts'));
  assert.equal(en.get('common.save').text, 'Save');
  assert.equal(en.get('common.ok').text, 'OK');
  assert.equal(en.get('common.files').text, '{count} files');
  assert.deepEqual(en.get('common.files').variants.sort(), ['{count} file', '{count} files']);
  assert.equal(en.get('common.files').fn.numericBranch, true);
  assert.equal(en.get('common.greet').text, 'Hello, {name}');
  assert.ok(en.get('common.greet').variants.includes('Hello'));
  const id = readDictionary(join(dir, 'id.ts'));
  assert.equal(id.get('common.save').text, 'Simpan');
  assert.equal(id.get('common.ok').text, 'OK');
  assert.equal(id.get('common.ok').alias, 'en.common');
  assert.equal(id.get('inbox.title').alias, 'en.inbox');
  // The parameter keeps its source name even though the export is also called id.
  assert.equal(id.get('contacts.externalId').text, 'ID: {id}');
});

test('default exports, module.exports, JSON imports, plural maps and switch bodies', () => {
  const dir = files({
    'base.json': '{"title":"Base"}',
    'a.js': "const base = require('./x')\nmodule.exports = { hi: 'Hi', n: 3 }\n",
    'b.ts': "import base from './base.json'\nexport default {\n  base,\n  count: (n: number) => ({ one: '# item', other: '# items' })[new Intl.PluralRules('en').select(n)],\n  status(s: string) { switch (s) { case 'a': return 'Active'; default: return 'Off' } },\n  list: (name) => [`Step 1 for ${name}`, 'Step 2'],\n} as const\n",
    'c.ts': "export const a = { x: 'A' }\nexport const b = { x: 'B' }\n"
  });
  assert.deepEqual(flatten(join(dir, 'a.js')), { hi: 'Hi' });
  const b = readDictionary(join(dir, 'b.ts'));
  assert.equal(b.get('base.title').text, 'Base');
  assert.equal(b.get('count').text, '# items');
  assert.equal(b.get('count').fn.pluralRules, true);
  assert.deepEqual(b.get('status').variants.sort(), ['Active', 'Off']);
  assert.equal(b.get('list.0').text, 'Step 1 for {name}');
  assert.throws(() => readDictionary(join(dir, 'c.ts')), /several exported objects \(a, b\)/);
  assert.equal(readDictionary(join(dir, 'c.ts'), { exportName: 'b' }).get('x').text, 'B');
  assert.throws(() => readDictionary(join(dir, 'missing-export.ts')), Error);
});

test('unreadable dictionaries raise a DictionaryError with a line number', () => {
  const dir = files({ 'bad.ts': "export default {\n  a: 'unclosed,\n}\n" });
  assert.throws(() => readDictionary(join(dir, 'bad.ts')), (error) => error instanceof DictionaryError && /bad\.ts:2: Unclosed string/.test(error.message));
});
