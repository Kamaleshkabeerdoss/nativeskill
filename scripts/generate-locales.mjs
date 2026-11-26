import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const cldr = (path) => new URL('../node_modules/cldr-core/' + path, import.meta.url);
const asset = (path) => new URL('../skills/nativeskill/assets/' + path, import.meta.url);
const load = (path) => json(new URL(path, import.meta.url));

const launch = load('./launch-languages.json');
const extra = load('./extra-locales.json');
const languageReferences = load('./language-references.json');
const wordingCorpus = load('./wording-corpus.json');
const wordingDrafts = load('./wording-drafts.json');
const wordingSources = new Map(load('./wording-sources.json').map((source) => [source.id, source]));
const rubric = new Set(json(asset('concepts.json')).concepts.map(({ id }) => id));
const sourceTags = json(cldr('availableLocales.json')).availableLocales.full;
const available = new Set(sourceTags);
const likely = json(cldr('supplemental/likelySubtags.json')).supplemental.likelySubtags;
const scripts = json(cldr('scriptMetadata.json')).scriptMetadata;
const cardinals = json(cldr('supplemental/plurals.json')).supplemental['plurals-type-cardinal'];
const ordinals = json(cldr('supplemental/ordinals.json')).supplemental['plurals-type-ordinal'];
const version = json(cldr('package.json')).version;
const cldrUrl = 'https://github.com/unicode-org/cldr-json/blob/' + version + '/cldr-json/cldr-core/';
const ianaUrl = 'https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry';
const rtlUrl = 'https://www.w3.org/International/questions/qa-html-dir';
const order = ['zero', 'one', 'two', 'few', 'many', 'other'];

function pluralCategories(rules, tag, locale) {
  const candidates = [tag, locale.language + '-' + locale.region, locale.language];
  const source = candidates.find((candidate) => Object.hasOwn(rules, candidate));
  const categories = source ? order.filter((key) => rules[source]['pluralRule-count-' + key] !== undefined) : ['other'];
  return { categories, source: source ?? 'root' };
}

function profile(tag, fallbackCode) {
  const locale = new Intl.Locale(tag);
  const possible = [
    tag, [locale.language, locale.script].filter(Boolean).join('-'),
    [locale.language, locale.region].filter(Boolean).join('-'),
    locale.language, fallbackCode
  ];
  const expanded = new Intl.Locale(likely[possible.find((candidate) => likely[candidate])]);
  const script = locale.script ?? expanded.script;
  const bidi = scripts[script]?.rtl;
  if (!['YES', 'NO'].includes(bidi)) throw new Error('Unknown direction for ' + tag + ' (' + script + ')');

  return {
    tag,
    script,
    direction: bidi === 'YES' ? 'rtl' : 'ltr',
    region: locale.region ?? null,
    regionPrivateUse: /^(?:Q[M-Z]|X[A-Z])$/.test(locale.region ?? ''),
    cldrDefaultRegion: expanded.region ?? null,
    basis: available.has(tag) ? 'cldr-locale' : 'supplemental-profile',
    plurals: {
      cardinal: pluralCategories(cardinals, tag, locale),
      ordinal: pluralCategories(ordinals, tag, locale)
    }
  };
}

function profilesFor(code, primary) {
  const base = profile(code, primary);
  const tags = new Set([code, ...sourceTags.filter((tag) => tag.startsWith(code + '-')), ...(extra[code] ?? [])]);
  if (base.cldrDefaultRegion) tags.add(code + '-' + base.cldrDefaultRegion);

  for (const tag of [...tags]) {
    const locale = new Intl.Locale(tag);
    if (locale.script && locale.region && likely[code + '-' + locale.region]?.split('-')[1] === locale.script) {
      tags.add(code + '-' + locale.region);
    }
  }
  return [...tags].sort().map((tag) => profile(tag, primary));
}

