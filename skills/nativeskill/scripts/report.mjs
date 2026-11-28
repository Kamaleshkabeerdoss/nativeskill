// Summaries and text output for check.mjs.

// Triage order for a report. P1 breaks the app or shows nothing; P2 shows the wrong meaning or English;
// P3 is polish a native reader would notice.
export const BUCKETS = {
  P1: 'broken or missing',
  P2: 'wrong meaning or still English',
  P3: 'polish'
};
const P2 = new Set(['possible-source-copy', 'english-in-branch', 'english-residue', 'wrong-word', 'count-noun-order', 'source-changed', 'hand-rolled-plural', 'term-inconsistent']);

export function bucketOf(finding) {
  if (finding.severity === 'error') return 'P1';
  return P2.has(finding.code) ? 'P2' : 'P3';
}

export function sectionOf(key) {
  const base = key.split('#')[0];
  if (base.includes('.')) return base.split('.')[0];
  if (base.includes('_')) return base.split('_')[0];
  const camel = base.match(/^[a-z]+(?=[A-Z0-9])/);
  return camel ? camel[0] : base;
}

const COPY_CODES = new Set(['possible-source-copy']);

export function summarize({ left, right, findings, suppressed, locale }) {
  const sections = new Map();
  const section = (name) => {
    if (!sections.has(name)) sections.set(name, { section: name, keys: 0, translated: 0, missing: 0, sourceCopy: 0, deliberate: 0, aliasedFrom: new Set() });
    return sections.get(name);
  };
  const flagged = new Map();
  for (const finding of findings) {
    if (!flagged.has(finding.key)) flagged.set(finding.key, new Set());
    flagged.get(finding.key).add(finding.code);
  }
  const hidden = new Set(suppressed.map(({ key }) => key));
  for (const [key, message] of left) {
    if (message.dynamic) continue;
    const item = section(sectionOf(key));
    item.keys += 1;
    const codes = flagged.get(key) ?? new Set();
    const target = right.get(key);
    if (target?.alias) item.aliasedFrom.add(target.alias.split('.').slice(0, 2).join('.'));
    if (hidden.has(key) && !codes.size) item.deliberate += 1;
    else if (codes.has('missing-key')) item.missing += 1;
    else if ([...codes].some((code) => COPY_CODES.has(code))) item.sourceCopy += 1;
    else item.translated += 1;
  }
  const list = [...sections.values()].map((item) => {
    const counted = item.keys - item.deliberate;
    const translatedPct = counted ? Math.round((item.translated / counted) * 100) : 100;
    return {
      ...item,
      aliasedFrom: [...item.aliasedFrom][0] ?? null,
      translatedPct,
      untranslated: counted >= 3 && item.translated / counted < 0.1
    };
  }).sort((a, b) => (b.missing + b.sourceCopy) - (a.missing + a.sourceCopy) || a.section.localeCompare(b.section));
  const totals = list.reduce((sum, item) => {
    for (const name of ['keys', 'translated', 'missing', 'sourceCopy', 'deliberate']) sum[name] += item[name];
    return sum;
  }, { keys: 0, translated: 0, missing: 0, sourceCopy: 0, deliberate: 0 });
  const counted = totals.keys - totals.deliberate;
  const groups = new Map();
  for (const finding of findings) {
    const id = finding.code + '\0' + sectionOf(finding.key);
    if (!groups.has(id)) groups.set(id, { code: finding.code, severity: finding.severity, section: sectionOf(finding.key), count: 0, keys: [] });
    const group = groups.get(id);
    group.count += 1;
    group.keys.push(finding.key);
  }
  const buckets = { P1: 0, P2: 0, P3: 0 };
  for (const finding of findings) buckets[finding.bucket ?? bucketOf(finding)] += 1;
  return {
    locale,
    ...totals,
    buckets,
    coveragePct: counted ? Math.round((totals.translated / counted) * 100) : 100,
    sections: list,
    groups: [...groups.values()].sort((a, b) => b.count - a.count)
  };
}

const pad = (text, width) => String(text).padEnd(width);

export function formatText(result, { verbose = false, groupAt = 5 } = {}) {
  const lines = [];
  const { summary } = result;
  if (summary) {
    lines.push('Triage: P1 ' + BUCKETS.P1 + ' ' + summary.buckets.P1 + ' · P2 ' + BUCKETS.P2 + ' ' + summary.buckets.P2 + ' · P3 ' + BUCKETS.P3 + ' ' + summary.buckets.P3);
    lines.push('Coverage ' + summary.locale + ': ' + summary.translated + ' of ' + (summary.keys - summary.deliberate) + ' keys translated (' + summary.coveragePct + '%), ' +
      summary.missing + ' missing, ' + summary.sourceCopy + ' still English' + (summary.deliberate ? ', ' + summary.deliberate + ' deliberately English' : '') + '.');
    const weak = summary.sections.filter((item) => item.missing + item.sourceCopy > 0);
    if (weak.length) {
      lines.push('Sections with gaps:');
      const width = Math.min(28, Math.max(...weak.map((item) => item.section.length)) + 2);
      for (const item of weak.slice(0, verbose ? weak.length : 15)) {
        lines.push('  ' + pad(item.section, width) + pad(item.translated + '/' + (item.keys - item.deliberate) + ' translated ', 20) +
          (item.missing ? item.missing + ' missing  ' : '') + (item.sourceCopy ? item.sourceCopy + ' English  ' : '') +
          (item.aliasedFrom ? '(taken from ' + item.aliasedFrom + ')  ' : '') + (item.untranslated ? '<- looks untranslated' : ''));
      }
      if (!verbose && weak.length > 15) lines.push('  … ' + (weak.length - 15) + ' more sections (--verbose)');
    }
    lines.push('');
  }
  const grouped = new Set();
  if (!verbose && summary) {
    for (const group of summary.groups) {
      if ((group.severity === 'error' && group.code !== 'missing-key') || group.count <= groupAt) continue;
      grouped.add(group.code + '\0' + group.section);
    }
  }
  const printedGroups = new Set();
  const order = [...result.findings].sort((a, b) => (a.bucket ?? '').localeCompare(b.bucket ?? ''));
  for (const finding of order) {
    const id = finding.code + '\0' + sectionOf(finding.key);
    if (grouped.has(id)) {
      if (printedGroups.has(id)) continue;
      printedGroups.add(id);
      const group = summary.groups.find((item) => item.code + '\0' + item.section === id);
      lines.push(finding.severity + (finding.bucket ? ' ' + finding.bucket : '') + ' ' + finding.code + ' ' + group.count + ' keys in ' + group.section + ' (' + group.keys.slice(0, 3).join(', ') + ', …). --verbose lists them.');
      continue;
    }
    lines.push(finding.severity + (finding.bucket ? ' ' + finding.bucket : '') + ' ' + finding.code + ' ' + finding.key + ' ' + finding.message);
  }
  lines.push(result.errors + ' errors, ' + result.warnings + ' warnings' +
    (result.suppressed?.length ? ', ' + result.suppressed.length + ' suppressed by ' + (result.config ?? 'flags') : ''));
  return lines.join('\n');
}
