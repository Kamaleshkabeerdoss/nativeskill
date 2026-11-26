import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const data = new URL('../assets/', import.meta.url);
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

  const entries = pack.wording.entries.flatMap((entry) => {
    const scope = new Intl.Locale(entry.locale);
    if (scope.language !== locale.language || entry.script !== profile.script) return [];
    if (scope.region && scope.region !== locale.region) return [];
    const match = scope.baseName === locale.baseName ? 'exact' : scope.region ? 'region' : 'language-script';
    return [{ ...entry, match }];
  });
  entries.sort((a, b) => ['exact', 'region', 'language-script'].indexOf(a.match) - ['exact', 'region', 'language-script'].indexOf(b.match));
  return {
    requested: locale.toString(), id: pack.id, name: pack.name, profile,
    wording: wordingSummary(entries), references: pack.references
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
const wordingSummary = (entries) => {
  const sourceCount = entries.filter(({ status }) => status === 'source-attested').length;
  const texts = [...new Set(entries.map(({ text }) => text))];
  const statuses = [...new Set(entries.map(({ status }) => status))];
  const disagreement = texts.length > 1 || statuses.length > 1 || entries.some(({ preferred }) => preferred === false);
  const status = !entries.length ? 'uncovered' : disagreement ? 'mixed' : statuses[0];
  const preferred = entries.find((entry) => entry.preferred) ?? null;
  return { status, disagreement, sourceCount, preferred, entries };
};

export function lookupWording(localeTag, conceptId, role) {
  const result = inspectLocale(localeTag);
  const concept = inspectConcept(conceptId);
  const entries = result.wording.entries.filter((entry) => (
    entry.concept === conceptId && (!role || entry.role === role)
  ));
  return { ...result, concept, wording: wordingSummary(entries) };
}

function invokedDirectly() {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  try {
    const [, , locale, concept, role, ...rest] = process.argv;
    if (!locale || !concept || rest.length) throw new Error('Usage: node lookup.mjs <locale> <concept> [ui-role]');
    console.log(JSON.stringify(lookupWording(locale, concept, role), null, 2));
  } catch (error) {
    console.error('nativeskill: ' + error.message);
    process.exitCode = 2;
  }
}
