// Wrong-word audit for check.mjs: the SKILL.md audit checklist as data (assets/audit-patterns.json).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PATTERNS = new URL('../assets/audit-patterns.json', import.meta.url);
let cache;

export function loadPatterns(path = fileURLToPath(PATTERNS)) {
  if (cache?.path === path) return cache.data;
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const compile = (text) => (text == null ? null : new RegExp(text, 'iu'));
  const compileCase = (text) => new RegExp(text, 'u');
  const patterns = data.patterns.map((item) => ({ ...item, sourceRe: compile(item.source), targetRe: compile(item.target) }));
  const fileMix = (data.fileMix ?? []).map((item) => ({ ...item, formRes: Object.entries(item.forms).map(([name, text]) => [name, compileCase(text)]) }));
  cache = { path, data: { patterns, fileMix } };
  return cache.data;
}

const isShort = (text) => text.trim().split(/\s+/).length <= 2 && !/[.?!:]\s*$/.test(text.trim());

function suggestion(item, locale, language) {
  const value = item.suggest?.[locale] ?? item.suggest?.[language];
  return value ? ' Suggested: ' + value + '.' : '';
}

export function auditCatalog(left, right, locale, add) {
  const language = new Intl.Locale(locale).language;
  const { patterns, fileMix } = loadPatterns();
  const active = patterns.filter((item) => item.locales.includes(language) || item.locales.includes(locale));
  const mixes = fileMix.filter((item) => item.locales.includes(language));
  const counts = mixes.map((item) => new Map(item.formRes.map(([name]) => [name, []])));
  for (const [key, message] of left) {
    const target = right.get(key);
    if (!target || target.missing || target.dynamic || message.dynamic || message.plural || target.plural) continue;
    const texts = [target.text, ...(target.variants ?? [])];
    for (const item of active) {
      if (item.sourceRe && !item.sourceRe.test(message.text)) continue;
      if (item.short && !isShort(message.text)) continue;
      if (item.sourceRe === null && item.targetRe.test(message.text)) continue;
      const hit = texts.find((text) => item.targetRe.test(text));
      if (hit === undefined) continue;
      add('wrong-word', 'warning', key, item.message + suggestion(item, locale, language) + ' [' + item.id + ']');
    }
    mixes.forEach((item, index) => {
      for (const [name, re] of item.formRes) if (re.test(target.text)) counts[index].get(name).push(key);
    });
  }
  mixes.forEach((item, index) => {
    const forms = [...counts[index]].filter(([, keys]) => keys.length);
    if (forms.length < 2) return;
    forms.sort((a, b) => b[1].length - a[1].length);
    const [major] = forms[0];
    for (const [name, keys] of forms.slice(1)) {
      for (const key of keys) add('wrong-word', 'warning', key, item.message + ' Most strings use ' + major + '; this one uses ' + name + '. [' + item.id + ']');
    }
  });
}
