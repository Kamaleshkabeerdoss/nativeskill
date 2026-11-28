import { Dict } from './types'
import { en } from './en'

export const ja: Dict = {
  brand: {
    productName: 'Acme',
  },
  common: {
    back: '戻る',
    clear: 'クリア',
    delete: '削除',
    remove: '削除',
    errorGeneric: '問題が発生しました。',
    saving: '保存中…',
    cancel: 'キャンセル',
  },
  nav: {
    leads: 'リード',
    leaveWorkspaceBody: (workspace) => `${workspace} を退出しますか? アクセス権はすぐに失われます。所有者または管理者が後で再度招待できます。`,
  },
  login: {
    signupCta: '新規登録',
  },
  bot: {
    modeOffDesc: 'リードのスコアリングやキャプチャなし。',
  },
  api: {
    scopeLeadsRead: 'リードの読み取り',
    confirmRevokeToken: (name) => `「${name}」を取り消しますか? 使用中のコードはすぐに動かなくなります。`,
    scopesCount: (n) => `${n} スコープ`,
  },
  billing: {
    renewsOn: '更新日',
    cancelsAtPeriodEnd: '期間終了時に解約',
  },
  integrations: {
    confirmDisconnect: (provider, nounPlural) => `${provider} を切断しますか? 既にインポートした ${nounPlural} はナレッジベースに残ります。`,
    importIntoKb: (n) => n ? `${n} 件をナレッジベースにインポート` : 'ナレッジベースにインポート',
    noItemsFound: (nounPlural, provider) => `${nounPlural} が見つかりません。${provider} で Acme 接続に共有してから再読み込みしてください。`,
    toastNoTextFound: (noun) => `選択した ${noun} にテキストコンテンツがありません。空でない書面コンテンツのあるものを選んでください。`,
  },
  conversations: {
    messagesAgo: (count, ago) => `${count} メッセージ · ${ago}`,
  },
  kbNew: {
    uploadFiles: (count) => `${count} 件のファイルをアップロード`,
    pagesLeftInQuota: (n) => `クォータ残り ${n} ページ`,
  },
  widget: {
    tooltip: 'ツールチップ(ランチャーホバー)',
    hideLauncherTooltip: 'ランチャーツールチップを非表示',
    tooltipPlaceholder: 'チャットしましょう!',
  },
  bots: {
    toastCreated: (name) => `「${name}」を作成しました`,
    deleteDialogBody: '「{name}」を削除しますか? ナレッジベースと会話が削除されます。この操作は元に戻せません。',
    slotsAvailable: (n) => `${n} 空き`,
  },
  contacts: {
    externalId: (id) => `id: ${id}`,
  },
  inbox: {
    title: '受信トレイ',
    description: 'サポート用アドレスを接続します。顧客はこれまでどおりそのアドレスにメールを送り、ボットがナレッジベースをもとに同じスレッドで返信します。',
    unpaidTitle: 'メールボットにはプランまたは有効なトライアルが必要です',
  },
}
