import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pluralOrder = ['zero', 'one', 'two', 'few', 'many', 'other'];

function lengthOf(text) {
  if (typeof Intl.Segmenter === 'function') return [...new Intl.Segmenter().segment(text)].length;
  return [...text].length;
}

function pluralCategories(locale, type) {
  const categories = new Intl.PluralRules(locale, { type }).resolvedOptions().pluralCategories;
  return pluralOrder.filter((category) => categories.includes(category));
}

function skipSpace(text, index) {
  while (index < text.length && /\s/.test(text[index])) index += 1;
  return index;
}

function readName(text, index) {
  const start = index;
  while (index < text.length && /[\p{L}\p{N}_$-]/u.test(text[index])) index += 1;
  if (index === start) throw new Error('Missing placeholder name');
  return [text.slice(start, index), index];
}

function parseMessage(text, start, closer) {
  const placeholders = [];
  const plurals = [];
  let index = start;
  while (index < text.length) {
    if (closer && text[index] === closer) return { placeholders, plurals, index };
    if (text.startsWith('%%', index)) {
      index += 2;
      continue;
    }
    const printf = text.slice(index).match(/^%(?:\d+\$)?(?:lld|lli|ld|lu|d|i|u|f|s|@)/);
    if (printf) {
      placeholders.push(printf[0]);
      index += printf[0].length;
      continue;
    }
    if (text.startsWith('{{', index)) {
      const end = text.indexOf('}}', index + 2);
      if (end < 0) throw new Error('Unclosed {{placeholder}}');
      const body = text.slice(index + 2, end).trim();
      const unescaped = body.startsWith('-');
      const name = (unescaped ? body.slice(1) : body).split(',')[0].trim();
      if (!name) throw new Error('Empty {{placeholder}}');
      placeholders.push(unescaped ? `{{- ${name}}}` : `{{${name}}}`);
      index = end + 2;
      continue;
    }
    if (text[index] === '{') {
      index = skipSpace(text, index + 1);
      let name;
      [name, index] = readName(text, index);
      index = skipSpace(text, index);
      if (text[index] === '}') {
        placeholders.push(`{${name}}`);
        index += 1;
        continue;
      }
      if (text[index] !== ',') throw new Error('Broken placeholder {' + name + '}');
      index = skipSpace(text, index + 1);
      let type;
      [type, index] = readName(text, index);
      index = skipSpace(text, index);
      if (text[index] === '}') {
        placeholders.push(`{${name}, ${type}}`);
        index += 1;
        continue;
      }
      if (text[index] !== ',') throw new Error('Broken {' + name + ', ' + type + '} placeholder');
      index = skipSpace(text, index + 1);
      if (type === 'plural' || type === 'selectordinal' || type === 'select') {
        const options = [];
        let usesPound = false;
        while (text[index] && text[index] !== '}') {
          index = skipSpace(text, index);
          const exact = text[index] === '=';
          let option;
          if (exact) {
            const match = text.slice(index).match(/^=\d+/);
            if (!match) throw new Error('Broken exact plural choice');
            option = match[0];
            index += option.length;
          } else {
            [option, index] = readName(text, index);
          }
          index = skipSpace(text, index);
          if (text[index] !== '{') throw new Error('Plural choice ' + option + ' is missing a message');
          const nested = parseMessage(text, index + 1, '}');
          if (text[nested.index] !== '}') throw new Error('Unclosed plural choice ' + option);
          if (nested.placeholders.length) placeholders.push(...nested.placeholders);
          if (nested.plurals.length) plurals.push(...nested.plurals);
          if (text.slice(index + 1, nested.index).includes('#')) usesPound = true;
          options.push(option);
          index = skipSpace(text, nested.index + 1);
        }
        if (text[index] !== '}') throw new Error('Unclosed {' + name + ', ' + type + '}');
        if ((type === 'plural' || type === 'selectordinal') && !options.includes('other')) {
          throw new Error(type + ' for ' + name + ' is missing other');
        }
        if (type === 'plural' || type === 'selectordinal') {
          plurals.push({ name, type, categories: options.filter((option) => !option.startsWith('=')), usesPound });
        }
        placeholders.push(`{${name}, ${type}}`);
        index += 1;
        continue;
      }
      const nested = parseMessage(text, index, '}');
      placeholders.push(...nested.placeholders);
      plurals.push(...nested.plurals);
      if (text[nested.index] !== '}') throw new Error('Unclosed {' + name + ', ' + type + '}');
      placeholders.push(`{${name}, ${type}}`);
      index = nested.index + 1;
      continue;
    }
    index += 1;
  }
  if (closer) throw new Error('Unclosed message');
  return { placeholders, plurals, index };
}

export function describeMessage(text) {
  return parseMessage(text, 0);
}

function sameList(left, right) {
  return left.length === right.length && [...left].sort().every((token, index) => token === [...right].sort()[index]);
}

function tagsIn(text) {
  return [...text.matchAll(/<\/?[A-Za-z][^>\s/>]*/g)].map((match) => match[0]);
}

