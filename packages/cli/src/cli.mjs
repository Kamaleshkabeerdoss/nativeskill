#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { inspectConcept, inspectLanguage, inspectLocale, lookupWording, registry } from './locales.mjs';
import { validate } from './validate.mjs';
import { checkCatalogs } from '../../../skills/nativeskill/scripts/check.mjs';

const help = `
NativeSkill CLI

  nativeskill locales list [--json]
  nativeskill inspect --locale <tag> [--concept <id>] [--json]
  nativeskill inspect --language <code> [--json]
  nativeskill inspect --concept <id> [--json]
  nativeskill validate --source <file> --target <file> --locale <tag> [--json]
  nativeskill check --source <file> --target <file> --locale <tag> [--json]

Validate options
  --source-locale <tag>      Flag source copies when the language changes
  --source-export <name>     Name the source JS or TS dictionary export
  --target-export <name>     Name the target JS or TS dictionary export
  --format <mode>            auto, icu, or i18next (default: auto)

Check options
  --source-locale <tag>      Source language (default: en)
  --format <mode>            auto, json, android, strings, or xcstrings
`.trim();

const yesNo = { type: 'boolean' };
const value = { type: 'string' };
const common = { json: yesNo, help: yesNo };
const inspect = { ...common, locale: value, language: value, concept: value };
const validation = {
  ...common, source: value, target: value, locale: value, 'source-locale': value,
  'source-export': value, 'target-export': value, format: value
};
const checkOptions = {
  ...common, source: value, target: value, locale: value, 'source-locale': value, format: value
};

function print(output, json, format) {
  console.log(json ? JSON.stringify(output, null, 2) : format(output));
}

function main([command, ...args]) {
  if (!command || ['--help', '-h', 'help'].includes(command)) {
    console.log(help);
    return;
  }
  if (command === 'locales' && args.shift() === 'list') {
    const { values } = parseArgs({ args, options: common });
    if (values.help) return console.log(help);
    print(registry, values.json, ({ languageCount, regionalLocaleCount, languages }) => [
      languageCount + ' languages, ' + regionalLocaleCount + ' regional profiles',
      ...languages.map(({ id, name, wordingStatus }) => id + '\t' + name + '\t' + wordingStatus)
    ].join('\n'));
    return;
  }
  if (command === 'inspect') {
    const { values } = parseArgs({ args, options: inspect });
    if (values.help) return console.log(help);
    if ((!values.locale && !values.language && !values.concept) || (values.language && (values.locale || values.concept))) {
      throw new Error('Provide --locale, --language, or --concept. A locale can be paired with a concept.');
    }
    if (values.locale) {
      const result = values.concept
        ? lookupWording(values.locale, values.concept)
        : inspectLocale(values.locale);
      print(result, values.json, ({ name, profile, wording, references, concept }) => [
        name + ' · ' + profile.tag + ' · ' + profile.script + ' · ' + profile.direction,
        'Wording status: ' + wording.status,
        ...(concept ? [
          concept.id + ' · ' + concept.intent,
          'Preserve: ' + concept.preserve.join(' '),
          ...wording.entries.map(({ text, role, locale, status, source }) => (
            text + ' · ' + role + ' · ' + locale + ' · ' + status + ' · ' + source.url
          ))
        ] : []),
        ...references.map(({ kind, url }) => kind + ' ' + url)
      ].join('\n'));
    } else if (values.language) {
      print(inspectLanguage(values.language), values.json, ({ name, profiles }) => [
        name, ...profiles.map(({ tag, script, direction }) => [tag, script, direction].join('\t'))
      ].join('\n'));
    } else {
      print(inspectConcept(values.concept), values.json, ({ id, intent, ui, preserve }) => [
        id, intent, 'Where: ' + ui, 'Preserve: ' + preserve.join('; ')
      ].join('\n'));
    }
    return;
  }
  if (command === 'validate') {
    const { values } = parseArgs({ args, options: validation });
    if (values.help) return console.log(help);
    if (!values.source || !values.target || !values.locale) throw new Error('Provide --source, --target, and --locale');
    const format = values.format ?? 'auto';
    if (!['auto', 'icu', 'i18next'].includes(format)) throw new Error('Choose auto, icu, or i18next for --format');
    const result = validate({
      source: values.source, target: values.target, locale: values.locale, format,
      sourceLocale: values['source-locale'], sourceExport: values['source-export'], targetExport: values['target-export']
    });
    print(result, values.json, ({ findings, errors, warnings }) => [
      ...findings.map(({ severity, code, file, path, message }) => (
        severity + ' ' + code + ' ' + file + ' [' + path.join('.') + '] ' + message
      )),
      errors + ' errors, ' + warnings + ' warnings'
    ].join('\n'));
    process.exitCode = result.errors ? 1 : 0;
    return;
  }
  if (command === 'check') {
    const { values } = parseArgs({ args, options: checkOptions });
    if (values.help) return console.log(help);
    const format = values.format ?? 'auto';
    if (!['auto', 'json', 'android', 'strings', 'xcstrings'].includes(format)) {
      throw new Error('Choose auto, json, android, strings, or xcstrings for --format');
    }
    const result = checkCatalogs({
      source: values.source, target: values.target, locale: values.locale, format,
      sourceLocale: values['source-locale'] ?? 'en'
    });
    print(result, values.json, ({ findings, errors, warnings }) => [
      ...findings.map(({ severity, code, key, message }) => severity + ' ' + code + ' ' + key + ' ' + message),
      errors + ' errors, ' + warnings + ' warnings'
    ].join('\n'));
    process.exitCode = result.errors ? 1 : 0;
    return;
  }
  throw new Error('Unknown command. Run nativeskill --help.');
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error('nativeskill: ' + error.message);
  process.exitCode = 2;
}
