// Tables keyed by locale, overlays merged by a function, and local helpers. Anonymised from a SaaS
// chat widget and its marketing site, where v0.3.0 could not read the dictionaries at all.
import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCatalogs } from '../../../skills/nativeskill/scripts/check.mjs';
import { readDictionary } from '../../../skills/nativeskill/scripts/dict.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const widget = join(here, 'widget', 'locales.ts');
const extra = join(here, 'marketing', 'extra.ts');
const codes = (result, key) => result.findings.filter((finding) => finding.key === key).map((finding) => finding.code);

test('the exported resolver merges the base table, unexported overlays and an imported overlay', () => {
  const result = checkCatalogs({ source: widget, target: widget, sourceLocale: 'en', locale: 'ta' });
  assert.deepEqual(result.read, { source: 'resolveStrings("en-IN")', target: 'resolveStrings("ta-IN")' });
  assert.equal(result.summary.keys, 8);
  assert.deepEqual(result.findings, [], 'every ta string comes from an overlay or the base table');
});

test('a key missing from every overlay falls back to English and is reported', () => {
  const result = checkCatalogs({ source: widget, target: widget, locale: 'ms' });
  assert.deepEqual(result.findings.map((finding) => finding.key), ['bookConfirm']);
  assert.deepEqual(codes(result, 'bookConfirm'), ['possible-source-copy']);
});

test('an ambiguous language names the keys and the flag, and the flag works', () => {
  assert.throws(() => checkCatalogs({ source: widget, target: widget, locale: 'ar' }), /several keys for ar \(ar-AE, ar-SA\)\. Pass --target-key/);
  const result = checkCatalogs({ source: widget, target: widget, locale: 'ar', targetKey: 'ar-SA' });
  assert.equal(result.read.target, 'resolveStrings("ar-SA")');
  // TICKET_I18N['ar-SA'] = TICKET_I18N['ar-AE'] is applied, so the ticket strings are translated.
  assert.deepEqual(codes(result, 'ticketTitle'), []);
  assert.deepEqual(codes(result, 'historyEmpty'), ['possible-source-copy']);
});

test('--target-export picks the base table alone, keyed by --target-key or --locale', () => {
  const result = checkCatalogs({ source: widget, target: widget, locale: 'ta', export: 'LOCALES' });
  assert.equal(result.read.target, 'LOCALES["ta-IN"]');
  assert.deepEqual(codes(result, 'ticketTitle'), ['possible-source-copy']);
});

test('a Record<Locale, Dict> built from unexported constants and spreads', () => {
  const ms = checkCatalogs({ source: extra, target: extra, locale: 'ms' });
  assert.equal(ms.read.target, 'EXTRA["ms"]');
  assert.deepEqual(ms.findings.map((finding) => [finding.key, finding.code]), [['cta', 'possible-source-copy']]);
  assert.deepEqual(checkCatalogs({ source: extra, target: extra, locale: 'ja' }).findings, []);
});

test('local helpers, Object.fromEntries, .map and .join are evaluated statically', () => {
  const docs = readDictionary(join(here, 'marketing', 'docs.ts'), { locale: 'ms' });
  assert.equal(docs.get('labels.install').text, 'Pasang widget');
  assert.equal(docs.get('labels.whatsapp').text, 'WhatsApp');
  assert.equal(docs.get('sections.2').text, 'Kembangkan');
  const helper = readDictionary(join(here, 'marketing', 'helper.ts'));
  assert.equal(helper.get('tags').text, 'Sales, Support');
});

test('a local plural helper with words in its arguments is reported, not misread as {n} {n}', () => {
  const entry = readDictionary(join(here, 'marketing', 'helper.ts')).get('uploaded');
  assert.equal(entry.dynamic, true);
  assert.match(entry.reason, /plural\(\) with words in its arguments \("file", "files"\)/);
});