export function compareText(source, target, locale, add, key) {
  let left;
  let right;
  try { left = describeMessage(source); }
  catch (error) { add('icu-syntax', 'error', key, 'Source message: ' + error.message); }
  try { right = describeMessage(target); }
  catch (error) { add('icu-syntax', 'error', key, 'Target message: ' + error.message); }
  if (!left || !right) return;
  if (!sameList(left.placeholders, right.placeholders)) {
    add('placeholder-mismatch', 'error', key, 'Placeholders changed. Source has ' + (left.placeholders.join(' ') || 'none') + '. Target has ' + (right.placeholders.join(' ') || 'none') + '.');
  }
  if (!sameList(tagsIn(source), tagsIn(target))) {
    add('markup-mismatch', 'error', key, 'Rich-text tags changed.');
  }
  const sourceLength = lengthOf(source);
  const targetLength = lengthOf(target);
  if (sourceLength >= 4 && targetLength > sourceLength * 3 && targetLength - sourceLength > 12) {
    add('length-blowup', 'warning', key, 'Translation is ' + targetLength + ' characters against a source of ' + sourceLength + '. Check it still fits the control.');
  }
  for (const plural of right.plurals) {
    const type = plural.type === 'selectordinal' ? 'ordinal' : 'cardinal';
    const required = pluralCategories(locale, type);
    const missing = required.filter((category) => !plural.categories.includes(category));
    const unused = plural.categories.filter((category) => !required.includes(category));
    if (missing.length) add('plural-missing', 'error', key, plural.name + ' is missing ' + type + ' ' + missing.join(', ') + '.');
    if (unused.length) add('plural-unused', 'warning', key, plural.name + ' has ' + type + ' categories this locale does not use: ' + unused.join(', ') + '.');
  }
}

function languageOf(tag) {
  return new Intl.Locale(tag).language;
}

function addFinding(findings, code, severity, key, message) {
  findings.push({ code, severity, key, message });
}

function unescapeQuoted(value) {
  return value.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

function flattenJson(value, path, out) {
  if (typeof value === 'string') {
    if (!path.at(-1)?.startsWith('@')) out.set(path.join('.'), { text: value });
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const quantities = Object.keys(value);
  if (path.length && quantities.every((key) => pluralOrder.includes(key) && typeof value[key] === 'string')) {
    out.set(path.join('.'), { plural: Object.fromEntries(quantities.map((key) => [key, value[key]])) });
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith('@')) continue;
    flattenJson(child, [...path, key], out);
  }
}

function groupSuffixPlurals(messages) {
  const grouped = new Map(messages);
  const stems = new Map();
  for (const [key, value] of messages) {
    const match = key.match(/^(.*?)_(zero|one|two|few|many|other)$/);
    if (!match || value.plural) continue;
    if (!stems.has(match[1])) stems.set(match[1], {});
    stems.get(match[1])[match[2]] = value.text;
  }
  for (const [stem, forms] of stems) {
    if (!forms.other && Object.keys(forms).length < 2) continue;
    for (const category of Object.keys(forms)) grouped.delete(stem + '_' + category);
    grouped.set(stem, { plural: forms });
  }
  return grouped;
}

function readJsonMessages(text) {
  const messages = new Map();
  flattenJson(JSON.parse(text), [], messages);
  return groupSuffixPlurals(messages);
}

function readAndroid(text) {
  const messages = new Map();
  for (const match of text.matchAll(/<string\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/string>/g)) {
    let value = match[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    value = unescapeQuoted(value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))));
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    messages.set(match[1], { text: value.trim() });
  }
  for (const block of text.matchAll(/<plurals\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/plurals>/g)) {
    const forms = {};
    for (const item of block[2].matchAll(/<item\s+quantity="([^"]+)"[^>]*>([\s\S]*?)<\/item>/g)) {
      forms[item[1]] = unescapeQuoted(item[2]).trim();
    }
    messages.set(block[1], { plural: forms });
  }
  return messages;
}

