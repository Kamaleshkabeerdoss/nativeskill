import { Dict } from './types'
import { en } from './en'

export const ar: Dict = {
  brand: {
    productName: 'Acme',
  },
  common: {
    back: 'رجوع',
    clear: 'مسح',
    delete: 'حذف',
    remove: 'إزالة',
    errorGeneric: 'حدث خطأ ما.',
    saving: 'جارٍ الحفظ…',
    cancel: 'إلغاء',
  },
  nav: {
    leads: 'العملاء المحتملون',
    leaveWorkspaceBody: (workspace) => `ترك ${workspace}؟ ستفقد إمكانية الوصول على الفور. يمكن للمالك أو المسؤول دعوتك مرة أخرى لاحقًا.`,
  },
  login: {
    signupCta: 'إنشاء حساب',
  },
  bot: {
    modeOffDesc: 'لا يوجد تسجيل الرصاص أو التقاط.',
  },
  api: {
    scopeLeadsRead: 'قراءة العملاء المحتملين',
    confirmRevokeToken: (name) => `إلغاء "${name}"؟ سيتوقف الكود الذي يستخدمه عن العمل على الفور.`,
    scopesCount: (n) => `نطاقات ${n}`,
  },
  billing: {
    renewsOn: 'يتجدد على',
    cancelsAtPeriodEnd: 'يلغي في نهاية الفترة',
  },
  integrations: {
    confirmDisconnect: (clientName) => `افصل ${clientName}؟ يفقد الوصول على الفور.`,
    importIntoKb: (n) => n ? `Import ${n} into knowledge base` : 'استيراد إلى قاعدة المعرفة',
    noItemsFound: (nounPlural, provider) => `لم يتم العثور على ${nounPlural}. في ${provider}، قم بمشاركة ${nounPlural} الذي تريده مع اتصال Acme، ثم أعد التحميل.`,
    toastNoTextFound: (noun) => `لم يتم العثور على محتوى نصي في ${noun} (s) المحددة. اختر أجهزة ${noun} التي تحتوي على محتوى مكتوب، وليس محتوى فارغًا.`,
  },
  conversations: {
    messagesAgo: (count, ago) => `رسائل ${count} · ${ago}`,
  },
  kbNew: {
    uploadFiles: (count) => `تحميل ملف ${count}`,
    pagesLeftInQuota: (n) => `صفحات ${n} متبقية في الحصة`,
  },
  widget: {
    tooltip: 'تلميح الأداة (التمرير فوق المشغل)',
    hideLauncherTooltip: 'إخفاء تلميح أداة المشغل',
    tooltipPlaceholder: 'الدردشة معنا!',
  },
  bots: {
    toastCreated: (name) => `تم إنشاء "${name}"`,
    deleteDialogBody: 'هل تريد حذف "{name}"؟ ستتم إزالة قاعدة المعرفة وسجل المحادثات. لا يمكن التراجع عن هذا.',
    slotsAvailable: (n) => n === 1 ? 'خانة واحدة متاحة' : `${n} متاحة`,
  },
  contacts: {
    externalId: (id) => `المعرف: ${id}`,
  },
  inbox: en.inbox,
}
