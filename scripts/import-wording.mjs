// Run against extracted upstream archives named <repository>-<revision>.
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// --only <id>[,<id>] re-imports those sources and keeps every other source's rows from the current corpus,
// so one pinned archive is enough to refresh one source.
const args = process.argv.slice(2);
const onlyAt = args.indexOf('--only');
const only = onlyAt >= 0 ? new Set(args.splice(onlyAt, 2)[1]?.split(',')) : null;
const upstream = args[0];
if (!upstream || (only && !only.size)) throw new Error('Usage: node scripts/import-wording.mjs <extracted-upstream-directory> [--only <source-id>]');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const local = (path) => new URL(path, import.meta.url);
const assets = (path) => local('../skills/nativeskill/assets/' + path);
const sources = json(local('./wording-sources.json'));
const concepts = new Set(json(assets('concepts.json')).concepts.map(({ id }) => id));
const localeOwners = new Map();
for (const { id, path } of json(assets('registry.json')).languages) {
  for (const profile of json(assets(path)).profiles) localeOwners.set(profile.tag, id);
}

function readMessages(path, format) {
  if (format !== 'po') return json(path);
  const messages = Object.create(null);
  const input = readFileSync(path, 'utf8');
  for (const block of input.split(/\r?\n\s*\r?\n/)) {
    if (/^msgctxt |^msgid_plural |^#~|^#,.*\bfuzzy\b/m.test(block)) continue;
    const item = block.match(/^msgid ("[^"\\]*(?:\\.[^"\\]*)*")\r?\nmsgstr ("[^"\\]*(?:\\.[^"\\]*)*")(?![^\r\n])/m);
    if (item && !/^"/m.test(block)) messages[JSON.parse(item[1])] = JSON.parse(item[2]);
  }
  return messages;
}

const previousCorpus = existsSync(local('./wording-corpus.json')) ? json(local('./wording-corpus.json')) : {};
const manualIds = new Set(sources.filter((source) => source.manual || (only && !only.has(source.id))).map((source) => source.id));
if (only) for (const id of only) if (!sources.some((source) => source.id === id)) throw new Error('Unknown source ' + id);
const corpus = {};
for (const source of sources) {
  if (manualIds.has(source.id)) continue;
  const { id, repo, revision, licenseFile, notice, terms, catalog, format } = source;
  const excluded = new Set((source.exclude ?? []).map(({ locale, key }) => locale + '\0' + key));
  const directory = join(upstream, repo.split('/').at(-1) + '-' + revision);
  const catalogs = join(directory, catalog);
  const englishPath = (format === 'arb') ? 'material_en.arb' : 'en.json';

  // Gettext msgids are the source labels. JSON/ARB labels are checked against English.
  const english = format === 'po' ? null : readMessages(join(catalogs, englishPath), format);
  for (const [key, label, concept] of terms) {
    if (!concepts.has(concept)) throw new Error(id + ': unknown concept ' + concept);
    if (english && english[key] !== label) throw new Error(id + ': English meaning drift for ' + key);
  }
  copyFileSync(join(directory, licenseFile), local('../skills/nativeskill/licenses/' + notice));

  for (const name of readdirSync(catalogs).sort()) {
    const po = format === 'po';
    if (!po && !name.endsWith(format === 'arb' ? '.arb' : '.json')) continue;
    const upstreamTag = po ? name : name.replace(/^material_/, '').replace(/\.(json|arb)$/, '');
    if (source.include && !source.include.includes(upstreamTag)) continue;
    let locale;
    try { locale = new Intl.Locale(upstreamTag.replaceAll('_', '-')).baseName; }
    catch { continue; }
    const owner = localeOwners.get(locale);
    if (!owner) continue;
    const file = po ? name + '/LC_MESSAGES/django.po' : name;
    const path = join(catalogs, file);
    if (po && !existsSync(path)) continue;
    const messages = readMessages(path, format);
    for (const [key, label, concept, role] of terms) {
      if (excluded.has(locale + '\0' + key)) continue;
      let text = typeof messages[key] === 'string' ? messages[key].trim() : '';
      if (!text && format === 'po' && new Intl.Locale(locale).language === 'en') text = label;
      if (!text || text.length > 100 || /[{}<>]|[$%]\d|%\(|\r|\n/.test(text)) continue;
      if (new Intl.Locale(locale).language !== 'en' && text === label) continue;
      (corpus[owner] ??= []).push({ locale, concept, role, text, source: id, file, key });
    }
  }
}

for (const [owner, items] of Object.entries(previousCorpus)) {
  for (const item of items) {
    if (manualIds.has(item.source)) (corpus[owner] ??= []).push(item);
  }
}

const output = Object.keys(corpus).sort().map((id) => '  ' + JSON.stringify(id) + ': ' + JSON.stringify(corpus[id]));
writeFileSync(local('./wording-corpus.json'), '{\n' + output.join(',\n') + '\n}\n');
console.log(Object.keys(corpus).length + ' languages with ' + Object.values(corpus).flat().length + ' upstream UI examples.');
