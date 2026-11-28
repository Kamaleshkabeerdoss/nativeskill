import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DictionaryError, readDictionary } from './dict.mjs';
import { applySettings, resolveSettings } from './config.mjs';
import { bucketOf, formatText, summarize } from './report.mjs';
import { auditCatalog } from './audit.mjs';
import { checkBranches, checkGlossary, checkSourceChanged, readGlossary, textChecks } from './checks.mjs';

export const EXIT = { ok: 0, findings: 1, usage: 2, unreadable: 3 };

const pluralOrder = ['zero', 'one', 'two', 'few', 'many', 'other'];

// length-blowup fires when a translation is longer than factor × the source (in graphemes) and 12+ longer.
// Filipino short verbs grow into phrases ("Rename" -> "Palitan ang pangalan", 3.3x) and are correct, so it
// gets 3.5. Measured on a 1,100-1,700 string SaaS catalog per locale: fil median 1.27x, p99 2.5x; vi 1.12x /
// 2.4x; th 0.80x / 1.6x. Thai and Vietnamese keep 3: their only hits at 3x were real fit problems.
const LENGTH_FACTOR = { fil: 3.5, tl: 3.5 };

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
  const selects = [];
  const exacts = [];
  let index = start;
  while (index < text.length) {
    if (closer && text[index] === closer) return { placeholders, plurals, selects, exacts, index };
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
        const branches = [];
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
          if (nested.selects.length) selects.push(...nested.selects);
          if (nested.exacts.length) exacts.push(...nested.exacts);
          const branch = text.slice(index + 1, nested.index);
          const showsNumber = branch.includes('#') || branch.includes('{' + name + '}');
          if (branch.includes('#')) usesPound = true;
          branches.push({ option, showsNumber });
          options.push(option);
          index = skipSpace(text, nested.index + 1);
        }
        if (text[index] !== '}') throw new Error('Unclosed {' + name + ', ' + type + '}');
        if ((type === 'plural' || type === 'selectordinal') && !options.includes('other')) {
          throw new Error(type + ' for ' + name + ' is missing other');
        }
        if (type === 'select') selects.push({ name, choices: options });
        if (type === 'plural' || type === 'selectordinal') {
          plurals.push({ name, type, categories: options.filter((option) => !option.startsWith('=')), usesPound, branches });
          exacts.push({ name, type, values: options.filter((option) => option.startsWith('=')) });
        }
        placeholders.push(`{${name}, ${type}}`);
        index += 1;
        continue;
      }
      const nested = parseMessage(text, index, '}');
      placeholders.push(...nested.placeholders);
      plurals.push(...nested.plurals);
      selects.push(...nested.selects);
      exacts.push(...nested.exacts);
      if (text[nested.index] !== '}') throw new Error('Unclosed {' + name + ', ' + type + '}');
      placeholders.push(`{${name}, ${type}}`);
      index = nested.index + 1;
      continue;
    }
    index += 1;
  }
  if (closer) throw new Error('Unclosed message');
  return { placeholders, plurals, selects, exacts, index };
}

export function describeMessage(text) {
  return parseMessage(text, 0);
}

function sameList(left, right) {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((token, index) => token === b[index]);
}

function printfParts(token) {
  const match = token.match(/^%(?:(\d+)\$)?(lld|lli|ld|lu|d|i|u|f|s|@)$/);
  if (!match) return null;
  return { position: match[1] ? Number(match[1]) : null, type: match[2] };
}

function isNumericToken(token) {
  const parts = printfParts(token);
  if (parts && parts.type !== '@' && parts.type !== 's') return true;
  return token === '{count}' || token.startsWith('{count,');
}

function categoryIsExact(locale, category, type = 'cardinal') {
  const rules = new Intl.PluralRules(locale, { type });
  let hits = 0;
  for (let value = 0; value <= 200; value += 1) {
    if (rules.select(value) === category) hits += 1;
    if (hits > 1) return false;
  }
  return hits === 1;
}

function valuesFor(locale, category, type) {
  const rules = new Intl.PluralRules(locale, { type });
  const hits = [];
  for (let value = 0; value <= 200 && hits.length < 4; value += 1) if (rules.select(value) === category) hits.push(value);
  return hits.join(', ') + (hits.length === 4 ? ', …' : '');
}

