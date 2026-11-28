// Real-world regression case.
// Every checker entry in expected.json is a test. Entries marked "currently-caught" are hard tests.
// Entries still marked "known-gap" run as node:test `todo` tests: they describe the behaviour we want
// and are reported as todo instead of failing. When a fix lands, flip the entry to "currently-caught".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCatalogs } from '../../../skills/nativeskill/scripts/check.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const expected = JSON.parse(readFileSync(join(here, 'expected.json'), 'utf8'));
const json = (locale) => join(here, 'json', locale + '.json');
const ts = (locale) => join(here, 'ts', locale + '.ts');
const at = (object, key) => key.split('.').reduce((value, part) => value?.[part], object);

const runs = new Map();
function run(locale, options = {}, input = 'json') {
  const id = input + locale + JSON.stringify(options);
  const file = input === 'ts' ? ts : json;
  if (!runs.has(id)) runs.set(id, checkCatalogs({ source: file('en'), target: file(locale), locale, ...options }));
  return runs.get(id);
}
const findingsFor = (result, key) => result.findings.filter((finding) => finding.key === key);
const pairs = (entry) => entry.hits
  ? Object.entries(entry.hits).flatMap(([locale, keys]) => keys.map((key) => [locale, key]))
  : entry.locales.flatMap((locale) => entry.keys.map((key) => [locale, key]));
const optionsFor = (entry) => ({
  ...(entry.options ?? {}),
  ...(entry.options?.oldSource ? { oldSource: join(here, entry.options.oldSource) } : {}),
  ...(entry.options?.glossary ? { glossary: join(here, entry.options.glossary) } : {}),
  ...(entry.options?.config ? { config: join(here, entry.options.config) } : {})
});

function wantCode(entry) {
  const options = optionsFor(entry);
  for (const [locale, key] of pairs(entry)) {
    const found = findingsFor(run(locale, options, entry.input), key).filter((f) => f.code === entry.want.code);
    assert.ok(found.length, `${locale} ${key} should report ${entry.want.code}`);
    if (entry.want.severity) assert.equal(found[0].severity, entry.want.severity, `${locale} ${key} severity`);
    if (entry.want.pattern) assert.ok(found.some((f) => f.message.includes('[' + entry.want.pattern + ']')), `${locale} ${key} names ${entry.want.pattern}`);
  }
  for (const [locale, keys] of Object.entries(entry.mustNotFlag ?? {})) {
    const flagged = run(locale, options, entry.input).findings.filter((f) => f.code === entry.want.code && (keys.includes('*') || keys.includes(f.key)));
    assert.equal(flagged.length, 0, `${locale} must not report ${entry.want.code}: ${flagged.map((f) => f.key).join(', ')}`);
  }
  if (entry.want.section) {
    for (const locale of entry.locales) {
      const section = run(locale, options, 'ts').summary.sections.find((item) => item.section === entry.want.section.name);
      assert.ok(section, `${locale} summary has section ${entry.want.section.name}`);
      for (const [name, value] of Object.entries(entry.want.section)) if (name !== 'name') assert.deepEqual(section[name], value, `${locale} ${entry.want.section.name}.${name}`);
    }
  }
}

function wantAbsent(entry) {
  const options = optionsFor(entry);
  for (const [locale, key] of pairs(entry)) {
    const found = findingsFor(run(locale, options, entry.input), key).filter((f) => f.code === entry.today.code);
    assert.equal(found.length, 0, `${locale} ${key} should not report ${entry.today.code}`);
    const suppressed = run(locale, options, entry.input).suppressed ?? [];
    assert.ok(suppressed.some((f) => f.key === key), `${locale} ${key} should be listed as suppressed, not dropped`);
  }
}

const special = {
  'ts-dictionary-unreadable': (entry) => {
    for (const locale of entry.locales) {
      const fromTs = run(locale, {}, 'ts');
      const fromJson = run(locale);
      const tsFindings = new Set(fromTs.findings.map((f) => f.code + ' ' + f.key));
      for (const finding of fromJson.findings) assert.ok(tsFindings.has(finding.code + ' ' + finding.key), `${locale}: ${finding.code} ${finding.key} also found from .ts`);
    }
  },
  'ts-param-renamed-by-bundler': () => {
    const result = run('id', {}, 'ts');
    assert.equal(findingsFor(result, 'contacts.externalId').length, 0);
  },
  'repeated-placeholder-dropped-legitimately': (entry) => {
    for (const [locale, key] of pairs(entry)) {
      const found = findingsFor(run(locale), key);
      assert.ok(found.some((f) => f.code === entry.want.code && f.severity === 'warning'), `${locale} ${key}`);
      assert.ok(!found.some((f) => f.severity === 'error'), `${locale} ${key} should not be an error`);
    }
  }
};

for (const entry of expected.entries.filter((item) => item.layer === 'checker')) {
  const caught = entry.status === 'currently-caught';
  const name = `[${caught ? 'caught' : 'known gap'}, fix ${entry.fix}] ${entry.id}`;
  const options = caught ? {} : { todo: `fix ${entry.fix}: ${expected.fixPlan[entry.fix]}` };
  test(name, options, () => {
    if (special[entry.id]) return special[entry.id](entry);
    if (entry.want?.absent) return wantAbsent(entry);
    return wantCode(entry);
  });
}

test('fixture integrity: agent-layer defects are still present in the excerpt', () => {
  for (const entry of expected.entries.filter((item) => item.current)) {
    for (const [locale, key] of pairs(entry)) {
      const catalog = JSON.parse(readFileSync(json(locale), 'utf8'));
      assert.ok(String(at(catalog, key)).includes(entry.current), `${locale} ${key}`);
    }
  }
  for (const entry of expected.entries.filter((item) => item.hits)) {
    for (const [locale, key] of pairs(entry)) {
      const catalog = JSON.parse(readFileSync(json(locale), 'utf8'));
      assert.equal(typeof at(catalog, key), 'string', `${entry.id}: ${locale} ${key} exists`);
    }
  }
});

test('the Indonesian sign-up button is not flagged by the checker', () => {
  assert.equal(findingsFor(run('id'), 'login.signupCta').length, 0);
  assert.equal(findingsFor(run('id', {}, 'ts'), 'login.signupCta').length, 0);
});

test('the guidance no longer tells agents that Indonesian Daftar is a Malay leak', () => {
  const skill = join(here, '../../../skills/nativeskill');
  const read = (path) => readFileSync(join(skill, path), 'utf8');
  for (const path of ['SKILL.md', 'references/signs.md', 'references/locales/id.md', 'references/locales/ms.md']) {
    const text = read(path);
    assert.doesNotMatch(text, /Mendaftar` is not Malay `Daftar|uses Indonesian [^\n]*`Mendaftar`|`Daftar` is the Malay one|\| Sign up \| Daftar[^\n]*\| Mendaftar \|/, path);
  }
  const pack = JSON.parse(read('assets/locales/id.json'));
  const daftar = pack.wording.entries.find((entry) => entry.concept === 'auth.create_account' && entry.text === 'Daftar');
  assert.equal(daftar?.preferred, true);
  assert.equal(daftar.status, 'draft');
});
