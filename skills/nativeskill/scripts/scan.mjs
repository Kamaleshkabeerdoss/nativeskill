import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const extensions = new Set(['.dart', '.kt', '.java', '.swift', '.tsx', '.jsx', '.xml', '.vue']);
const skipDirectories = new Set(['node_modules', 'build', '.dart_tool', 'dist', '.git', 'Pods', 'coverage']);

function extensionOf(file) {
  const index = file.lastIndexOf('.');
  return index < 0 ? '' : file.slice(index);
}

function filesUnder(path, found = []) {
  const info = statSync(path);
  if (info.isFile()) {
    if (extensions.has(extensionOf(path))) found.push(path);
    return found;
  }
  for (const name of readdirSync(path)) {
    if (skipDirectories.has(name)) continue;
    filesUnder(join(path, name), found);
  }
  return found;
}

function visible(text) {
  const value = text.trim();
  if (value.length < 2) return false;
  if (value.startsWith('@') || value.startsWith('http://') || value.startsWith('https://')) return false;
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return false;
  if (/^[A-Za-z0-9_./:@+-]+$/.test(value)) return false;
  return /\p{L}/u.test(value);
}

function lineOf(text, index) {
  return text.slice(0, index).split(/\n/).length;
}

const patterns = [
  { kind: 'android-attribute', re: /\bandroid:(?:text|hint|contentDescription|label)="([^"\\]+)"/g },
  { kind: 'text-call', re: /\bText\(\s*["']([^"'\n]+)["']/g },
  { kind: 'setter', re: /\b(?:setText|setTitle|setHint|setContentDescription)\(\s*["']([^"'\n]+)["']/g },
  { kind: 'named-copy', re: /\b(?:title|label|hint|message|placeholder|contentDescription|semanticsLabel)\s*[:=]\s*["']([^"'\n]+)["']/g }
];

export function scanText(file, text) {
  const findings = [];
  for (const { kind, re } of patterns) {
    re.lastIndex = 0;
    for (const match of text.matchAll(re)) {
      if (!visible(match[1])) continue;
      findings.push({
        file, line: lineOf(text, match.index), kind, text: match[1],
        message: 'Hardcoded user-facing text. Move it into the locale catalog.'
      });
    }
  }
  return findings;
}

export function scanPaths(paths) {
  return paths.flatMap((path) => filesUnder(path).flatMap((file) => scanText(relative(process.cwd(), file), readFileSync(file, 'utf8'))));
}

function invokedDirectly() {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  const args = process.argv.slice(2).filter((arg) => arg !== '--json');
  const json = process.argv.includes('--json');
  if (!args.length || args.includes('--help')) {
    console.log('Usage: node scan.mjs [--json] <file-or-directory>...');
    process.exitCode = args.length ? 0 : 2;
  } else {
    try {
      const findings = scanPaths(args);
      if (json) console.log(JSON.stringify({ schema: 1, findings }, null, 2));
      else {
        for (const finding of findings) console.log(finding.file + ':' + finding.line + ' ' + finding.text);
        console.log(findings.length + ' hardcoded strings');
      }
      if (findings.length) process.exitCode = 1;
    } catch (error) {
      console.error('nativeskill: ' + error.message);
      process.exitCode = 2;
    }
  }
}
