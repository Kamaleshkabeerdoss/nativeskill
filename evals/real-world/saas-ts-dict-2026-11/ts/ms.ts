import { Dict } from './types'
import { en } from './en'

export const ms: Dict = {
  brand: {
    productName: 'Acme',
  },
  common: {
    back: 'Kembali',
    clear: 'Kosongkan',
    delete: 'Padam',
    remove: 'Buang',
    errorGeneric: 'Sesuatu telah berlaku.',
    saving: 'Menyimpan…',
    cancel: 'Batal',
  },
  nav: {
    leads: 'Lead',
    leaveWorkspaceBody: (workspace) => `Tinggalkan ${workspace} ? Anda akan kehilangan akses serta-merta. Pemilik atau pentadbir boleh menjemput anda kembali kemudian.`,
  },
  login: {
    signupCta: 'Daftar',
  },
  bot: {
    modeOffDesc: 'Tiada pemarkahan atau tangkapan petunjuk.',
  },
  api: {
    scopeLeadsRead: 'Baca petunjuk',
    confirmRevokeToken: (name) => `Batalkan " ${name} "? Kod yang menggunakannya akan berhenti berfungsi serta-merta.`,
    scopesCount: (n) => `Skop ${n}`,
  },
  billing: {
    renewsOn: 'Dibaharui pada',
    cancelsAtPeriodEnd: 'Batal pada akhir tempoh',
  },
  integrations: {
    confirmDisconnect: (clientName) => `Putuskan sambungan ${clientName} ? Ia kehilangan akses serta-merta.`,
    importIntoKb: (n) => n ? `Import ${n} into knowledge base` : 'Import ke dalam pangkalan pengetahuan',
    noItemsFound: (nounPlural, provider) => `Tiada ${nounPlural} ditemui. Dalam ${provider} , kongsi ${nounPlural} yang anda inginkan dengan sambungan Acme, kemudian muat semula.`,
    toastNoTextFound: (noun) => `Tiada kandungan teks ditemui dalam ${noun} (s) yang dipilih. Pilih ${noun} yang mempunyai kandungan bertulis, bukan yang kosong.`,
  },
  conversations: {
    messagesAgo: (count, ago) => `Mesej ${count} · ${ago}`,
  },
  kbNew: {
    uploadFiles: (count) => `Muat naik fail ${count}`,
    pagesLeftInQuota: (n) => `${n} halaman tinggal dalam kuota`,
  },
  widget: {
    tooltip: 'Petua alat (legar pelancar)',
    hideLauncherTooltip: 'Sembunyikan petua alat pelancar',
    tooltipPlaceholder: 'Sembang dengan kami!',
  },
  bots: {
    toastCreated: (name) => `Dicipta " ${name} "`,
    deleteDialogBody: 'Padamkan " {name} "? Pangkalan pengetahuan dan sejarah perbualannya akan dialih keluar. Ini tidak boleh dibuat asal.',
    slotsAvailable: (n) => n === 1 ? '1 tersedia' : `${n} tersedia`,
  },
  contacts: {
    externalId: (id) => `id: ${id}`,
  },
  inbox: en.inbox,
}
