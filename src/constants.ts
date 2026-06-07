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

// 链接环境徽章样式映射(badge = 色调+描边;dot = 圆点实色)
export const LINK_ENVS = {
  DEV: { label: 'DEV', badge: 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300', dot: 'bg-slate-500 dark:bg-slate-400' },
  UAT: { label: 'UAT', badge: 'bg-amber-500/10 text-amber-600 ring-amber-500/25 dark:text-amber-300', dot: 'bg-amber-500' },
  RELEASE: { label: 'RELEASE', badge: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/25 dark:text-emerald-300', dot: 'bg-emerald-500' },
} as const
