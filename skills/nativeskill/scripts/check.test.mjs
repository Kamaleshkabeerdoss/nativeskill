import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
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
  if (result.stdout && args.includes("--json")) result.report = JSON.parse(result.stdout);
  return result;
}

// packages/cli lives only in the repository. An installed copy of the skill folder skips this test.
test('the checkout CLI runs the same catalog checker', { skip: !existsSync(bin) && 'CLI exists only in the repo checkout' }, () => {
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

test('TS dictionaries are checked directly, and an unreadable one exits 3 with a real next step', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-ts-'));
  writeFileSync(join(dir, 'en.ts'), "export const en = {\n  files: (count: number) => `${count} file${count === 1 ? '' : 's'}`,\n  save: 'Save',\n}\n");
  writeFileSync(join(dir, 'ms.ts'), "import { en } from './en'\nexport const ms: typeof en = {\n  files: (total) => `${total} fail`,\n  save: 'Simpan',\n}\n");
  const result = run(check, ['--json', '--source', join(dir, 'en.ts'), '--target', join(dir, 'ms.ts'), '--locale', 'ms']);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.report.findings.find(({ key }) => key === 'files').message, /Source has \{count\}\. Target has \{total\}/);
  writeFileSync(join(dir, 'bad.ts'), "export default {\n  save: 'Save,\n}\n");
  const bad = spawnSync(process.execPath, [check, '--source', join(dir, 'en.ts'), '--target', join(dir, 'bad.ts'), '--locale', 'ms'], { encoding: 'utf8' });
  assert.equal(bad.status, 3);
  assert.match(bad.stderr, /bad\.ts:2: Unclosed string/);
  assert.doesNotMatch(bad.stderr, /nativeskill validate/);
});

test('the scanner reads TS/JS source but skips files that are locale dictionaries', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-scan-ts-'));
  writeFileSync(join(dir, 'en.ts'), "export const en = { title: 'Inbox', hint: 'Connect your address', label: 'Save changes' }\n");
  writeFileSync(join(dir, 'Page.tsx'), "export const Page = () => <Field label='Your email address' />\n");
  const result = run(scan, ['--json', dir]);
  assert.deepEqual(result.report.findings.map(({ text }) => text), ['Your email address']);
});

test('.nativeskillrc and flags allow deliberate omissions and kept English, and report what they hid', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-config-'));
  writeFileSync(join(dir, 'en.json'), JSON.stringify({ brand: 'Acme', save: 'Save', extras: { title: 'Data tools' }, debug: { x: 'X' } }));
  writeFileSync(join(dir, 'ms.json'), JSON.stringify({ brand: 'Acme', save: 'Save', debug: {} }));
  const bare = checkCatalogs({ source: join(dir, 'en.json'), target: join(dir, 'ms.json'), locale: 'ms' });
  assert.deepEqual(bare.findings.map(({ code, key }) => code + ' ' + key).sort(),
    ['missing-key debug.x', 'missing-key extras.title', 'possible-source-copy brand', 'possible-source-copy save']);
  writeFileSync(join(dir, '.nativeskillrc'), JSON.stringify({ allowMissing: ['extras'], keepEnglish: ['Acme'], locales: { ms: { ignoreKeys: ['debug.*'] } } }));
  const configured = checkCatalogs({ source: join(dir, 'en.json'), target: join(dir, 'ms.json'), locale: 'ms' });
  assert.deepEqual(configured.findings.map(({ code, key }) => code + ' ' + key), ['possible-source-copy save']);
  assert.deepEqual(configured.suppressed.map(({ key, suppressedBy }) => key + ' ' + suppressedBy).sort(),
    ['brand keepEnglish', 'debug.x ignoreKeys', 'extras.title allowMissing']);
  assert.equal(configured.errors, 0);
  const ignored = run(check, ['--json', '--no-config', '--allow-missing', 'extras', '--source', join(dir, 'en.json'), '--target', join(dir, 'ms.json'), '--locale', 'ms']);
  assert.equal(ignored.status, 1);
  assert.deepEqual(ignored.report.suppressed.map(({ key }) => key), ['extras.title']);
});

