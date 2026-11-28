// Every flag that a help text, an error message or the docs tell the user to pass must exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECK_OPTIONS } from './check.mjs';
import { DICT_OPTIONS } from './dict.mjs';

const scripts = dirname(fileURLToPath(import.meta.url));
const skill = dirname(scripts);
const run = (script, args) => spawnSync(process.execPath, [join(scripts, script), ...args], { encoding: 'utf8' });
const flagsIn = (text) => [...new Set(text.match(/(?<![\w-])--[a-z][a-z-]*[a-z]/g) ?? [])];

const ACCEPTED = {
  'check.mjs': new Set([...Object.keys(CHECK_OPTIONS), '--help']),
  'dict.mjs': new Set([...Object.keys(DICT_OPTIONS), '--branches', '--help']),
  'scan.mjs': new Set(['--json', '--help']),
  'lookup.mjs': new Set(['--help'])
};

test('help texts only name flags their script accepts', () => {
  for (const [script, accepted] of Object.entries(ACCEPTED)) {
    for (const flag of flagsIn(run(script, ['--help']).stdout)) assert.ok(accepted.has(flag), script + ' --help names ' + flag + ', which it does not accept');
  }
});

test('every accepted check.mjs flag parses', () => {
  for (const [flag, spec] of Object.entries(CHECK_OPTIONS)) {
    const result = run('check.mjs', spec.flag ? [flag] : [flag, 'x']);
    assert.doesNotMatch(result.stderr, /Unknown option/, flag);
  }
});

test('unknown options say so in every script', () => {
  for (const script of Object.keys(ACCEPTED)) {
    const result = run(script, script === 'lookup.mjs' ? ['ms', 'save', '--bogus'] : ['--bogus', 'x.json']);
    assert.equal(result.status, 2, script);
    assert.match(result.stderr, /Unknown option --bogus/, script);
  }
});

test('the docs only pass flags the named script accepts', () => {
  const docs = [join(skill, 'SKILL.md'), ...readdirSync(join(skill, 'references'), { recursive: true }).filter((name) => name.endsWith('.md')).map((name) => join(skill, 'references', name))];
  const readme = join(skill, '..', '..', 'README.md');
  if (existsSync(readme)) docs.push(readme);
  for (const file of docs) {
    const text = readFileSync(file, 'utf8').replace(/\\\n\s*/g, ' ');
    for (const line of text.split('\n')) {
      for (const match of line.matchAll(/\b(check|dict|scan|lookup)\.mjs\b([^`|]*)/g)) {
        for (const flag of flagsIn(match[2])) {
          assert.ok(ACCEPTED[match[1] + '.mjs'].has(flag), file + ': ' + match[1] + '.mjs is shown with ' + flag + ', which it does not accept');
        }
      }
    }
  }
});

function suggestionWorks(files, args, value) {
  const failed = run('check.mjs', args);
  assert.equal(failed.status, 3, failed.stderr);
  const flag = failed.stderr.match(/Pass (--[a-z-]+)/)?.[1];
  assert.ok(flag, 'the error names a flag: ' + failed.stderr);
  assert.ok(CHECK_OPTIONS[flag], flag + ' is a check.mjs option');
  const fixed = run('check.mjs', [...args, flag, value]);
  assert.ok(fixed.status === 0 || fixed.status === 1, flag + ' ' + value + ' -> ' + fixed.status + ' ' + fixed.stderr);
}

test('the flags suggested by read errors exist and fix the error', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-cli-'));
  writeFileSync(join(dir, 'en.ts'), "export const a = { hi: 'Hi there', bye: 'Goodbye' }\nexport const b = { hi: 'Hello', bye: 'Bye' }\n");
  writeFileSync(join(dir, 'ms.json'), '{ "hi": "Hai", "bye": "Selamat tinggal" }');
  suggestionWorks(dir, ['--source', join(dir, 'en.ts'), '--target', join(dir, 'ms.json'), '--locale', 'ms'], 'a');
  writeFileSync(join(dir, 't.ts'), "export const T = {\n  en: { hi: 'Hi there' },\n  'pt-BR': { hi: 'Olá' },\n  'pt-PT': { hi: 'Olá' },\n}\n");
  suggestionWorks(dir, ['--source', join(dir, 't.ts'), '--target', join(dir, 't.ts'), '--locale', 'pt'], 'pt-PT');
  const alias = run('check.mjs', ['--source', join(dir, 'en.ts'), '--target', join(dir, 'en.ts'), '--source-locale', 'en', '--locale', 'en-GB', '--export', 'a']);
  assert.equal(alias.status, 0, alias.stderr);
});

test('read errors name the file, and the line for JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nativeskill-cli-'));
  writeFileSync(join(dir, 'bad.json'), '{\n  "a": "A",\n  "b": "B",,\n}\n');
  const bad = run('check.mjs', ['--source', join(dir, 'bad.json'), '--target', join(dir, 'bad.json'), '--locale', 'ms']);
  assert.equal(bad.status, 3);
  assert.match(bad.stderr, /bad\.json:3:\d+: not valid JSON/);
  const missing = run('check.mjs', ['--source', join(dir, 'nope.json'), '--target', join(dir, 'bad.json'), '--locale', 'ms']);
  assert.equal(missing.status, 3);
  assert.match(missing.stderr, /nope\.json: no such file/);
  const locale = run('check.mjs', ['--source', join(dir, 'bad.json'), '--target', join(dir, 'bad.json'), '--locale', 'xx']);
  assert.equal(locale.status, 2);
  assert.match(locale.stderr, /Unknown locale tag "xx"/);
});
