// Docs navigation: labels come from a local helper that zips a slug list with per-language labels.
const SLUGS = ['start', 'install', 'whatsapp', 'billing'] as const

function labels(list: string[]): Record<string, string> {
  return Object.fromEntries(SLUGS.map((slug, index) => [slug, list[index] ?? (slug === 'whatsapp' ? 'WhatsApp' : slug)]))
}

const SECTIONS = ['Getting started', 'Build', 'Grow']

export const DOCS_DICTS = {
  en: { title: 'Docs', sections: SECTIONS, labels: labels(['Start here', 'Install the widget', 'WhatsApp', 'Billing']) },
  ms: { title: 'Dokumentasi', sections: ['Bermula', 'Bina', 'Kembangkan'], labels: labels(['Mula di sini', 'Pasang widget']) },
}
