import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { inspectConcept, inspectLanguage, inspectLocale, lookupWording, registry } from '../src/locales.mjs';

const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));
const launch = JSON.parse(readFileSync(new URL('../../../scripts/launch-languages.json', import.meta.url), 'utf8'));
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

function catalogs(t, inputs) {
  const directory = mkdtempSync(join(tmpdir(), 'nativeskill-test-'));
  t.after(() => rmSync(directory, { force: true, recursive: true }));
  const files = [];
  for (const [name, content] of Object.entries(inputs)) {
    const path = join(directory, name);
    writeFileSync(path, typeof content === 'object' ? JSON.stringify(content) : content);
    files.push(path);
  }
  return files;
}

function validate(t, inputs, ...args) {
  const [source, target] = catalogs(t, inputs);
  const result = run('validate', '--source', source, '--target', target, '--locale', 'ta-MY', '--json', ...args);
  if ([0, 1].includes(result.status)) result.report = JSON.parse(result.stdout);
  return result;
}

test('the registry preserves the exact requested 110 languages and has scoped references for each', () => {
  const requested = Object.values(launch).flat().map(([id, name]) => [id, name]);
  assert.equal(registry.languageCount, 110);
  assert.deepEqual(registry.languages.map(({ id, name }) => [id, name]), requested);
  assert.ok(registry.regionalLocaleCount >= 150);
  for (const { id } of registry.languages) {
    const pack = inspectLanguage(id);
    assert.ok(pack.profiles.length > 0, id);
    assert.ok(pack.references.some(({ kind, scope }) => kind.includes('dictionary') && pack.codes.includes(scope)), id);
    assert.ok(pack.references.some(({ id }) => id === 'iana'));
    assert.ok(pack.references.some(({ id }) => id === 'cldr-scripts'));
    assert.equal(pack.wording.sourceCount, pack.wording.entries.filter(({ status }) => status === 'source-attested').length);
    for (const entry of pack.wording.entries) {
      assert.ok(pack.profiles.some(({ tag, script }) => tag === entry.locale && script === entry.script), id);
      assert.match(entry.source.url, /^https:\/\//);
      if (entry.status === 'source-attested') assert.match(entry.source.url, /\/blob\/[0-9a-f]{40}\//);
    }
  }
});

test('bundled wording distinguishes draft, attestation, and gaps by locale and UI role', () => {
  assert.ok(registry.wordingLanguageCount >= 107);
  assert.ok(registry.wordingExampleCount >= 3174);

  const tamil = lookupWording('ta-MY', 'auth.sign_out', 'button').wording;
  assert.equal(tamil.status, 'source-attested');
  assert.ok(tamil.entries.some(({ status, locale, match, source }) => (
    status === 'source-attested' && locale === 'ta' && match === 'language-script' && source.key === 'Log out'
  )));
  // A rejected machine translation sits next to the draft, so these are mixed, and nothing is attested.
  for (const [concept, role, rejected] of [['form.clear_input', 'button', 'தெளிவு'], ['crm.sales_leads', 'navigation-label', 'வழிநடத்துகிறது'], ['navigation.go_back', 'button', 'மீண்டும்']]) {
    const wording = lookupWording('ta', concept, role).wording;
    assert.equal(wording.status, 'mixed', concept);
    assert.ok(wording.entries.every(({ status }) => status === 'draft'), concept);
    assert.ok(wording.entries.some(({ text, preferred }) => text === rejected && preferred === false), concept);
  }
  assert.equal(lookupWording('ta', 'navigation.go_back', 'button').wording.preferred.text, 'பின்செல்');
  assert.equal(lookupWording('ta', 'form.clear_input', 'tooltip').wording.status, 'source-attested');
  const genericError = lookupWording('ms', 'status.generic_error', 'status').wording;
  assert.ok(genericError.entries.some(({ text, status, source }) => text === 'Ada masalah' && status === 'source-attested' && source.id === 'ooui'));
  assert.ok(genericError.entries.some(({ text, preferred }) => text === 'Sesuatu telah berlaku' && preferred === false));
  for (const [locale, concept, role] of [['vi', 'api.scope', 'field-label'], ['ar', 'auth.revoke_access', 'button'], ['ms', 'crm.sales_leads', 'navigation-label']]) {
    const wording = lookupWording(locale, concept, role).wording;
    assert.ok(wording.entries.length && wording.entries.every(({ status }) => status === 'draft'), locale + ' ' + concept + ' has only drafts');
  }
  const renewal = lookupWording('ta', 'billing.stop_renewal', 'button').wording;
  assert.equal(renewal.status, 'draft');
  assert.ok(renewal.entries.every(({ status }) => status === 'draft'));
  assert.equal(lookupWording('ms-MY', 'permissions.allow_access', 'button').wording.status, 'source-attested');

  const traditional = inspectLocale('zh-TW').wording.entries;
  assert.ok(traditional.length);
  assert.ok(traditional.every(({ script, locale }) => script === 'Hant' && !locale.startsWith('zh-Hans')));
  const nynorsk = inspectLocale('nn-NO').wording.entries;
  assert.ok(nynorsk.length);
  assert.ok(nynorsk.every(({ locale }) => new Intl.Locale(locale).language === 'nn'));
});

test('the installed skill has a dependency-free lookup through a project symlink', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'nativeskill-skill-'));
  t.after(() => rmSync(directory, { force: true, recursive: true }));
  const original = new URL('../../../skills/nativeskill/', import.meta.url);
  const installed = join(directory, 'nativeskill');
  const agentLink = join(directory, 'linked-skill');
  cpSync(original, installed, { recursive: true });
  symlinkSync(installed, agentLink, 'dir');
  const output = spawnSync(process.execPath, [
    join(agentLink, 'scripts/lookup.mjs'), 'ta', 'form.save_changes', 'button'
  ], { cwd: directory, encoding: 'utf8' });
  assert.equal(output.status, 0, output.stderr);
  const report = JSON.parse(output.stdout);
  assert.equal(report.wording.status, 'source-attested');
  assert.ok(report.wording.entries.some(({ source }) => source.key === 'Save'));
});

