import { readFileSync } from 'node:fs';

const data = new URL('../../../skills/nativeskill/assets/', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, data), 'utf8'));

export const registry = read('registry.json');

export function inspectLocale(tag) {
  let locale;
  try {
    locale = new Intl.Locale(tag);
  } catch {
    throw new Error('Invalid locale tag: ' + tag);
  }

  const owner = Object.hasOwn(registry.tagOwners, locale.language) && registry.tagOwners[locale.language];
  if (!owner) throw new Error('Unsupported language: ' + locale.language);

  const pack = read('locales/' + owner + '.json');
  const candidates = pack.profiles.filter(({ tag }) => new Intl.Locale(tag).language === locale.language);
  const exact = candidates.find(({ tag }) => tag === locale.baseName);
  const equivalent = locale.script && candidates.find(({ script, region }) => (
    script === locale.script && region === (locale.region ?? null)
  ));
  const profile = exact || equivalent;
  if (!profile) {
    throw new Error('No profile for ' + locale.baseName + '. Review the available profiles for ' + owner + '.');
  }

  return {
    requested: locale.toString(), id: pack.id, name: pack.name, profile,
    wording: pack.wording, references: pack.references
  };
}

export function inspectLanguage(code) {
  const owner = Object.hasOwn(registry.tagOwners, code) && registry.tagOwners[code];
  if (!owner) throw new Error('Unsupported language: ' + code);
  return read('locales/' + owner + '.json');
}

export function inspectConcept(id) {
  const concept = read('concepts.json').concepts.find((entry) => entry.id === id);
  if (!concept) throw new Error('Unknown concept: ' + id);
  return concept;
}