function comparePrintf(sourceTokens, targetTokens, add, key) {
  const left = sourceTokens.map(printfParts);
  const right = targetTokens.map(printfParts);
  if (left.some((item) => !item) || right.some((item) => !item)) return false;
  let next = 1;
  for (const item of left) if (item.position == null) item.position = next++;
  const targetHasPosition = right.some((item) => item.position != null);
  const targetMissingPosition = right.some((item) => item.position == null);
  if (targetHasPosition && targetMissingPosition) {
    add('placeholder-order', 'error', key, 'Do not mix numbered and unnumbered placeholders. Use %1$@ and %2$d throughout.');
    return true;
  }
  next = 1;
  if (!targetHasPosition) for (const item of right) item.position = next++;
  const typeAt = (items) => new Map(items.map((item) => [item.position, item.type]));
  const sourceTypes = typeAt(left);
  const targetTypes = typeAt(right);
  const positions = [...new Set([...sourceTypes.keys(), ...targetTypes.keys()])].sort((a, b) => a - b);
  const changed = positions.some((position) => sourceTypes.get(position) !== targetTypes.get(position));
  if (!changed) return true;
  const sourceOrder = left.map((item) => item.type).join(' ');
  const targetOrder = right.map((item) => item.type).join(' ');
  const sameTypes = [...sourceTypes.values()].sort().join() === [...targetTypes.values()].sort().join();
  if (sameTypes && !targetHasPosition) {
    add('placeholder-order', 'error', key, 'Unnumbered placeholders changed order (' + sourceOrder + ' → ' + targetOrder + '). Keep the order or use %1$@ and %2$d.');
  } else if (sameTypes) {
    const retyped = positions
      .filter((position) => sourceTypes.get(position) !== targetTypes.get(position))
      .map((position) => '%' + position + '$' + sourceTypes.get(position) + ' became %' + position + '$' + targetTypes.get(position));
    add('placeholder-mismatch', 'error', key, 'Numbered placeholders changed type: ' + retyped.join(', ') + '. Each argument keeps its source type. Move the token, not the type letter.');
  } else {
    add('placeholder-mismatch', 'error', key, 'Placeholders changed. Source has ' + (sourceTokens.join(' ') || 'none') + '. Target has ' + (targetTokens.join(' ') || 'none') + '.');
  }
  return true;
}

function choiceKey(items) {
  return items.map((item) => item.name + ':' + [...item.choices ?? item.values].sort().join(',')).sort().join('|');
}

function tagsIn(text) {
  return [...text.matchAll(/<\/?[A-Za-z][^>\s/>]*/g)].map((match) => match[0]);
}

