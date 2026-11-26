import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { checkCatalogs } from './check.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const examples = join(root, '../examples');
const check = join(root, 'check.mjs');
const scan = join(root, 'scan.mjs');
const bin = join(root, '../../../packages/cli/src/cli.mjs');

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  if (result.stdout) result.report = JSON.parse(result.stdout);
  return result;
}

test('the checkout CLI runs the same catalog checker', () => {
  const result = run(bin, ['check', '--json', '--source', join(examples, 'flutter/lib/l10n/app_en.arb'), '--target', join(examples, 'flutter/lib/l10n/app_ms.arb'), '--locale', 'ms', '--source-locale', 'en']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.report.errors, 0);
});

test('clean Flutter, Android, strings, and xcstrings catalogs pass', () => {
  const pairs = [
    ['flutter/lib/l10n/app_en.arb', 'flutter/lib/l10n/app_ms.arb', 'ms', 'en', 'auto'],
    ['android/res/values/strings.xml', 'android/res/values-ta/strings.xml', 'ta', 'en', 'android'],
    ['ios/en.lproj/Localizable.strings', 'ios/ms.lproj/Localizable.strings', 'ms', 'en', 'strings'],
    ['ios/Localizable.xcstrings', 'ios/Localizable.xcstrings', 'ms', 'en', 'xcstrings']
  ];
  for (const [source, target, locale, sourceLocale, format] of pairs) {
    const result = run(check, ['--json', '--source', join(examples, source), '--target', join(examples, target), '--locale', locale, '--source-locale', sourceLocale, '--format', format]);
    assert.equal(result.status, 0, source + '\n' + result.stderr + result.stdout);
    assert.equal(result.report.errors, 0, source);
    assert.equal(result.report.warnings, 0, source);
  }
});

test('seeded catalog bugs are reported and a clean rerun is the fix', () => {
  const broken = run(check, ['--json', '--source', join(examples, 'buggy/app_en.arb'), '--target', join(examples, 'buggy/app_ar.arb'), '--locale', 'ar', '--source-locale', 'en']);
  assert.equal(broken.status, 1, broken.stderr);
  const codes = broken.report.findings.map(({ code }) => code);
  for (const code of ['placeholder-mismatch', 'plural-missing', 'icu-syntax', 'missing-key', 'extra-key', 'possible-source-copy', 'length-blowup']) {
    assert.ok(codes.includes(code), code + ' missing from ' + codes.join(','));
  }
  const fixed = run(check, ['--json', '--source', join(examples, 'flutter/lib/l10n/app_en.arb'), '--target', join(examples, 'flutter/lib/l10n/app_ms.arb'), '--locale', 'ms', '--source-locale', 'en']);
  assert.equal(fixed.status, 0, fixed.stderr);
});

test('checker catches order, select, exact plurals, untranslated catalogs, and skips translatable=false', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-check-'));
  const pair = (name, source, target, locale, format) => {
    const left = join(dir, name + '-source');
    const right = join(dir, name + '-target');
    writeFileSync(left, source);
    writeFileSync(right, target);
    return checkCatalogs({ source: left, target: right, locale, sourceLocale: 'en', format });
  };
  const order = pair('order', '"pair" = "%@ and %d";\n', '"pair" = "%d و %@";\n', 'ar', 'strings');
  assert.ok(order.findings.some(({ code }) => code === 'placeholder-order'));
  const positional = pair('pos', '"pair" = "%@ and %d";\n', '"pair" = "%2$d و %1$@";\n', 'ar', 'strings');
  assert.equal(positional.errors, 0);
  const hidden = pair('xml',
    '<resources><string name="brand" translatable="false">Northwind</string><string name="ok">OK</string></resources>',
    '<resources><string name="ok">حسنا</string></resources>', 'ar', 'android');
  assert.equal(hidden.findings.filter(({ code }) => code === 'missing-key').length, 0);
  const arabic = pair('ar',
    '<resources><plurals name="n"><item quantity="one">%d item</item><item quantity="other">%d items</item></plurals></resources>',
    '<resources><plurals name="n"><item quantity="zero">لا شيء</item><item quantity="one">عنصر واحد</item><item quantity="two">عنصران</item><item quantity="few">%d عناصر</item><item quantity="many">%d عنصرًا</item><item quantity="other">%d عنصر</item></plurals></resources>',
    'ar', 'android');
  assert.equal(arabic.findings.filter(({ key }) => key === 'n.one').length, 0);
  const select = pair('select', '{"g":"{s, select, female {she} male {he} other {they}}"}', '{"g":"{s, select, male {هو} other {هم}}"}', 'ar', 'json');
  assert.ok(select.findings.some(({ code }) => code === 'selector-mismatch'));
  const exact = pair('exact', '{"n":"{c, plural, =0 {none} one {#} other {#}}"}', '{"n":"{c, plural, one {#} other {#}}"}', 'en', 'json');
  assert.ok(exact.findings.some(({ code }) => code === 'exact-choice-missing'));
  const catalog = pair('xc',
    JSON.stringify({ sourceLanguage: 'en', strings: { 'Sign in': { localizations: { en: { stringUnit: { value: 'Sign in' } } } } } }),
    JSON.stringify({ sourceLanguage: 'en', strings: { 'Sign in': {} } }),
    'ar', 'xcstrings');
  assert.ok(catalog.findings.some(({ code }) => code === 'missing-key'));
});