test('the summary reports coverage per section and the text output groups repeated warnings', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-summary-'));
  const source = { nav: { home: 'Home', save: 'Save' }, inbox: Object.fromEntries(Array.from({ length: 8 }, (_, i) => ['k' + i, 'Inbox text ' + i])) };
  const target = { nav: { home: 'Utama', save: 'Simpan' }, inbox: source.inbox };
  writeFileSync(join(dir, 'en.json'), JSON.stringify(source));
  writeFileSync(join(dir, 'ms.json'), JSON.stringify(target));
  const result = checkCatalogs({ source: join(dir, 'en.json'), target: join(dir, 'ms.json'), locale: 'ms', noConfig: true });
  const inbox = result.summary.sections.find((item) => item.section === 'inbox');
  assert.equal(inbox.untranslated, true);
  assert.equal(inbox.sourceCopy, 8);
  assert.equal(result.summary.coveragePct, 20);
  const text = run(check, ['--no-config', '--source', join(dir, 'en.json'), '--target', join(dir, 'ms.json'), '--locale', 'ms']);
  assert.match(text.stdout, /Coverage ms: 2 of 10 keys translated \(20%\)/);
  assert.match(text.stdout, /possible-source-copy 8 keys in inbox/);
  const verbose = run(check, ['--no-config', '--verbose', '--source', join(dir, 'en.json'), '--target', join(dir, 'ms.json'), '--locale', 'ms']);
  assert.match(verbose.stdout, /possible-source-copy inbox\.k7/);
});

function pairCheck(source, target, locale, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-pair-'));
  writeFileSync(join(dir, 'en.json'), JSON.stringify(source));
  writeFileSync(join(dir, locale + '.json'), JSON.stringify(target));
  return checkCatalogs({ source: join(dir, 'en.json'), target: join(dir, locale + '.json'), locale, noConfig: true, ...extra(dir) });
}
const codesOf = (result) => result.findings.map(({ code, key }) => code + ' ' + key).sort();

test('machine-translation tells: padded placeholders, invisible characters, English residue', () => {
  const source = { a: 'Delete "{name}"?', b: 'Leave {workspace}?', c: 'Read our docs', d: 'Selected {noun}(s)', e: 'Edit {name}?' };
  const ms = pairCheck(source, { a: 'Padam " {name} "?', b: 'Tinggalkan {workspace} ?', c: 'Baca\u200B dokumen kami', d: '{noun} (s) dipilih', e: 'Sunting {name}?' }, 'ms', () => ({}));
  assert.deepEqual(codesOf(ms), ['english-residue d', 'invisible-character c', 'placeholder-spacing a', 'placeholder-spacing b']);
  // French puts a space before ? and !; Thai uses U+200B to mark word breaks.
  assert.deepEqual(codesOf(pairCheck({ b: 'Leave {workspace}?' }, { b: 'Quitter {workspace} ?' }, 'fr', () => ({}))), []);
  assert.deepEqual(codesOf(pairCheck({ c: 'Read our docs' }, { c: 'อ่าน\u200Bเอกสาร' }, 'th', () => ({}))), []);
  assert.deepEqual(codesOf(pairCheck({ c: 'Read the guide for your team' }, { c: 'اقرأ the guide for your team' }, 'ar', () => ({}))), ['english-residue c']);
});

