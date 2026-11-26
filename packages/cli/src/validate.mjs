import { readCatalog } from './catalog.mjs';
import { compareMessages } from './messages.mjs';
import { inspectLocale } from './locales.mjs';

function opaqueParent(catalog, path) {
  return path.some((_, index) => catalog.get(JSON.stringify(path.slice(0, index + 1)))?.kind === 'dynamic');
}

export function validate(options) {
  const locale = inspectLocale(options.locale);
  const source = readCatalog(options.source, options.sourceExport);
  const target = readCatalog(options.target, options.targetExport);
  const findings = [];
  const languageChanges = options.sourceLocale && new Intl.Locale(options.sourceLocale).language !== new Intl.Locale(options.locale).language;

  for (const key of new Set([...source.keys(), ...target.keys()])) {
    const left = source.get(key);
    const right = target.get(key);
    const path = (left ?? right).path;
    const add = (code, severity, message, file = options.target) => findings.push({ code, severity, file, path, message });

    if ((!left && opaqueParent(source, path)) || (!right && opaqueParent(target, path))) continue;
    if (left?.kind === 'dynamic' || right?.kind === 'dynamic') {
      add('dynamic-value', 'warning', 'Inspect the runtime value. Catalog scanning does not execute dictionary code.',
        right?.kind === 'dynamic' ? options.target : options.source);
    } else if (!left) {
      if (right.kind === 'text') add('extra-key', 'warning', 'This key is absent from the source catalog.');
    } else if (!right) {
      if (left.kind === 'text') add('missing-key', 'error', 'This source message has no target entry.');
    } else if (left.kind !== right.kind) {
      add('value-type-mismatch', 'error', 'The source and target disagree on whether this value is text.');
    } else if (left.kind === 'text') {
      if (left.value.trim() && !right.value.trim()) add('empty-message', 'error', 'This translation is empty.');
      if (languageChanges && left.value.trim() === right.value.trim() && /\p{L}/u.test(left.value)) {
        add('possible-source-copy', 'warning', 'Text matches the source. Check for a brand name or intentional shared wording.');
      }
      compareMessages(left.value, right.value, locale, options.format, (code, severity, message) => (
        add(code, severity, message, code === 'source-message-syntax' ? options.source : options.target)
      ));
    }
  }
  const errors = findings.filter(({ severity }) => severity === 'error').length;
  return { schema: 1, source: options.source, target: options.target, locale: locale.requested, errors, warnings: findings.length - errors, findings };
}
