// Real-world regression case. Green today by design:
// - currently-caught entries are normal tests and must keep passing.
// - known-gap entries are node:test `todo` tests. They state the behaviour we want after the fix
//   and are reported as todo, not as failures. When a fix lands, its todo starts passing:
//   flip the entry to "currently-caught" in expected.json and the test becomes a hard check.
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
function run(locale, options = {}) {
  const id = locale + JSON.stringify(options);
  if (!runs.has(id)) runs.set(id, checkCatalogs({ source: json('en'), target: json(locale), locale, ...options }));
  return runs.get(id);
}
const findingsFor = (result, key) => result.findings.filter((finding) => finding.key === key);
const pairs = (entry) => entry.hits
  ? Object.entries(entry.hits).flatMap(([locale, keys]) => keys.map((key) => [locale, key]))
  : entry.locales.flatMap((locale) => entry.keys.map((key) => [locale, key]));
const mustNotFlag = (entry) => Object.entries(entry.mustNotFlag ?? {});

const caught = expected.entries.filter((entry) => entry.layer === 'checker' && entry.status === 'currently-caught');
const gaps = expected.entries.filter((entry) => entry.layer === 'checker' && entry.status === 'known-gap');

for (const entry of caught) {
  test(`[caught, fix ${entry.fix}] ${entry.id}`, () => {
    for (const [locale, key] of pairs(entry)) {
      const hit = findingsFor(run(locale), key).find((finding) => finding.code === entry.today.code);
      assert.ok(hit, `${locale} ${key} should report ${entry.today.code}`);
      assert.equal(hit.severity, entry.today.severity, `${locale} ${key} severity`);
    }
  });
}

const gapChecks = {
  'ts-dictionary-unreadable': (entry) => {
    for (const locale of entry.locales) {
      const fromTs = checkCatalogs({ source: ts('en'), target: ts(locale), locale });
      const fromJson = run(locale);
      assert.deepEqual(fromTs.findings.map((f) => f.code + ' ' + f.key).sort(), fromJson.findings.map((f) => f.code + ' ' + f.key).sort());
    }
  },
  'ts-param-renamed-by-bundler': () => {
    const result = checkCatalogs({ source: ts('en'), target: ts('id'), locale: 'id' });
    assert.equal(findingsFor(result, 'contacts.externalId').length, 0);
  },
  'arabic-hand-rolled-plural': (entry) => {
    const result = checkCatalogs({ source: ts('en'), target: ts('ar'), locale: 'ar' });
    for (const key of entry.keys) assert.ok(findingsFor(result, key).some((f) => f.code === entry.want.code), key);
  },
  'optional-section-omitted-on-purpose': (entry) => {
    for (const [locale, key] of pairs(entry)) {
      const result = run(locale, { allowMissing: ['extras'] });
      assert.equal(findingsFor(result, key).length, 0, `${locale} ${key}`);
    }
  },
  'brand-kept-in-english': (entry) => {
    for (const [locale, key] of pairs(entry)) {
      assert.equal(findingsFor(run(locale, { keepEnglish: ['Acme'] }), key).length, 0, `${locale} ${key}`);
    }
  },
  'repeated-placeholder-dropped-legitimately': (entry) => {
    for (const [locale, key] of pairs(entry)) {
      const found = findingsFor(run(locale), key);
      assert.ok(found.some((f) => f.code === entry.want.code && f.severity === 'warning'), `${locale} ${key}`);
      assert.ok(!found.some((f) => f.severity === 'error'), `${locale} ${key} should not be an error`);
    }
  },
  'stale-after-english-changed': (entry) => {
    for (const [locale, key] of pairs(entry)) {
      const result = run(locale, { baseline: join(here, entry.baseline) });
      assert.ok(findingsFor(result, key).some((f) => f.code === entry.want.code), `${locale} ${key}`);
    }
  }
};

function wantCode(entry) {
  for (const [locale, key] of pairs(entry)) {
    assert.ok(findingsFor(run(locale), key).some((f) => f.code === entry.want.code), `${locale} ${key} should report ${entry.want.code}`);
  }
  for (const [locale, keys] of mustNotFlag(entry)) {
    const result = run(locale);
    const flagged = result.findings.filter((f) => f.code === entry.want.code && (keys.includes('*') || keys.includes(f.key)));
    assert.equal(flagged.length, 0, `${locale} must not report ${entry.want.code}: ${flagged.map((f) => f.key).join(', ')}`);
  }
}

for (const entry of gaps) {
  test(`[known gap, fix ${entry.fix}] ${entry.id}`, { todo: `fix ${entry.fix}: ${expected.fixPlan[entry.fix]}` }, () => {
    (gapChecks[entry.id] ?? wantCode)(entry);
  });
}

test('fixture integrity: agent-layer defects are still present in the excerpt', () => {
  for (const entry of expected.entries.filter((item) => item.layer === 'agent' && item.current)) {
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
});