test('count before noun: Malay, Indonesian, Vietnamese, Arabic, Filipino and Thai classifiers', () => {
  const source = { a: '{count} messages · {ago}', b: 'Upload {count} files', c: '{n} pages left', d: '{n} pages left' };
  const ms = pairCheck(source, { a: 'Mesej {count} · {ago}', b: 'Muat naik fail {count}', c: 'Halaman {n} tinggal', d: 'Tinggal {n} halaman' }, 'ms', () => ({}));
  assert.deepEqual(codesOf(ms), ['count-noun-order a', 'count-noun-order b', 'count-noun-order c']);
  const good = pairCheck(source, { a: '{count} mesej · {ago}', b: 'Muat naik {count} fail', c: '{n} halaman lagi', d: 'Masih ada {n} halaman' }, 'ms', () => ({}));
  assert.deepEqual(codesOf(good), []);
  const th = pairCheck({ a: '{count} files' }, { a: 'ไฟล์ {count}' }, 'th', () => ({}));
  assert.deepEqual(codesOf(th), ['count-noun-order a']);
  assert.deepEqual(codesOf(pairCheck({ a: '{count} files' }, { a: 'ไฟล์ {count} ไฟล์' }, 'th', () => ({}))), []);
  // Page {n} is a label, not a count; the source has no plural noun after the number.
  assert.deepEqual(codesOf(pairCheck({ a: 'Page {n}' }, { a: 'Halaman {n}' }, 'ms', () => ({}))), []);
  assert.deepEqual(codesOf(pairCheck({ a: '{count} files' }, { a: '{count} 个文件' }, 'zh', () => ({}))), []);
});

test('--old-source reports translations of English that changed, and --glossary enforces one term', () => {
  const result = pairCheck({ a: 'Launcher greeting', b: 'Read leads', c: 'Leads' }, { a: 'Petua alat', b: 'Baca petunjuk', c: 'Prospek' }, 'ms', (dir) => {
    writeFileSync(join(dir, 'old.json'), JSON.stringify({ a: 'Tooltip', b: 'Read leads', c: 'Leads' }));
    writeFileSync(join(dir, 'glossary.json'), JSON.stringify({ lead: { source: '\\bleads?\\b', ms: 'prospek', avoid: { ms: ['petunjuk'] } } }));
    return { oldSource: join(dir, 'old.json'), glossary: join(dir, 'glossary.json') };
  });
  assert.deepEqual(codesOf(result), ['source-changed a', 'term-inconsistent b', 'wrong-word b']);
});

test('function dictionaries: English left in a branch and hand-rolled plurals for many-form locales', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-branch-'));
  writeFileSync(join(dir, 'en.ts'), "export default { imp: (n: number) => n ? `Import ${n}` : 'Import', files: (count: number) => `${count} file${count === 1 ? '' : 's'}` };\n");
  writeFileSync(join(dir, 'ar.ts'), "export default { imp: (n: number) => n ? `استيراد ${n}` : 'Import', files: (count: number) => `${count} ملف` };\n");
  writeFileSync(join(dir, 'ms.ts'), "export default { imp: (n: number) => n ? `Import ${n}` : 'Import', files: (count: number) => `${count} fail` };\n");
  const ar = checkCatalogs({ source: join(dir, 'en.ts'), target: join(dir, 'ar.ts'), locale: 'ar', noConfig: true });
  assert.deepEqual(codesOf(ar), ['english-in-branch imp', 'hand-rolled-plural files']);
  const ms = checkCatalogs({ source: join(dir, 'en.ts'), target: join(dir, 'ms.ts'), locale: 'ms', noConfig: true });
  assert.deepEqual(codesOf(ms), ['possible-source-copy imp']);
  const scanned = run(scan, ['--json', join(dir, 'en.ts')]);
  assert.deepEqual(scanned.report.findings.map(({ kind, line }) => kind + ':' + line), ['hand-rolled-plural:1']);
});

