// Minimal typed dictionary, same shape as the real app: typed TS object, arrow functions, section aliases.
export type Dict = {
  brand: { productName: string }
  common: {
    back: string
    clear: string
    delete: string
    remove: string
    errorGeneric: string
    saving: string
    cancel: string
  }
  nav: {
    leads: string
    leaveWorkspaceBody: (workspace: string) => string
  }
  login: {
    signupCta: string
  }
  bot: {
    modeOffDesc: string
  }
  api: {
    scopeLeadsRead: string
    confirmRevokeToken: (name: string) => string
    scopesCount: (n: number) => string
  }
  billing: {
    renewsOn: string
    cancelsAtPeriodEnd: string
  }
  integrations: {
    confirmDisconnect: (provider: string, nounPlural: string) => string
    importIntoKb: (n: number) => string
    noItemsFound: (nounPlural: string, provider: string) => string
    toastNoTextFound: (noun: string) => string
  }
  conversations: {
    messagesAgo: (count: number, ago: string) => string
  }
  kbNew: {
    uploadFiles: (count: number) => string
    pagesLeftInQuota: (n: number) => string
  }
  widget: {
    tooltip: string
    hideLauncherTooltip: string
    tooltipPlaceholder: string
  }
  bots: {
    toastCreated: (name: string) => string
    deleteDialogBody: string
    slotsAvailable: (n: number) => string
  }
  contacts: {
    externalId: (id: string) => string
  }
  inbox: {
    title: string
    description: string
    unpaidTitle: string
  }
  // Optional add-on section. Locales may omit it on purpose; the app falls back to English.
  extras?: { title: string; hint: string }
}
