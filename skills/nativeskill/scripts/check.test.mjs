import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const root = dirname(fileURLToPath(import.meta.url));
const examples = join(root, '../examples');
const check = join(root, 'check.mjs');
const scan = join(root, 'scan.mjs');

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  if (result.stdout) result.report = JSON.parse(result.stdout);
  return result;
}

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

test('the hardcoded-string scanner finds UI literals and ignores resource references', () => {
  const result = run(scan, ['--json', join(examples, 'flutter/lib/main.dart'), join(examples, 'android/res/layout/activity_main.xml')]);
  assert.equal(result.status, 1, result.stderr);
  const texts = result.report.findings.map(({ text }) => text).sort();
  assert.deepEqual(texts, ['Cancel subscription', 'Pay now']);
  const catalogs = run(scan, ['--json', join(examples, 'flutter/lib/l10n'), join(examples, 'android/res/values')]);
  assert.equal(catalogs.status, 0, catalogs.stderr + catalogs.stdout);
  assert.equal(catalogs.report.findings.length, 0);
});