test('a repeated placeholder said once is a warning, and Filipino gets more room before length-blowup', () => {
  const result = pairCheck({ a: 'No {items} found. Share the {items} you want.', b: 'Rename', c: 'Leads' },
    { a: '{items} が見つかりません。共有してください。', b: 'Palitan ang pangalan', c: 'Khách hàng tiềm năng' }, 'ja', () => ({}));
  assert.deepEqual(result.findings.map(({ code, severity, key }) => key + ' ' + code + ' ' + severity).filter((line) => line.startsWith('a')), ['a placeholder-repeat-dropped warning']);
  assert.deepEqual(codesOf(pairCheck({ b: 'Rename' }, { b: 'Palitan ang pangalan' }, 'fil', () => ({}))), []);
  assert.deepEqual(codesOf(pairCheck({ c: 'Leads' }, { c: 'Khách hàng tiềm năng' }, 'vi', () => ({}))), ['length-blowup c']);
  assert.deepEqual(codesOf(pairCheck({ a: 'Share {a} with {b}' }, { a: 'Kongsi {a}' }, 'ms', () => ({}))), ['placeholder-mismatch a']);
});

test('every audit checklist pattern fires on its example and stays quiet on the fix', () => {
  const cases = [
    ['renewal-uses-dialog-cancel', 'ms', 'Cancels at period end', 'Batal pada akhir tempoh', 'Akan dibatalkan pada akhir tempoh'],
    ['ar-download-is-upload', 'ar', 'Download', 'تحميل', 'تنزيل'],
    ['zh-filter-device', 'zh', 'Filters', '过滤器', '筛选'],
    ['ta-archive-is-copy', 'ta', 'Archive', 'காப்பிடு', 'காப்பகப்படுத்து'],
    ['hi-skip-is-not-now', 'hi', 'Skip', 'अभी नहीं', 'छोड़ें'],
    ['de-sie-glued-to-infinitive', 'de', 'Download', 'Herunterladen Sie', 'Herunterladen'],
    ['ja-button-is-a-sentence', 'ja', 'Save', '保存します', '保存'],
    ['zh-nin-and-ni-in-one-string', 'zh', 'Your account', '您的账户和你的设置', '您的账户'],
    ['ms-indonesian-word', 'ms', 'Download', 'Unduh', 'Muat turun'],
    ['ta-back-means-again', 'ta', 'Back', 'மீண்டும்', 'பின்செல்'],
    ['ta-clear-means-clarity', 'ta', 'Clear', 'தெளிவு', 'அழி'],
    ['ms-generic-error-loses-wrong', 'ms', 'Something went wrong.', 'Sesuatu telah berlaku.', 'Ada masalah.'],
    ['vi-scope-is-camera-lens', 'vi', 'Scopes', 'Ống kính', 'Phạm vi'],
    ['lead-as-metal-verb-or-clue', 'ar', 'No lead scoring.', 'لا يوجد تسجيل الرصاص.', 'لا يوجد تقييم للعملاء المحتملين.'],
    ['ar-revoke-uses-cancel-word', 'ar', 'Revoke "{name}"?', 'إلغاء "{name}"؟', 'إبطال "{name}"؟'],
    ['id-renews-on-without-on', 'id', 'Renews on', 'Memperbarui', 'Diperbarui pada']
  ];
  for (const [id, locale, english, bad, good] of cases) {
    const wrong = pairCheck({ k: english }, { k: bad }, locale, () => ({})).findings.filter((f) => f.code === 'wrong-word');
    assert.ok(wrong.some((f) => f.message.includes('[' + id + ']')), id + ' fires on ' + bad);
    const right = pairCheck({ k: english }, { k: good }, locale, () => ({})).findings.filter((f) => f.code === 'wrong-word');
    assert.deepEqual(right.map((f) => f.message), [], id + ' quiet on ' + good);
  }
  // Daftar is fine in Malay and Indonesian; the dialog Cancel word is fine on a dialog.
  assert.deepEqual(codesOf(pairCheck({ k: 'Sign up' }, { k: 'Daftar' }, 'ms', () => ({}))), []);
  assert.deepEqual(codesOf(pairCheck({ k: 'Cancel' }, { k: 'Batal' }, 'ms', () => ({}))), []);
  const mixed = pairCheck({ a: 'Save your file', b: 'Open your file', c: 'Edit your file' }, { a: 'Speichern Sie Ihre Datei.', b: 'Öffnen Sie Ihre Datei.', c: 'Bearbeite deine Datei.' }, 'de', () => ({}));
  assert.ok(mixed.findings.some((f) => f.key === 'c' && f.message.includes('[de-du-and-sie]')));
  assert.equal(pairCheck({ k: 'Download' }, { k: 'تحميل' }, 'ar', () => ({ audit: false })).findings.length, 0);
});

