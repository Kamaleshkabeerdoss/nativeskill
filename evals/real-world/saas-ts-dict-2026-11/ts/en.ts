import { Dict } from './types'

export const en: Dict = {
  brand: {
    productName: 'Acme',
  },
  common: {
    back: 'Back',
    clear: 'Clear',
    delete: 'Delete',
    remove: 'Remove',
    errorGeneric: 'Something went wrong.',
    saving: 'Saving…',
    cancel: 'Cancel',
  },
  nav: {
    leads: 'Leads',
    leaveWorkspaceBody: (workspace) => `Leave ${workspace}? You'll lose access immediately. An owner or admin can invite you back later.`,
  },
  login: {
    signupCta: 'Sign up',
  },
  bot: {
    modeOffDesc: 'No lead scoring or capture.',
  },
  api: {
    scopeLeadsRead: 'Read leads',
    confirmRevokeToken: (name) => `Revoke "${name}"? Code using it will stop working immediately.`,
    scopesCount: (n) => `${n} scopes`,
  },
  billing: {
    renewsOn: 'Renews on',
    cancelsAtPeriodEnd: 'Cancels at period end',
  },
  integrations: {
    confirmDisconnect: (provider, nounPlural) => `Disconnect ${provider}? Already-imported ${nounPlural} stay in your knowledge base.`,
    importIntoKb: (n) => n ? `Import ${n} into knowledge base` : 'Import into knowledge base',
    noItemsFound: (nounPlural, provider) => `No ${nounPlural} found. In ${provider}, share the ${nounPlural} you want with the Acme connection, then reload.`,
    toastNoTextFound: (noun) => `No text content found in the selected ${noun}(s). Pick ${noun}s that have written content, not empty ones.`,
  },
  conversations: {
    messagesAgo: (count, ago) => `${count} messages · ${ago}`,
  },
  kbNew: {
    uploadFiles: (count) => `Upload ${count} file${count === 1 ? '' : 's'}`,
    pagesLeftInQuota: (n) => `${n} pages left in quota`,
  },
  widget: {
    tooltip: 'Launcher greeting',
    hideLauncherTooltip: 'Hide launcher greeting',
    tooltipPlaceholder: "Hello there! I'm {botName} — your friendly {botName} AI chatbot! How can I help you today?",
  },
  bots: {
    toastCreated: (name) => `Created "${name}"`,
    deleteDialogBody: 'Delete "{name}"? Its knowledge base and conversations will be removed. This cannot be undone.',
    slotsAvailable: (n) => n === 1 ? '1 available' : `${n} available`,
  },
  contacts: {
    externalId: (id) => `id: ${id}`,
  },
  inbox: {
    title: 'Inbox',
    description: 'Connect your support address. Customers email it as usual; the bot answers from its knowledge base in the same thread.',
    unpaidTitle: 'The email bot needs a plan or an active trial',
  },
  extras: {
    title: 'Data tools',
    hint: 'Optional add-on. Turn it on in Settings.',
  },
}
