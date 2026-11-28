import { Dict } from './types'
import { en } from './en'

export const vi: Dict = {
  brand: {
    productName: 'Acme',
  },
  common: {
    back: 'Quay lại',
    clear: 'Xóa',
    delete: 'Xóa',
    remove: 'Gỡ',
    errorGeneric: 'Đã xảy ra lỗi.',
    saving: 'Đang lưu…',
    cancel: 'Hủy',
  },
  nav: {
    leads: 'Khách hàng tiềm năng',
    leaveWorkspaceBody: (workspace) => `Rời khỏi ${workspace}? Bạn sẽ mất quyền truy cập ngay lập tức. Chủ sở hữu hoặc quản trị viên có thể mời bạn quay lại sau.`,
  },
  login: {
    signupCta: 'Đăng ký',
  },
  bot: {
    modeOffDesc: 'Không có điểm dẫn đầu hoặc nắm bắt.',
  },
  api: {
    scopeLeadsRead: 'Đọc khách hàng tiềm năng',
    confirmRevokeToken: (name) => `Thu hồi " ${name} "? Mã sử ​​dụng nó sẽ ngừng hoạt động ngay lập tức.`,
    scopesCount: (n) => `Ống kính ${n}`,
  },
  billing: {
    renewsOn: 'Gia hạn vào',
    cancelsAtPeriodEnd: 'Hủy bỏ vào cuối kỳ',
  },
  integrations: {
    confirmDisconnect: (clientName) => `Ngắt kết nối ${clientName}? Nó mất quyền truy cập ngay lập tức.`,
    importIntoKb: (n) => n ? `Import ${n} into knowledge base` : 'Nhập vào cơ sở tri thức',
    noItemsFound: (nounPlural, provider) => `Không tìm thấy ${nounPlural}. Trong ${provider}, hãy chia sẻ ${nounPlural} bạn muốn bằng kết nối Acme, sau đó tải lại.`,
    toastNoTextFound: (noun) => `Không tìm thấy nội dung văn bản trong (các) ${noun} đã chọn. Chọn ${noun} có nội dung bằng văn bản, không phải nội dung trống.`,
  },
  conversations: {
    messagesAgo: (count, ago) => `Tin nhắn ${count} · ${ago}`,
  },
  kbNew: {
    uploadFiles: (count) => `Tải lên tệp ${count}`,
    pagesLeftInQuota: (n) => `Các trang ${n} còn lại trong hạn ngạch`,
  },
  widget: {
    tooltip: 'Chú giải công cụ (di chuột của trình khởi chạy)',
    hideLauncherTooltip: 'Ẩn chú giải công cụ của trình khởi chạy',
    tooltipPlaceholder: 'Trò chuyện với chúng tôi!',
  },
  bots: {
    toastCreated: (name) => `Đã tạo " ${name} "`,
    deleteDialogBody: 'Xóa "{name}"? Cơ sở kiến ​​thức và lịch sử hội thoại của nó sẽ bị xóa. Điều này không thể hoàn tác được.',
    slotsAvailable: (n) => `còn ${n}`,
  },
  contacts: {
    externalId: (id) => `mã số: ${id}`,
  },
  inbox: en.inbox,
}