test('findings carry a triage bucket, and the text report leads with the counts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-buckets-'));
  writeFileSync(join(dir, 'en.json'), JSON.stringify({ a: 'Pay {amount}', b: 'Download', c: 'Delete "{name}"?', d: 'Help' }));
  writeFileSync(join(dir, 'ar.json'), JSON.stringify({ a: 'ادفع', b: 'تحميل', c: 'حذف " {name} "؟', d: 'Help' }));
  const result = run(check, ['--json', '--no-config', '--source', join(dir, 'en.json'), '--target', join(dir, 'ar.json'), '--locale', 'ar']);
  assert.equal(result.report.schema, 2);
  assert.deepEqual(result.report.findings.map(({ key, code, bucket }) => key + ' ' + code + ' ' + bucket),
    ['a placeholder-mismatch P1', 'b wrong-word P2', 'c placeholder-spacing P3', 'd possible-source-copy P2']);
  assert.deepEqual(result.report.summary.buckets, { P1: 1, P2: 2, P3: 1 });
  const text = run(check, ['--no-config', '--source', join(dir, 'en.json'), '--target', join(dir, 'ar.json'), '--locale', 'ar']);
  assert.match(text.stdout.split('\n')[0], /^Triage: P1 broken or missing 1 · P2 wrong meaning or still English 2 · P3 polish 1$/);
  assert.match(text.stdout, /error P1 placeholder-mismatch a[\s\S]*warning P2 wrong-word b[\s\S]*warning P3 placeholder-spacing c/);
});

test('english-in-branch also fires when the main (count) branch is English and another branch is translated', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-branch-'));
  const fn = (other, main = '`Import ${n} into knowledge base`') => `export default { imp: (n: number) => n ? ${main} : '${other}', all: (n: number) => n ? \`\${n} plan\` : 'No plan' };\n`;
  writeFileSync(join(dir, 'en.ts'), fn('Import into knowledge base'));
  writeFileSync(join(dir, 'ms.ts'), fn('Import ke dalam pangkalan pengetahuan').replace("'No plan'", "'No plan'"));
  writeFileSync(join(dir, 'th.ts'), fn('นำเข้าสู่ฐานความรู้', '`Import ${n} items to the knowledge base`'));
  writeFileSync(join(dir, 'ja.ts'), fn('ナレッジベースにインポート', '`${n} 件をナレッジベースにインポート`'));
  const ms = checkCatalogs({ source: join(dir, 'en.ts'), target: join(dir, 'ms.ts'), locale: 'ms', noConfig: true, minCoverage: 0 });
  // One finding per key; the fully English `all` stays a plain source copy.
  assert.deepEqual(codesOf(ms), ['possible-source-copy all', 'english-in-branch imp'].sort());
  assert.match(ms.findings.find((f) => f.key === 'imp').message, /main branch .* still English: "Import \{n\} into knowledge base"/);
  const th = checkCatalogs({ source: join(dir, 'en.ts'), target: join(dir, 'th.ts'), locale: 'th', noConfig: true, minCoverage: 0 });
  assert.ok(codesOf(th).includes('english-in-branch imp'), 'English-like text in a non-Latin locale counts even when it differs from the source');
  const ja = checkCatalogs({ source: join(dir, 'en.ts'), target: join(dir, 'ja.ts'), locale: 'ja', noConfig: true, minCoverage: 0 });
  assert.ok(!codesOf(ja).includes('english-in-branch imp'));
});