export function compareText(source, target, locale, add, key, options = {}) {
  let left;
  let right;
  try { left = describeMessage(source); }
  catch (error) { add('icu-syntax', 'error', key, 'Source message: ' + error.message); }
  try { right = describeMessage(target); }
  catch (error) { add('icu-syntax', 'error', key, 'Target message: ' + error.message); }
  if (!left || !right) return;
  let sourceTokens = left.placeholders;
  let targetTokens = right.placeholders;
  if (options.exactCategory && targetTokens.every((token) => !isNumericToken(token))) {
    sourceTokens = sourceTokens.filter((token) => !isNumericToken(token));
  }
  const sourcePrintf = sourceTokens.filter((token) => token.startsWith('%'));
  const targetPrintf = targetTokens.filter((token) => token.startsWith('%'));
  const sourceNamed = sourceTokens.filter((token) => !token.startsWith('%'));
  const targetNamed = targetTokens.filter((token) => !token.startsWith('%'));
  const printfHandled = comparePrintf(sourcePrintf, targetPrintf, add, key);
  if (!printfHandled && !sameList(sourcePrintf, targetPrintf)) {
    add('placeholder-mismatch', 'error', key, 'Placeholders changed. Source has ' + (sourcePrintf.join(' ') || 'none') + '. Target has ' + (targetPrintf.join(' ') || 'none') + '.');
  }
  if (!sameList(sourceNamed, targetNamed)) {
    const unique = (list) => [...new Set(list)];
    const fewerRepeats = sameList(unique(sourceNamed), unique(targetNamed)) && targetNamed.length < sourceNamed.length;
    if (fewerRepeats) {
      // "Share the {nounPlural} … no {nounPlural} found" often reads better with the second mention as a pronoun.
      add('placeholder-repeat-dropped', 'warning', key, 'Every placeholder is still there, but one that the source repeats appears fewer times (' + sourceNamed.length + ' → ' + targetNamed.length + '). Fine if the sentence refers back to it; check nothing is lost.');
    } else {
      add('placeholder-mismatch', 'error', key, 'Placeholders changed. Source has ' + (sourceNamed.join(' ') || 'none') + '. Target has ' + (targetNamed.join(' ') || 'none') + '.');
    }
  }
  if (choiceKey(left.selects.map((item) => ({ name: item.name, choices: item.choices }))) !== choiceKey(right.selects.map((item) => ({ name: item.name, choices: item.choices })))) {
    add('selector-mismatch', 'error', key, 'Select branches changed. Keep every choice, including other.');
  }
  if (choiceKey(left.exacts.map((item) => ({ name: item.name, values: item.values }))) !== choiceKey(right.exacts.map((item) => ({ name: item.name, values: item.values })))) {
    add('exact-choice-missing', 'error', key, 'An exact plural choice such as =0 was added or removed.');
  }
  if (!sameList(tagsIn(source), tagsIn(target))) {
    add('markup-mismatch', 'error', key, 'Rich-text tags changed.');
  }
  const sourceLength = lengthOf(source);
  const targetLength = lengthOf(target);
  const factor = LENGTH_FACTOR[languageOf(locale)] ?? 3;
  if (sourceLength >= 4 && targetLength > sourceLength * factor && targetLength - sourceLength > 12) {
    add('length-blowup', 'warning', key, 'Translation is ' + targetLength + ' characters against a source of ' + sourceLength + '. Check it still fits the control.');
  }
  textChecks(source, target, locale, add, key);
  for (const plural of right.plurals) {
    const type = plural.type === 'selectordinal' ? 'ordinal' : 'cardinal';
    const required = pluralCategories(locale, type);
    const missing = required.filter((category) => !plural.categories.includes(category));
    const unused = plural.categories.filter((category) => !required.includes(category));
    if (missing.length) add('plural-missing', 'error', key, plural.name + ' is missing ' + type + ' ' + missing.join(', ') + '.');
    if (unused.length) add('plural-unused', 'warning', key, plural.name + ' has ' + type + ' categories this locale does not use: ' + unused.join(', ') + '.');
    const sourcePlural = left.plurals.find((item) => item.name === plural.name && item.type === plural.type);
    if (!sourcePlural || !sourcePlural.branches.some((branch) => branch.showsNumber)) continue;
    for (const { option, showsNumber } of plural.branches) {
      if (showsNumber || option.startsWith('=') || !required.includes(option)) continue;
      if (categoryIsExact(locale, option, type)) continue;
      const values = valuesFor(locale, option, type);
      add('plural-number-missing', 'warning', key, plural.name + ' ' + option + ' has no # but ' + locale + ' ' + option + ' covers ' + values + '. Every one of those counts shows this exact text. Add # unless the words are right for all of them.');
    }
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
  if (path.length && quantities.length && quantities.every((key) => pluralOrder.includes(key) && typeof value[key] === 'string')) {
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
  const translatable = (attrs) => !/\btranslatable\s*=\s*"false"/.test(attrs);
  for (const match of text.matchAll(/<string\b([^>]*)>([\s\S]*?)<\/string>/g)) {
    if (!translatable(match[1])) continue;
    const name = match[1].match(/\bname="([^"]+)"/);
    if (!name) continue;
    let value = match[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    value = unescapeQuoted(value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))));
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    messages.set(name[1], { text: value.trim() });
  }
  for (const block of text.matchAll(/<plurals\b([^>]*)>([\s\S]*?)<\/plurals>/g)) {
    if (!translatable(block[1])) continue;
    const name = block[1].match(/\bname="([^"]+)"/);
    if (!name) continue;
    const forms = {};
    for (const item of block[2].matchAll(/<item\s+quantity="([^"]+)"[^>]*>([\s\S]*?)<\/item>/g)) {
      forms[item[1]] = unescapeQuoted(item[2]).trim();
    }
    messages.set(name[1], { plural: forms });
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

