import { Dict } from './types'
import { en } from './en'

export const fil: Dict = {
  brand: {
    productName: 'Acme',
  },
  common: {
    back: 'Bumalik',
    clear: 'I-clear',
    delete: 'Burahin',
    remove: 'Alisin',
    errorGeneric: 'May nangyaring mali.',
    saving: 'Sinese-save…',
    cancel: 'Kanselahin',
  },
  nav: {
    leads: 'Mga Lead',
    leaveWorkspaceBody: (workspace) => `Umalis sa ${workspace} ? Mawawalan ka agad ng access. Maaaring imbitahan ka ng may-ari o admin sa ibang pagkakataon.`,
  },
  login: {
    signupCta: 'Mag-sign up',
  },
  bot: {
    modeOffDesc: 'Walang lead scoring o pagkuha.',
  },
  api: {
    scopeLeadsRead: 'Basahin ang mga lead',
    confirmRevokeToken: (name) => `Bawiin ang " ${name} "? Ang paggamit ng code ay hihinto kaagad sa paggana.`,
    scopesCount: (n) => `Mga saklaw ng ${n}`,
  },
  billing: {
    renewsOn: 'Nagre-renew sa',
    cancelsAtPeriodEnd: 'Kinakansela sa pagtatapos ng panahon',
  },
  integrations: {
    confirmDisconnect: (clientName) => `Idiskonekta ang ${clientName} ? Nawalan agad ito ng access.`,
    importIntoKb: (n) => n ? `Import ${n} into knowledge base` : 'Mag-import sa base ng kaalaman',
    noItemsFound: (nounPlural, provider) => `Walang nakitang ${nounPlural}. Sa ${provider} , ibahagi ang ${nounPlural} na gusto mo sa Acme na koneksyon, pagkatapos ay i-reload.`,
    toastNoTextFound: (noun) => `Walang nahanap na nilalamang teksto sa napiling (mga) ${noun}. Pumili ng mga ${noun} na may nakasulat na nilalaman, hindi mga walang laman.`,
  },
  conversations: {
    messagesAgo: (count, ago) => `Mga mensahe ng ${count} · ${ago}`,
  },
  kbNew: {
    uploadFiles: (count) => `Mag-upload ng ${count} file`,
    pagesLeftInQuota: (n) => `${n} page na natitira sa quota`,
  },
  widget: {
    tooltip: 'Tooltip (kapag na-hover ang launcher)',
    hideLauncherTooltip: 'Itago ang tooltip ng launcher',
    tooltipPlaceholder: 'Makipag-chat sa amin!',
  },
  bots: {
    toastCreated: (name) => `Nilikha ang " ${name} "`,
    deleteDialogBody: 'Tanggalin ang " {name} "? Aalisin ang base ng kaalaman nito at kasaysayan ng pag-uusap. Hindi na ito maaaring bawiin.',
    slotsAvailable: (n) => n === 1 ? '1 available' : `${n} available`,
  },
  contacts: {
    externalId: (id) => `id: ${id}`,
  },
  inbox: en.inbox,
}