function sourceReferences(id, codes, profiles) {
  const references = [
    { id: 'iana', kind: 'language-tags', url: ianaUrl },
    { id: 'cldr-likely', kind: 'script-and-region', url: cldrUrl + 'supplemental/likelySubtags.json' },
    { id: 'cldr-scripts', kind: 'script-direction', url: cldrUrl + 'scriptMetadata.json' },
    { id: 'cldr-plurals', kind: 'cardinal-plurals', url: cldrUrl + 'supplemental/plurals.json' },
    { id: 'cldr-ordinals', kind: 'ordinal-plurals', url: cldrUrl + 'supplemental/ordinals.json' }
  ];
  for (const code of codes.filter((tag) => available.has(tag))) {
    references.push({
      id: 'cldr-' + code, kind: 'locale-data',
      url: 'https://github.com/unicode-org/cldr/blob/release-' + version.split('.')[0] + '/common/main/' + code + '.xml'
    });
  }
  if (profiles.some(({ direction }) => direction === 'rtl')) {
    references.push({ id: 'w3c-bidi', kind: 'ui-implementation', url: rtlUrl });
  }
  const lexical = languageReferences[id];
  if (!lexical?.length) throw new Error('Missing dictionary reference for ' + id);
  references.push(...lexical);
  if (id === 'ms') {
    references.push({ id: 'dbp-prpm', kind: 'terminology-reference', scope: 'ms-MY', url: 'https://prpm.dbp.gov.my/' });
  }
  return references;
}

function buildWording(id, profiles) {
  const byTag = new Map(profiles.map((profile) => [profile.tag, profile]));
  const entries = (wordingCorpus[id] ?? []).map(({ locale, concept, role, text, source, file, key }) => {
    const profile = byTag.get(locale);
    const origin = wordingSources.get(source);
    if (!profile || !origin || !rubric.has(concept)) throw new Error('Invalid wording entry: ' + id + '/' + key);
    return {
      locale, script: profile.script, concept, role, text, status: 'source-attested',
      source: {
        id: source, key, license: origin.license,
        url: 'https://github.com/' + origin.repo + '/blob/' + origin.revision + '/' + origin.catalog + '/' + file
      }
    };
  });
  const sourceCount = entries.length;
  for (const { locale, concept, role, text, note, url } of wordingDrafts.filter((draft) => byTag.has(draft.locale))) {
    if (!rubric.has(concept) || new URL(url).protocol !== 'https:') throw new Error('Invalid wording draft: ' + concept);
    entries.push({
      locale, script: byTag.get(locale).script, concept, role, text,
      status: 'draft', note, source: { id: 'reference-only', url }
    });
  }
  const status = sourceCount ? 'source-attested' : entries.length ? 'draft' : 'foundation';
  return { status, sourceCount, entries };
}

const entries = [];
const tagOwners = Object.create(null);
let regionalLocaleCount = 0;
for (const [group, entriesInGroup] of Object.entries(launch)) {
  for (const [id, name, members = []] of entriesInGroup) {
    const codes = [id, ...members];
    const profiles = codes.flatMap((code) => profilesFor(code, id));
    const regions = new Set(profiles.filter(({ region }) => region).map(({ tag, script, region }) => (
      [new Intl.Locale(tag).language, script, region].join('-')
    )));
    regionalLocaleCount += regions.size;
    for (const code of codes) {
      if (Object.hasOwn(tagOwners, code)) throw new Error('Repeated language code ' + code);
      tagOwners[code] = id;
    }
    const pack = {
      schema: 1, id, name, group, codes, profiles,
      wording: buildWording(id, profiles),
      references: sourceReferences(id, codes, profiles)
    };
    const path = 'locales/' + id + '.json';
    writeFileSync(asset(path), JSON.stringify(pack) + '\n');
    entries.push({ id, name, group, path, regionalProfiles: regions.size, wordingStatus: pack.wording.status, wordingExamples: pack.wording.sourceCount });
  }
}
if (entries.length !== 110 || regionalLocaleCount < 150) {
  throw new Error('Launch target requires 110 languages and at least 150 distinct regional profiles');
}
const wordingLanguageCount = entries.filter(({ wordingExamples }) => wordingExamples > 0).length;
const wordingExampleCount = entries.reduce((sum, { wordingExamples }) => sum + wordingExamples, 0);
const registry = {
  schema: 1, cldrVersion: version, languageCount: entries.length, regionalLocaleCount,
  wordingLanguageCount, wordingExampleCount, tagOwners, languages: entries
};
writeFileSync(asset('registry.json'), JSON.stringify(registry, null, 2) + '\n');
copyFileSync(cldr('LICENSE'), new URL('../skills/nativeskill/LICENSE-UNICODE.txt', import.meta.url));
console.log('Generated ' + entries.length + ' language packs and ' + regionalLocaleCount + ' regional profiles.');
