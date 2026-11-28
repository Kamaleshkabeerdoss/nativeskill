// Checks the skill's own documents: every relative link resolves, and each locale note exists.
// Runs from the repo and from an installed copy of the skill folder.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = join(dirname(fileURLToPath(import.meta.url)), '..');
const markdown = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : markdown(path);
  return entry.name.endsWith('.md') ? [path] : [];
});

test('relative links in the skill documents resolve', () => {
  const broken = [];
  for (const file of markdown(skill)) {
    for (const [, target] of readFileSync(file, 'utf8').matchAll(/\]\((?!https?:|#|mailto:)([^)\s#]+)/g)) {
      if (!existsSync(join(dirname(file), target))) broken.push(file.slice(skill.length + 1) + ' -> ' + target);
    }
  }
  assert.deepEqual(broken, []);
});

test('SKILL.md links a note for every locale note on disk', () => {
  const skillText = readFileSync(join(skill, 'SKILL.md'), 'utf8');
  for (const name of readdirSync(join(skill, 'references/locales'))) {
    assert.ok(skillText.includes('references/locales/' + name), name + ' is linked from SKILL.md');
  }
  for (const locale of ['th', 'vi', 'fil', 'ko', 'te']) assert.ok(existsSync(join(skill, 'references/locales', locale + '.md')), locale);
});

test('the Tamil note says what to do with the noun அனுமதி in one readable sentence', () => {
  const text = readFileSync(join(skill, 'references/locales/ta.md'), 'utf8');
  assert.doesNotMatch(text, /such as `அனுமதி` is not that verb/);
  assert.match(text, /keep `அனுமதி` and say in the report that it is a noun/);
});
