// Extra checks used by check.mjs: spacing, invisible characters, English residue, count order,
// stale strings, glossary terms, and function-dictionary branches.
import { existsSync, readFileSync } from 'node:fs';

const language = (tag) => new Intl.Locale(tag).language;
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const count = (text, re) => (text.match(re) ?? []).length;

// --- placeholder-spacing -------------------------------------------------------------------------
// Machine translation often pads placeholders: `" {name} "?`, `{workspace} ?`, `{provider} ,`.
const SPACING = [
  { re: /["“«„]\s+\{[^{}]+\}/g, what: 'a space after the opening quote' },
  { re: /\{[^{}]+\}\s+["”»](?=[\s?!.,:;؟،]|$)/g, what: 'a space before the closing quote' },
  { re: /\{[^{}]+\}[ \t]+[?!.,:;؟،](?=\s|$|["”»)])/g, what: 'a space before punctuation', exempt: ['fr'] },
  { re: /\(\s+\{|\{[^{}]+\}\s+\)/g, what: 'a space inside brackets' }
];

export function checkSpacing(source, target, locale, add, key) {
  const lang = language(locale);
  for (const { re, what, exempt } of SPACING) {
    if (exempt?.includes(lang)) continue;
    if (count(target, re) > count(source, re)) {
      const sample = target.match(re)[0];
      add('placeholder-spacing', 'warning', key, 'Placeholder has ' + what + ' (' + JSON.stringify(sample) + ') that the source does not have. Machine translation adds these; remove the space.');
      return;
    }
  }
}

// --- invisible-character -------------------------------------------------------------------------
const ZWSP_SCRIPTS = new Set(['th', 'lo', 'km', 'my', 'bo', 'dz']);
const NAMES = { '\u200B': 'ZERO WIDTH SPACE', '\u2060': 'WORD JOINER', '\uFEFF': 'BYTE ORDER MARK', '\u200C': 'ZERO WIDTH NON-JOINER', '\u200D': 'ZERO WIDTH JOINER', '\u00A0\u200B': '' };

export function checkInvisible(source, target, locale, add, key) {
  const lang = language(locale);
  const found = new Set();
  for (const char of target) {
    if (!(char in NAMES) || source.includes(char)) continue;
    if (char === '\u200B' && ZWSP_SCRIPTS.has(lang)) continue;
    if ((char === '\u200C' || char === '\u200D') && (/[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(target) || /\p{Extended_Pictographic}/u.test(target))) continue;
    found.add(char);
  }
  if (found.size) {
    const list = [...found].map((char) => 'U+' + char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + ' ' + NAMES[char]);
    add('invisible-character', 'warning', key, 'Contains ' + list.join(', ') + '. Usually pasted from a machine-translation tool; it breaks search, copy and line wrapping. Delete it.');
  }
}

// --- english-residue -----------------------------------------------------------------------------
const STOPWORDS = /^(?:the|and|of|to|your|you|with|for|is|are|this|that|from|in|on|it|be|not|will|can)$/i;

export function checkEnglishResidue(source, target, locale, add, key) {
  if (language(locale) === 'en') return;
  const plural = target.match(/\((?:e?s)\)|\}\(?s\)?(?![\p{L}])/u);
  if (plural && !source.includes(plural[0].replace(/^\}/, ''))) {
    add('english-residue', 'warning', key, 'English plural marker ' + JSON.stringify(plural[0]) + ' left in the translation. Rewrite with the locale\'s own plural, or ICU plural.');
    return;
  }
  if (plural) {
    add('english-residue', 'warning', key, 'English plural marker ' + JSON.stringify(plural[0]) + ' copied from the source. It means nothing in ' + locale + '. Rewrite it in the locale\'s own words.');
    return;
  }
  // A non-Latin translation with a run of English words is half translated.
  if (!/[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(target)) return;
  for (const run of target.replace(/\{[^{}]*\}/g, ' ').matchAll(/(?:\b[A-Za-z]+\b[ ,]+){3,}\b[A-Za-z]+\b/g)) {
    const words = run[0].split(/[ ,]+/);
    if (words.filter((word) => STOPWORDS.test(word)).length >= 2) {
      add('english-residue', 'warning', key, 'English left inside the translation: ' + JSON.stringify(run[0]) + '.');
      return;
    }
  }
}

// --- count-noun-order ----------------------------------------------------------------------------
const COUNT_NAME = /^(?:n|num|count|total|number|qty|quantity|amount|\w*Count)$/;
const NOUN_FIRST_PREFIX = {
  ms: /^(?:me|ber|di|ter|ada|masih|sisa|tinggal|baki|hanya|jumlah|total|semua)/i,
  id: /^(?:me|ber|di|ter|ada|masih|sisa|tinggal|hanya|jumlah|total|semua)/i
};
const AFTER_NOUN = new Set(['ms', 'id', 'vi', 'fil', 'tl', 'ar']);

export function checkCountOrder(source, target, locale, add, key) {
  const lang = language(locale);
  if (!AFTER_NOUN.has(lang) && lang !== 'th') return;
  const counted = [...source.matchAll(/\{(\w+)\}\s+(\p{L}+s)\b/gu)].filter((match) => COUNT_NAME.test(match[1]));
  for (const [, name] of counted) {
    const token = '{' + name + '}';
    if (!target.includes(token)) continue;
    const segments = target.split(/\s+[·•—–|-]\s+|:\s+|\n/);
    const segment = segments.find((part) => part.includes(token)).trim();
    const last = new RegExp('[\\p{L}\\p{M}]\\s+' + escape(token) + '[.!?]?$', 'u').test(segment);
    if (lang === 'th') {
      if (last) add('count-noun-order', 'warning', key, 'Thai counts as noun + number + classifier ("ไฟล์ ' + token + ' ไฟล์"). ' + token + ' has no classifier after it, so it reads as a label or an ID.');
      return;
    }
    if (last) {
      add('count-noun-order', 'warning', key, 'The count comes after the noun ("' + segment + '"), which reads as a number or ID ("message #5"). In ' + locale + ' put the count before the noun, as the source does.');
      return;
    }
    if (!new RegExp('^\\{' + escape(name) + '\\}\\s+\\p{L}+s\\b', 'u').test(source)) continue;
    const lead = target.match(new RegExp('^((?:[\\p{L}\\p{M}]+\\s+){1,2})' + escape(token), 'u'));
    if (!lead) continue;
    const first = lead[1].trim().split(/\s+/)[0];
    const nounFirst = (lang === 'ms' || lang === 'id') ? !NOUN_FIRST_PREFIX[lang].test(first)
      : lang === 'vi' ? /^(?:các|những)$/i.test(first)
        : lang === 'ar' ? /ات$/.test(first)
          : false;
    if (nounFirst) {
      add('count-noun-order', 'warning', key, 'The noun comes before the count ("' + lead[0] + '"), which reads as "page {n}" rather than "{n} pages". Put the count first.');
      return;
    }
  }
}

// --- english-in-branch / hand-rolled-plural ------------------------------------------------------
export function checkBranches(sourceMessage, targetMessage, locale, add, key, languageChanges) {
  const targetVariants = targetMessage.variants ?? [];
  const sourceVariants = new Set([sourceMessage.text, ...(sourceMessage.variants ?? [])].map((text) => text.trim()));
  if (languageChanges && targetMessage.text.trim() !== sourceMessage.text.trim()) {
    const english = targetVariants.filter((text) => text !== targetMessage.text && sourceVariants.has(text.trim()) && /\p{L}/u.test(text));
    if (english.length) add('english-in-branch', 'warning', key, 'One branch of this function is still English: ' + JSON.stringify(english[0]) + '. Every branch needs translating.');
  }
  const numeric = sourceMessage.fn?.numericBranch || targetMessage.fn?.numericBranch;
  if (!numeric || targetMessage.fn?.pluralRules) return;
  const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  if (categories.length <= 2) return;
  const forms = new Set(targetVariants.length ? targetVariants : [targetMessage.text]).size;
  if (forms < categories.length) {
    add('hand-rolled-plural', 'warning', key, 'The plural is hand-rolled (n === 1 ? … : …) and ' + locale + ' has ' + categories.length + ' plural forms (' + categories.join(', ') + '); this text has ' + forms + '. Use Intl.PluralRules or an ICU plural.');
  }
}

// --- source-changed ------------------------------------------------------------------------------
export function checkSourceChanged(oldSource, left, right, add) {
  for (const [key, message] of left) {
    const before = oldSource.get(key);
    const target = right.get(key);
    if (!before || !target || message.dynamic || target.dynamic || message.plural || before.plural) continue;
    if (before.text === message.text || target.missing) continue;
    if (target.text?.trim() === message.text.trim()) continue;
    add('source-changed', 'warning', key, 'The English changed from ' + JSON.stringify(before.text) + ' to ' + JSON.stringify(message.text) + ' after this was translated. Translate it again.');
  }
}

// --- term-inconsistent ---------------------------------------------------------------------------
// glossary.json: { "lead": { "source": "\\bleads?\\b", "ms": "prospek", "avoid": { "ms": ["petunjuk"] } } }
export function readGlossary(path) {
  if (!path) return null;
  if (!existsSync(path)) throw new Error('Glossary not found: ' + path);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  return Object.entries(data.terms ?? data).filter(([name]) => !name.startsWith('$'));
}

const termRe = (term) => {
  const regex = String(term).match(/^\/(.+)\/([a-z]*)$/);
  return regex ? new RegExp(regex[1], regex[2].includes('i') ? regex[2] : regex[2] + 'i') : new RegExp(escape(String(term)), 'iu');
};

export function checkGlossary(glossary, left, right, locale, add) {
  if (!glossary) return;
  const lang = language(locale);
  for (const [name, rule] of glossary) {
    const sourceRe = new RegExp(rule.source ?? '\\b' + escape(name) + '\\b', 'iu');
    const use = rule[locale] ?? rule[lang];
    const avoid = rule.avoid?.[locale] ?? rule.avoid?.[lang] ?? [];
    if (!use && !avoid.length) continue;
    const uses = (Array.isArray(use) ? use : use ? [use] : []).map(termRe);
    for (const [key, message] of left) {
      if (message.dynamic || message.plural || !sourceRe.test(message.text)) continue;
      const target = right.get(key);
      if (!target || target.missing || target.dynamic || target.plural) continue;
      const bad = avoid.find((term) => termRe(term).test(target.text));
      if (bad) add('term-inconsistent', 'warning', key, '"' + name + '" is translated as "' + bad + '", which the glossary rejects for ' + locale + '. Use ' + (use ? JSON.stringify(use) : 'the glossary term') + '.');
      else if (uses.length && !uses.some((re) => re.test(target.text))) add('term-inconsistent', 'warning', key, '"' + name + '" should be ' + JSON.stringify(use) + ' in ' + locale + ' (glossary), so the same thing has one name everywhere.');
    }
  }
}

export function textChecks(source, target, locale, add, key) {
  if (source.trim() === target.trim()) return;
  checkSpacing(source, target, locale, add, key);
  checkInvisible(source, target, locale, add, key);
  checkEnglishResidue(source, target, locale, add, key);
  checkCountOrder(source, target, locale, add, key);
}
