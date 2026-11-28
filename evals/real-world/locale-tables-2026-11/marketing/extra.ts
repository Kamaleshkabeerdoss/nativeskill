// Marketing site: one non-exported constant per language, gathered into a table keyed by locale.
type Locale = 'en' | 'ja' | 'ms'
type ExtraDict = { pricing: { monthly: string; annual: string; save: string }; cta: string }

const en: ExtraDict = {
  pricing: { monthly: 'Monthly', annual: 'Annual', save: 'Save 20%' },
  cta: 'Start free trial',
}
const ja: ExtraDict = {
  pricing: { monthly: '月払い', annual: '年払い', save: '20%お得' },
  cta: '無料で試す',
}
const ms: ExtraDict = {
  ...en,
  pricing: { monthly: 'Bulanan', annual: 'Tahunan', save: 'Jimat 20%' },
}

export const EXTRA: Record<Locale, ExtraDict> = { en, ja, ms }
