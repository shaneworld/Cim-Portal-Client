/** 集中跨切面常量(非展示文本——文本由 i18n 负责)。 */

export const STORAGE_KEYS = {
  token: 'cimp.token',
  locale: 'cimp.locale',
  theme: 'cimp.theme',
} as const

export const SUPPORT_PHONE = '39100'

// 分页 / 列表布局
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_ROW_HEIGHT_PX = 64 // 对应行的 Tailwind 类 `h-16`(改其一须同步另一)
export const MIN_PAGE_ROWS = 5

// 链接状态码(状态驱动 UI 逻辑用;展示文本由 i18n)
export const LINK_STATUS = { ACTIVE: 'ACTIVE', MAINTENANCE: 'MAINTENANCE', DEPRECATED: 'DEPRECATED' } as const

// 授权类型码
export const GRANT_TYPES = { DEPARTMENT: 'DEPARTMENT', ROLE: 'ROLE' } as const
