// A chat widget for a SaaS product (Acme). The base table is exported; the overlays are not, and
// resolveStrings() merges them for one language at run time. Anonymised from a real widget.
import { BOOKING_I18N } from './booking'

export interface LocaleStrings {
  welcome: string
  online: string
  send: string
  ticketTitle: string
  ticketOpen: string
  historyEmpty: string
  bookTitle: string
  bookConfirm: string
}

export const LOCALES: Record<string, LocaleStrings> = {
  'en-IN': {
    welcome: 'Hi! How can I help you today?',
    online: 'Online',
    send: 'Send',
    ticketTitle: 'Your tickets',
    ticketOpen: 'Open a ticket',
    historyEmpty: 'No conversations yet',
    bookTitle: 'Book a visit',
    bookConfirm: 'Confirm booking',
  },
  'ta-IN': {
    welcome: 'வணக்கம்! இன்று நான் எப்படி உதவலாம்?',
    online: 'ஆன்லைன்',
    send: 'அனுப்பு',
    ticketTitle: 'Your tickets',
    ticketOpen: 'Open a ticket',
    historyEmpty: 'No conversations yet',
    bookTitle: 'Book a visit',
    bookConfirm: 'Confirm booking',
  },
  'ms-MY': {
    welcome: 'Hai! Apa yang boleh saya bantu hari ini?',
    online: 'Dalam talian',
    send: 'Hantar',
    ticketTitle: 'Your tickets',
    ticketOpen: 'Open a ticket',
    historyEmpty: 'No conversations yet',
    bookTitle: 'Book a visit',
    bookConfirm: 'Confirm booking',
  },
  'ar-AE': {
    welcome: 'مرحبًا! كيف يمكنني مساعدتك اليوم؟',
    online: 'متصل',
    send: 'إرسال',
    ticketTitle: 'Your tickets',
    ticketOpen: 'Open a ticket',
    historyEmpty: 'No conversations yet',
    bookTitle: 'Book a visit',
    bookConfirm: 'Confirm booking',
  },
}
LOCALES['ar-SA'] = LOCALES['ar-AE']

const TICKET_I18N: Record<string, Partial<LocaleStrings>> = {
  'ta-IN': { ticketTitle: 'உங்கள் டிக்கெட்டுகள்', ticketOpen: 'டிக்கெட்டைத் திறக்கவும்' },
  'ms-MY': { ticketTitle: 'Tiket anda', ticketOpen: 'Buka tiket' },
  'ar-AE': { ticketTitle: 'تذاكرك', ticketOpen: 'افتح تذكرة' },
}
TICKET_I18N['ar-SA'] = TICKET_I18N['ar-AE']

const HISTORY_I18N: Record<string, Partial<LocaleStrings>> = {
  'ta-IN': { historyEmpty: 'இதுவரை உரையாடல்கள் இல்லை' },
  'ms-MY': { historyEmpty: 'Belum ada perbualan' },
}

export function resolveStrings(language: string | undefined, overrides?: Partial<LocaleStrings>): LocaleStrings {
  const lang = language ?? ''
  const base = LOCALES[lang] ?? LOCALES['en-IN']
  const tickets = TICKET_I18N[lang] ?? {}
  const history = HISTORY_I18N[lang] ?? {}
  const booking = BOOKING_I18N[lang] ?? {}
  return {
    ...LOCALES['en-IN'],
    ...BOOKING_I18N['en-IN'],
    ...base,
    ...tickets,
    ...history,
    ...booking,
    ...(overrides ?? {}),
  }
}