function readXcstrings(text, locale, side) {
  const document = JSON.parse(text);
  const messages = new Map();
  const wanted = [locale, languageOf(locale)];
  const sourceLanguage = document.sourceLanguage || 'en';
  for (const [key, entry] of Object.entries(document.strings ?? {})) {
    const localizations = entry?.localizations ?? {};
    const tag = wanted.find((candidate) => localizations[candidate]);
    const value = tag ? xcValue(localizations[tag]) : null;
    if (value) {
      messages.set(key, value);
      continue;
    }
    if (side === 'source' && languageOf(locale) === languageOf(sourceLanguage)) {
      messages.set(key, { text: key });
    } else {
      messages.set(key, { missing: true });
    }
  }
  return messages;
}

function readScriptCatalog(file, locale, exportName) {
  const messages = new Map();
  for (const [key, entry] of readDictionary(file, { exportName, locale })) messages.set(key, entry);
  return groupSuffixPlurals(messages);
}

export function readCatalog(file, format, locale, side = 'target', exportName) {
  const detected = format === 'auto' ? detectFormat(file) : format;
  if (detected === 'script') return readScriptCatalog(file, locale, exportName);
  const text = readFileSync(file, 'utf8');
  if (detected === 'android') return readAndroid(text);
  if (detected === 'strings') return readStrings(text);
  if (detected === 'xcstrings') return readXcstrings(text, locale, side);
  return readJsonMessages(text);
}

function detectFormat(file) {
  if (file.endsWith('.xml')) return 'android';
  if (file.endsWith('.strings')) return 'strings';
  if (file.endsWith('.xcstrings')) return 'xcstrings';
  if (/\.(?:[cm]?tsx?|[cm]?jsx?)$/.test(file)) return 'script';
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
    if (typeof base === 'string') {
      compareText(base, text, locale, add, key + '.' + category, { exactCategory: categoryIsExact(locale, category) });
    }
  }
}

