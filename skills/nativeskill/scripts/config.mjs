// Project settings for check.mjs: deliberate omissions, kept-English terms and ignored keys.
//
// Looked up from the target catalog's folder upward: .nativeskillrc, .nativeskillrc.json, or
// nativeskill.config.json. JSON. Paths inside it are relative to the file.
//
// {
//   "allowMissing": ["apiTools", "dataTools.*"],      // optional sections that fall back to English on purpose
//   "keepEnglish": ["Acme", "WhatsApp", "/^https?:/"], // brands and terms that stay English
//   "ignoreKeys": ["debug.*"],                         // never report these keys
//   "glossary": "glossary.json",                        // used by the terminology check
//   "oldSource": "en.previous.json",                    // used by the stale-string check
//   "locales": { "ar": { "allowMissing": ["marketing"] } }
// }
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const CONFIG_NAMES = ['.nativeskillrc', '.nativeskillrc.json', 'nativeskill.config.json'];

export function findConfig(start) {
  let directory = resolve(start);
  for (;;) {
    for (const name of CONFIG_NAMES) {
      const path = join(directory, name);
      if (existsSync(path)) return path;
    }
    const parent = dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

export function readConfig(path) {
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error('Could not read ' + path + ': ' + error.message);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(path + ' must be a JSON object');
  return { ...data, path };
}

const list = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);

function toPattern(item) {
  if (item instanceof RegExp) return item;
  const text = String(item);
  const regex = text.match(/^\/(.+)\/([a-z]*)$/);
  if (regex) return new RegExp(regex[1], regex[2]);
  return null;
}

// A key pattern is a prefix ("extras" matches extras and extras.*), a glob ("billing.*Title"), or /regex/.
export function keyMatcher(patterns) {
  const tests = list(patterns).map((item) => {
    const regex = toPattern(item);
    if (regex) return (key) => regex.test(key);
    const text = String(item);
    if (text.includes('*')) {
      const glob = new RegExp('^' + text.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
      return (key) => glob.test(key);
    }
    return (key) => key === text || key.startsWith(text + '.') || key.startsWith(text + '#');
  });
  return (key) => tests.some((test) => test(key));
}

// True when the text is nothing but kept terms, placeholders, numbers and punctuation.
export function keptEnglish(terms, text) {
  let rest = String(text);
  for (const item of list(terms)) {
    const regex = toPattern(item);
    if (regex) {
      if (regex.test(text)) return true;
      continue;
    }
    rest = rest.split(String(item)).join(' ');
  }
  rest = rest.replace(/\{[^{}]*\}|%(?:\d+\$)?[a-z@]+/gi, ' ');
  return !/\p{L}/u.test(rest);
}

export function resolveSettings(options) {
  let file = null;
  if (options.config) file = readConfig(resolve(options.config));
  else if (!options.noConfig && options.target) {
    const found = findConfig(dirname(resolve(options.target)));
    if (found) file = readConfig(found);
  }
  const language = options.locale ? new Intl.Locale(options.locale).language : null;
  const scoped = file?.locales ? [file.locales[options.locale], language && file.locales[language]].filter(Boolean) : [];
  const merged = (name) => [...list(file?.[name]), ...scoped.flatMap((item) => list(item[name])), ...list(options[name])];
  const relative = (value) => (value && file && typeof value === 'string' ? resolve(dirname(file.path), value) : value);
  return {
    configPath: file?.path ?? null,
    allowMissing: merged('allowMissing'),
    keepEnglish: merged('keepEnglish'),
    ignoreKeys: merged('ignoreKeys'),
    glossary: options.glossary ?? relative(scoped.find((item) => item.glossary)?.glossary ?? file?.glossary),
    oldSource: options.oldSource ?? relative(file?.oldSource)
  };
}

const ENGLISH_CODES = new Set(['possible-source-copy', 'english-in-branch', 'section-aliased', 'english-residue']);

// Splits findings into reported and suppressed. Suppressed ones keep the reason, so nothing disappears silently.
export function applySettings(findings, settings, sourceText) {
  const allowed = keyMatcher(settings.allowMissing);
  const ignored = keyMatcher(settings.ignoreKeys);
  const kept = [];
  const suppressed = [];
  for (const finding of findings) {
    let reason = null;
    if (ignored(finding.key)) reason = 'ignoreKeys';
    else if (allowed(finding.key) && (finding.code === 'missing-key' || ENGLISH_CODES.has(finding.code))) reason = 'allowMissing';
    else if (ENGLISH_CODES.has(finding.code) && settings.keepEnglish.length && keptEnglish(settings.keepEnglish, sourceText(finding.key) ?? '')) reason = 'keepEnglish';
    if (reason) suppressed.push({ ...finding, suppressedBy: reason });
    else kept.push(finding);
  }
  return { kept, suppressed };
}
