import { Dict } from './types'
import { en } from './en'

export const id: Dict = {
  brand: {
    productName: 'Acme',
  },
  common: {
    back: 'Kembali',
    clear: 'Hapus',
    delete: 'Hapus',
    remove: 'Hapus',
    errorGeneric: 'Terjadi kesalahan.',
    saving: 'Menyimpan…',
    cancel: 'Batal',
  },
  nav: {
    leads: 'Prospek',
    leaveWorkspaceBody: (workspace) => `Keluar dari ${workspace}? Anda akan segera kehilangan akses. Pemilik atau admin dapat mengundang Anda kembali nanti.`,
  },
  login: {
    signupCta: 'Daftar',
  },
  bot: {
    modeOffDesc: 'Tidak ada penilaian atau penangkapan prospek.',
  },
  api: {
    scopeLeadsRead: 'Baca petunjuk',
    confirmRevokeToken: (name) => `Cabut " ${name} "? Kode yang menggunakannya akan segera berhenti berfungsi.`,
    scopesCount: (n) => `Cakupan ${n}`,
  },
  billing: {
    renewsOn: 'Memperbarui',
    cancelsAtPeriodEnd: 'Dibatalkan pada akhir periode',
  },
  integrations: {
    confirmDisconnect: (clientName) => `Putuskan sambungan ${clientName}? Itu segera kehilangan akses.`,
    importIntoKb: (n) => n ? `Import ${n} into knowledge base` : 'Impor ke basis pengetahuan',
    noItemsFound: (nounPlural, provider) => `Tidak ada ${nounPlural} yang ditemukan. Di ${provider}, bagikan ${nounPlural} yang Anda inginkan dengan koneksi Acme, lalu muat ulang.`,
    toastNoTextFound: (noun) => `Tidak ada konten teks yang ditemukan di ${noun} yang dipilih. Pilih ${noun} yang memiliki konten tertulis, bukan yang kosong.`,
  },
  conversations: {
    messagesAgo: (count, ago) => `Pesan ${count} · ${ago}`,
  },
  kbNew: {
    uploadFiles: (count) => `Unggah file ${count}`,
    pagesLeftInQuota: (n) => `Halaman ${n} tersisa dalam kuota`,
  },
  widget: {
    tooltip: 'Keterangan alat (peluncur melayang)',
    hideLauncherTooltip: 'Sembunyikan keterangan alat peluncur',
    tooltipPlaceholder: 'Ngobrol dengan kami!',
  },
  bots: {
    toastCreated: (name) => `Dibuat "${name}"`,
    deleteDialogBody: 'Hapus "{name}"? Basis pengetahuan dan riwayat percakapannya akan dihapus. Hal ini tidak dapat dibatalkan.',
    slotsAvailable: (n) => n === 1 ? '1 tersedia' : `${n} tersedia`,
  },
  contacts: {
    externalId: (id) => `ID: ${id}`,
  },
  inbox: en.inbox,
}