export function checkCatalogs(options) {
  const { source, target, locale, sourceLocale = 'en', format = 'auto', sourceExport, targetExport } = options;
  if (!source || !target || !locale) throw new Error('Provide --source, --target, and --locale');
  const settings = resolveSettings(options);
  const mode = format;
  const left = readCatalog(source, mode, sourceLocale, 'source', sourceExport);
  const right = readCatalog(target, mode, locale, 'target', targetExport);
  const findings = [];
  const add = (code, severity, key, message) => addFinding(findings, code, severity, key, message);
  const languageChanges = languageOf(sourceLocale) !== languageOf(locale);
  for (const key of [...new Set([...left.keys(), ...right.keys()])].sort()) {
    const sourceMessage = left.get(key);
    const targetMessage = right.get(key);
    if (!sourceMessage) {
      if (targetMessage.dynamic) continue;
      add('extra-key', 'warning', key, 'This key is absent from the source catalog.');
      continue;
    }
    if (sourceMessage.dynamic || targetMessage?.dynamic) {
      const entry = targetMessage?.dynamic ? targetMessage : sourceMessage;
      add('dynamic-value', 'warning', key, 'Could not resolve this value without running code (' + entry.reason + '). Check it by hand.');
      continue;
    }
    if (!targetMessage || targetMessage.missing) {
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
    checkBranches(sourceMessage, targetMessage, locale, add, key, languageChanges);
  }
  if (settings.oldSource) checkSourceChanged(readCatalog(settings.oldSource, mode, sourceLocale, 'source', sourceExport), left, right, add);
  checkGlossary(readGlossary(settings.glossary), left, right, locale, add);
  if (languageChanges && options.audit !== false) auditCatalog(left, right, locale, add);
  findings.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  for (const finding of findings) finding.bucket = bucketOf(finding);
  const { kept, suppressed } = applySettings(findings, settings, (key) => left.get(key)?.text ?? null);
  const errors = kept.filter(({ severity }) => severity === 'error').length;
  const summary = summarize({ left, right, findings: kept, suppressed, locale });
  return {
    schema: 2, source, target, locale, config: settings.configPath,
    errors, warnings: kept.length - errors, summary, findings: kept, suppressed
  };
}

function invokedDirectly() {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

function printUsage() {
  console.log(`Usage: node check.mjs --source <file> --target <file> --locale <tag> [--source-locale <tag>]
       [--format auto|json|android|strings|xcstrings|script] [--source-export <name>] [--target-export <name>] [--json]
       [--old-source <previous English catalog>] [--glossary <glossary.json>]
       [--verbose] [--no-audit] [--config <file> | --no-config] [--allow-missing <key-prefix>]... [--keep-english <term>]... [--ignore-key <pattern>]...

Checks missing and extra keys, placeholder changes, ICU syntax, CLDR plural categories, length blowups, and strings copied unchanged from the source.
Formats: ARB, JSON, i18next, Android strings.xml, iOS .strings, .xcstrings, and TS/JS dictionaries
(typed objects, arrow functions, spreads and imported sections; read without running them).

Output starts with a coverage summary per section. Warnings that repeat more than 5 times in one section are
grouped into one line; --verbose lists every key. --json always has every finding plus "summary".

Settings: .nativeskillrc (JSON) is read from the target's folder or a parent: allowMissing, keepEnglish, ignoreKeys.
Suppressed findings are counted and listed under "suppressed" in --json.

Exit codes: 0 no errors, 1 errors found, 2 wrong arguments, 3 a catalog could not be read.`);
}

if (invokedDirectly()) {
  try {
    const args = process.argv.slice(2);
    if (!args.length || args.includes('--help') || args.includes('-h')) {
      printUsage();
      process.exitCode = args.length ? 0 : 2;
    } else {
      const options = { format: 'auto', sourceLocale: 'en', json: false, allowMissing: [], keepEnglish: [], ignoreKeys: [] };
      for (let index = 0; index < args.length; index += 1) {
        const name = args[index];
        if (name === '--json') { options.json = true; continue; }
        if (name === '--no-config') { options.noConfig = true; continue; }
        if (name === '--verbose') { options.verbose = true; continue; }
        if (name === '--no-audit') { options.audit = false; continue; }
        const value = args[++index];
        if (!value || value.startsWith('--')) throw new Error('Missing value for ' + name);
        if (name === '--source') options.source = value;
        else if (name === '--target') options.target = value;
        else if (name === '--locale') options.locale = value;
        else if (name === '--source-locale') options.sourceLocale = value;
        else if (name === '--format') options.format = value;
        else if (name === '--source-export') options.sourceExport = value;
        else if (name === '--config') options.config = value;
        else if (name === '--old-source') options.oldSource = value;
        else if (name === '--glossary') options.glossary = value;
        else if (name === '--allow-missing') options.allowMissing.push(value);
        else if (name === '--keep-english') options.keepEnglish.push(value);
        else if (name === '--ignore-key') options.ignoreKeys.push(value);
        else if (name === '--target-export') options.targetExport = value;
        else throw new Error('Unknown argument ' + name);
      }
      if (!['auto', 'json', 'android', 'strings', 'xcstrings', 'script'].includes(options.format)) {
        throw new Error('Choose auto, json, android, strings, xcstrings, or script for --format');
      }
      const result = checkCatalogs(options);
      if (options.json) console.log(JSON.stringify(result, null, 2));
      else {
        console.log(formatText(result, { verbose: options.verbose }));
      }
      if (result.errors) process.exitCode = 1;
    }
  } catch (error) {
    if (error instanceof DictionaryError || error instanceof SyntaxError || error.code === 'ENOENT') {
      console.error('nativeskill: could not read the catalog. ' + error.message);
      if (error instanceof DictionaryError) {
        console.error('The checker reads plain objects, arrow functions, template literals, ternaries, spreads and imported sections. ' +
          'For anything else, print the dictionary as JSON (node scripts/dict.mjs <file> --export <name> > target.json, or your own build step) and check the JSON.');
      }
      process.exitCode = EXIT.unreadable;
    } else {
      console.error('nativeskill: ' + error.message);
      process.exitCode = EXIT.usage;
    }
  }
}