function readStrings(text) {
  const messages = new Map();
  const source = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const pattern = /"((?:\\.|[^"\\])*)"\s*=\s*"((?:\\.|[^"\\])*)"\s*;/g;
  for (const match of source.matchAll(pattern)) {
    messages.set(unescapeQuoted(match[1]), { text: unescapeQuoted(match[2]) });
  }
  return messages;
}

function xcValue(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.stringUnit?.value != null) return { text: String(node.stringUnit.value) };
  const forms = node.variations?.plural;
  if (forms && typeof forms === 'object') {
    const plural = {};
    for (const [quantity, item] of Object.entries(forms)) {
      if (item?.stringUnit?.value != null) plural[quantity] = String(item.stringUnit.value);
    }
    if (Object.keys(plural).length) return { plural };
  }
  return null;
}

function readXcstrings(text, locale) {
  const document = JSON.parse(text);
  const messages = new Map();
  const wanted = [locale, languageOf(locale)];
  for (const [key, entry] of Object.entries(document.strings ?? {})) {
    const localizations = entry.localizations ?? {};
    const tag = wanted.find((candidate) => localizations[candidate]);
    if (!tag) continue;
    const value = xcValue(localizations[tag]);
    if (value) messages.set(key, value);
  }
  return messages;
}

export function readCatalog(file, format, locale) {
  const text = readFileSync(file, 'utf8');
  const detected = format === 'auto' ? detectFormat(file) : format;
  if (detected === 'android') return readAndroid(text);
  if (detected === 'strings') return readStrings(text);
  if (detected === 'xcstrings') return readXcstrings(text, locale);
  return readJsonMessages(text);
}

function detectFormat(file) {
  if (file.endsWith('.xml')) return 'android';
  if (file.endsWith('.strings')) return 'strings';
  if (file.endsWith('.xcstrings')) return 'xcstrings';
  return 'json';
}

function comparePlural(source, target, locale, add, key) {
  const categories = pluralCategories(locale, 'cardinal');
  const missing = categories.filter((category) => !Object.hasOwn(target, category));
  const unused = Object.keys(target).filter((category) => !categories.includes(category));
  if (missing.length) add('plural-missing', 'error', key, 'Missing ' + missing.join(', ') + '.');
  if (unused.length) add('plural-unused', 'warning', key, 'Unused categories: ' + unused.join(', ') + '.');
  for (const [category, text] of Object.entries(target)) {
    const base = source[category] ?? source.other;
    if (typeof base === 'string') compareText(base, text, locale, add, key + '.' + category);
  }
}

export function checkCatalogs({ source, target, locale, sourceLocale = 'en', format = 'auto' }) {
  if (!source || !target || !locale) throw new Error('Provide --source, --target, and --locale');
  const mode = format;
  const left = readCatalog(source, mode, sourceLocale);
  const right = readCatalog(target, mode, locale);
  const findings = [];
  const add = (code, severity, key, message) => addFinding(findings, code, severity, key, message);
  const languageChanges = languageOf(sourceLocale) !== languageOf(locale);
  for (const key of [...new Set([...left.keys(), ...right.keys()])].sort()) {
    const sourceMessage = left.get(key);
    const targetMessage = right.get(key);
    if (!sourceMessage) {
      add('extra-key', 'warning', key, 'This key is absent from the source catalog.');
      continue;
    }
    if (!targetMessage) {
      add('missing-key', 'error', key, 'This source message has no target entry.');
      continue;
    }
    if (Boolean(sourceMessage.plural) !== Boolean(targetMessage.plural)) {
      add('value-type-mismatch', 'error', key, 'One side is a plural and the other is a single string.');
      continue;
    }
    if (sourceMessage.plural) {
      comparePlural(sourceMessage.plural, targetMessage.plural, locale, add, key);
      continue;
    }
    if (!targetMessage.text.trim()) add('empty-message', 'error', key, 'This translation is empty.');
    if (languageChanges && sourceMessage.text.trim() === targetMessage.text.trim() && /\p{L}/u.test(sourceMessage.text)) {
      add('possible-source-copy', 'warning', key, 'Text matches the source. Keep it only for a brand, a name, or a glossary term that is intentionally shared.');
    }
    compareText(sourceMessage.text, targetMessage.text, locale, add, key);
  }
  const errors = findings.filter(({ severity }) => severity === 'error').length;
  return { schema: 1, source, target, locale, errors, warnings: findings.length - errors, findings };
}

function invokedDirectly() {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

function printUsage() {
  console.log(`Usage: node check.mjs --source <file> --target <file> --locale <tag> [--source-locale <tag>] [--format auto|json|android|strings|xcstrings] [--json]

Checks missing and extra keys, placeholder changes, ICU syntax, CLDR plural categories, length blowups, and strings copied unchanged from the source.
Formats: ARB, JSON, i18next, Android strings.xml, iOS .strings, and .xcstrings.`);
}

if (invokedDirectly()) {
  try {
    const args = process.argv.slice(2);
    if (!args.length || args.includes('--help') || args.includes('-h')) {
      printUsage();
      process.exitCode = args.length ? 0 : 2;
    } else {
      const options = { format: 'auto', sourceLocale: 'en', json: false };
      for (let index = 0; index < args.length; index += 1) {
        const name = args[index];
        if (name === '--json') { options.json = true; continue; }
        const value = args[++index];
        if (!value || value.startsWith('--')) throw new Error('Missing value for ' + name);
        if (name === '--source') options.source = value;
        else if (name === '--target') options.target = value;
        else if (name === '--locale') options.locale = value;
        else if (name === '--source-locale') options.sourceLocale = value;
        else if (name === '--format') options.format = value;
        else throw new Error('Unknown argument ' + name);
      }
      if (!['auto', 'json', 'android', 'strings', 'xcstrings'].includes(options.format)) {
        throw new Error('Choose auto, json, android, strings, or xcstrings for --format');
      }
      const result = checkCatalogs(options);
      if (options.json) console.log(JSON.stringify(result, null, 2));
      else {
        for (const finding of result.findings) {
          console.log(finding.severity + ' ' + finding.code + ' ' + finding.key + ' ' + finding.message);
        }
        console.log(result.errors + ' errors, ' + result.warnings + ' warnings');
      }
      if (result.errors) process.exitCode = 1;
    }
  } catch (error) {
    console.error('nativeskill: ' + error.message);
    process.exitCode = 2;
  }
}