test('locale lookups use a script and keep regional, macrolanguage, and member distinctions', () => {
  const expected = {
    'pa-IN': ['Guru', 'ltr'], 'pa-PK': ['Arab', 'rtl'],
    'az-Arab-IR': ['Arab', 'rtl'], 'az-Latn-AZ': ['Latn', 'ltr'],
    'ms-Arab-MY': ['Arab', 'rtl'], 'ms-MY': ['Latn', 'ltr'],
    'zh-CN': ['Hans', 'ltr'], 'zh-TW': ['Hant', 'ltr'],
    'ar-001': ['Arab', 'rtl'], 'ckb-Arab-IQ': ['Arab', 'rtl'], 'ku-TR': ['Latn', 'ltr'],
    he: ['Hebr', 'rtl'], fa: ['Arab', 'rtl'], ur: ['Arab', 'rtl'], ps: ['Arab', 'rtl'],
    ug: ['Arab', 'rtl'], yi: ['Hebr', 'rtl'], 'ban-Bali-ID': ['Bali', 'ltr']
  };
  for (const [tag, value] of Object.entries(expected)) {
    const { profile } = inspectLocale(tag);
    assert.deepEqual([profile.script, profile.direction], value, tag);
  }
  assert.equal(inspectLocale('ckb-Arab-IQ').id, 'ku');
  assert.equal(inspectLocale('nn-NO').id, 'no');
  assert.deepEqual(inspectLocale('ar-EG').profile.plurals.cardinal.categories, ['zero', 'one', 'two', 'few', 'many', 'other']);
  assert.throws(() => inspectLocale('pa-Latn-PK'), /No profile/);
  assert.throws(() => inspectLocale('x-a'), /Invalid locale/);
});

test('context retrieval distinguishes dialog dismiss and cancellation of renewal', () => {
  const concept = inspectConcept('dialog.dismiss');
  const output = run('inspect', '--locale', 'ms-MY', '--concept', 'billing.stop_renewal', '--json');
  assert.equal(output.status, 0, output.stderr);
  const report = JSON.parse(output.stdout);
  assert.notEqual(report.concept.intent, concept.intent);
  assert.equal(report.wording.status, 'draft');
  assert.ok(report.wording.entries.every(({ status, concept: id }) => status === 'draft' && id === 'billing.stop_renewal'));
  assert.equal(report.profile.tag, 'ms-MY');
});