test('the hardcoded-string scanner finds UI literals and ignores resource references', () => {
  const result = run(scan, ['--json', join(examples, 'flutter/lib/main.dart'), join(examples, 'android/res/layout/activity_main.xml')]);
  assert.equal(result.status, 1, result.stderr);
  const texts = result.report.findings.map(({ text }) => text).sort();
  assert.deepEqual(texts, ['Cancel subscription', 'Pay now']);
  const catalogs = run(scan, ['--json', join(examples, 'flutter/lib/l10n'), join(examples, 'android/res/values')]);
  assert.equal(catalogs.status, 0, catalogs.stderr + catalogs.stdout);
  assert.equal(catalogs.report.findings.length, 0);
});

test('a numbered placeholder that changes type is a type error, not an order error', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-type-'));
  writeFileSync(join(dir, 'en.strings'), '"n" = "%1$s has %2$d items";\n');
  writeFileSync(join(dir, 'fr.strings'), '"n" = "%1$d a %2$s éléments";\n');
  const report = checkCatalogs({ source: join(dir, 'en.strings'), target: join(dir, 'fr.strings'), locale: 'fr', sourceLocale: 'en', format: 'strings' });
  const finding = report.findings.find(({ key }) => key === 'n');
  assert.equal(finding.code, 'placeholder-mismatch');
  assert.match(finding.message, /changed type: %1\$s became %1\$d, %2\$d became %2\$s/);
  assert.doesNotMatch(finding.message, /Unnumbered/);
  writeFileSync(join(dir, 'ok.strings'), '"n" = "%2$d éléments pour %1$s";\n');
  const moved = checkCatalogs({ source: join(dir, 'en.strings'), target: join(dir, 'ok.strings'), locale: 'fr', sourceLocale: 'en', format: 'strings' });
  assert.equal(moved.errors, 0);
});

test('an ICU plural branch without # warns when the category covers more than one number', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-pound-'));
  const pair = (name, target, locale) => {
    writeFileSync(join(dir, name + '-en.json'), JSON.stringify({ n: '{count, plural, one {# file} other {# files}}' }));
    writeFileSync(join(dir, name + '.json'), JSON.stringify({ n: target }));
    return checkCatalogs({ source: join(dir, name + '-en.json'), target: join(dir, name + '.json'), locale, sourceLocale: 'en', format: 'json' })
      .findings.filter(({ code }) => code === 'plural-number-missing');
  };
  const french = pair('fr', '{count, plural, one {un fichier} many {# de fichiers} other {# fichiers}}', 'fr');
  assert.equal(french.length, 1);
  assert.match(french[0].message, /one has no # but fr one covers 0, 1/);
  // Arabic zero, one, and two are each exactly one number, so the words can replace #.
  assert.equal(pair('ar', '{count, plural, zero {لا ملفات} one {ملف واحد} two {ملفان} few {# ملفات} many {# ملفًا} other {# ملف}}', 'ar').length, 0);
  assert.equal(pair('ar-other', '{count, plural, zero {لا ملفات} one {ملف واحد} two {ملفان} few {# ملفات} many {# ملفًا} other {ملفات}}', 'ar').length, 1);
  // German one is exactly 1.
  assert.equal(pair('de', '{count, plural, one {Eine Datei} other {# Dateien}}', 'de').length, 0);
  // Exact =0 choices are never flagged.
  assert.equal(pair('ja', '{count, plural, =0 {ファイルなし} other {# 件のファイル}}', 'ja').length, 0);
});
