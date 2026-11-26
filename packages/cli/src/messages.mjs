import { parse, TYPE } from '@formatjs/icu-messageformat-parser';

const doubleBrace = /\{\{\s*(-\s*)?([^{}\s,]+)\s*(?:,[^{}]*)?\}\}/g;
const icuSelector = /\{\s*[^\s{},]+\s*,\s*(?:plural|selectordinal|select)\s*,/;

function addTo(map, key, value) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(value);
}

export function describeMessage(value, format) {
  const argumentsByName = new Map();
  const tags = new Set();
  const selectors = new Map();
  const plurals = [];
  let message = value;
  if (format === 'i18next' || (format === 'auto' && !icuSelector.test(value))) {
    message = message.replace(doubleBrace, (_, unescaped, name) => {
      addTo(argumentsByName, name, unescaped ? 'i18next-unescaped' : 'i18next');
      return '';
    });
  }

  function visit(nodes, parents = []) {
    for (const node of nodes) {
      if (node.type === TYPE.literal || node.type === TYPE.pound) continue;
      if (node.type === TYPE.tag) {
        const path = [...parents, node.value];
        tags.add(JSON.stringify(path));
        visit(node.children, path);
        continue;
      }
      const kind = node.type === TYPE.plural ? node.pluralType : TYPE[node.type];
      addTo(argumentsByName, node.value, kind);
      if (node.type === TYPE.select || node.type === TYPE.plural) {
        const options = Object.entries(node.options);
        for (const [choice, option] of options) {
          if (node.type === TYPE.select || choice.startsWith('=')) {
            addTo(selectors, JSON.stringify([node.value, kind]), choice);
          }
          visit(option.value, parents);
        }
        if (node.type === TYPE.plural) {
          plurals.push({ name: node.value, kind, choices: options.map(([choice]) => choice), offset: node.offset });
        }
      }
    }
  }

  visit(parse(message, { requiresOtherClause: true }));
  return { argumentsByName, tags, selectors, plurals };
}

function equalSet(a, b) {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

function equalMap(a, b) {
  return a.size === b.size && [...a].every(([key, values]) => b.has(key) && equalSet(values, b.get(key)));
}

export function compareMessages(source, target, locale, format, add) {
  let left;
  let right;
  try { left = describeMessage(source, format); }
  catch (error) { add('source-message-syntax', 'error', error.message); }
  try { right = describeMessage(target, format); }
  catch (error) { add('target-message-syntax', 'error', error.message); }
  if (!left || !right) return;

  if (!equalMap(left.argumentsByName, right.argumentsByName)) {
    add('placeholder-mismatch', 'error', 'Preserve argument names, interpolation modes, and formatter types.');
  }
  if (!equalSet(left.tags, right.tags)) {
    add('markup-mismatch', 'error', 'Preserve rich-text tags and their nesting.');
  }
  if (!equalMap(left.selectors, right.selectors)) {
    add('selector-mismatch', 'error', 'Preserve select choices and exact-number plural choices.');
  }

  const offsets = (message) => new Set(message.plurals.map(({ name, kind, offset }) => JSON.stringify([name, kind, offset])));
  if (!equalSet(offsets(left), offsets(right))) {
    add('plural-offset-mismatch', 'error', 'Preserve the plural offset for each argument.');
  }
  for (const { name, kind, choices } of right.plurals) {
    const categories = locale.profile.plurals[kind].categories;
    const unsupported = choices.filter((choice) => !choice.startsWith('=') && !categories.includes(choice));
    const missing = categories.filter((category) => !choices.includes(category));
    if (unsupported.length) add('plural-category', 'warning', name + ' has unused ' + kind + ' forms: ' + unsupported.join(', '));
    if (missing.length) add('plural-fallback', 'warning', name + ' uses other for ' + missing.join(', '));
  }
}
