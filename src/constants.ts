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

// 环境感知链接的环境列表(label/样式驱动 UI)
export const LINK_ENVS = [
  { key: 'dev', field: 'urlDev', label: 'DEV', btn: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 hover:bg-slate-500/25' },
  { key: 'uat', field: 'urlUat', label: 'UAT', btn: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25' },
  { key: 'release', field: 'urlRelease', label: 'RELEASE', btn: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25' },
] as const