test('the CLI finds missing keys, exact source copies, placeholder changes, and changed markup', (t) => {
  const result = validate(t, {
    'en.json': { renew: 'Access continues until {date}', link: '<help>{name}</help>', exact: 'Stop auto-renewal', absent: 'Open settings' },
    'ta.json': { renew: '{until} வரை அணுகல் தொடரும்', link: '<b>{name}</b>', exact: 'Stop auto-renewal', orphan: 'தொடரவும்' }
  }, '--source-locale', 'en');
  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.report.errors, 3);
  assert.equal(result.report.warnings, 2);
  assert.deepEqual(result.report.findings.map(({ code }) => code), [
    'placeholder-mismatch', 'markup-mismatch', 'possible-source-copy', 'missing-key', 'extra-key'
  ]);
});

test('the CLI handles i18next interpolation and checks ICU plural and select semantics', (t) => {
  const result = validate(t, {
    'en.json': { receipt: '{{ customer }}', count: '{n, plural, =0 {Empty} one {# item} other {# items}}', selection: '{state, select, open {Open} other {Other}}' },
    'ta.json': { receipt: '{{- customer }}', count: '{n, plural, other {# உருப்படிகள்}}', selection: '{state, select, closed {மூடப்பட்டது} other {வேறு}}' }
  });
  assert.equal(result.status, 1, result.stderr);
  assert.deepEqual(result.report.findings.map(({ code }) => code), [
    'placeholder-mismatch', 'selector-mismatch', 'plural-fallback', 'selector-mismatch'
  ]);
});

test('static TypeScript dictionaries are read without evaluating code', (t) => {
  const result = validate(t, {
    'en.ts': 'throw new Error("must never be executed"); const en = { title: "Continue", nested: { ok: "OK" }, runtime: () => String(1) } as const; export default en;',
    'ta.ts': 'export const ta = { title: "தொடரவும்", nested: { ok: "சரி" }, runtime: () => String(1) } as const;'
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.report.findings.map(({ code }) => code), ['dynamic-value']);
});

test('unsupported spreads fail explicitly for a static dictionary', (t) => {
  const result = validate(t, {
    'en.ts': 'export default { title: "Continue", ...unknown };',
    'ta.json': { title: 'தொடரவும்' }
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /spreads and computed keys/);
});

test('lookup marks rejected lines and points at the preferred replacement', () => {
  const tamil = lookupWording('ta', 'auth.sign_in', 'button').wording;
  assert.equal(tamil.status, 'mixed');
  assert.equal(tamil.disagreement, true);
  assert.equal(tamil.preferred.text, 'உள்நுழை');
  assert.equal(tamil.preferred.status, 'draft');
  assert.equal(tamil.entries.find(({ text }) => text === 'உள்ளே போ').preferred, false);
  assert.equal(lookupWording('hi', 'form.apply_changes', 'button').wording.preferred.text, 'लागू करें');
  assert.equal(lookupWording('de', 'form.save_changes', 'button').wording.preferred.text, 'Speichern');
  const malay = lookupWording('ms', 'item.delete', 'button').wording;
  assert.equal(malay.preferred.text, 'Padam');
  assert.equal(malay.preferred.status, 'draft');
  for (const text of ['Buang', 'Hapuskan']) assert.equal(malay.entries.find((entry) => entry.text === text).preferred, false);
  const japanese = lookupWording('ja', 'dialog.dismiss', 'button').wording;
  assert.equal(japanese.preferred.text, '閉じる');
  assert.equal(japanese.entries.find(({ text }) => text === '完了').preferred, false);
});

test('Traditional Chinese labels are not filed under Simplified zh', () => {
  const simplified = lookupWording('zh-CN', 'search.no_results').wording.entries.map(({ text }) => text);
  assert.ok(!simplified.includes('找不到結果'), simplified.join(', '));
  const traditional = lookupWording('zh-TW', 'search.no_results').wording.entries.map(({ text }) => text);
  assert.ok(traditional.includes('找不到結果'), traditional.join(', '));
});
