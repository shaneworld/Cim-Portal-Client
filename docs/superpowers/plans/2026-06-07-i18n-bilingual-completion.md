# i18n 中英双语补全 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建 zh/en 消息目录并把所有硬编码中文 UI 文本改为 `t()`,EN 切换后界面全英文;中文保持不变(zh 值逐字复制现状)。

**Architecture:** `src/lib/i18n/locales/{zh,en}.ts` 嵌套命名空间 → 注册进 `i18n`;`useLocale()` 暴露 `t`;组件 `t('ns.key')`,数据仍 `pick()`;非组件用 `i18n.global.t`。

**Tech Stack:** Vue 3 + vue-i18n + Vitest。

**契约/现状(已核对):** spec `docs/superpowers/specs/2026-06-07-i18n-bilingual-completion-design.md`。`src/lib/i18n/index.ts` 现 `messages:{zh:{},en:{}}`;`useLocale.ts` 返回 `{locale,pick}`,`pick` 用 `i18n.global.locale.value`。23 文件硬编码中文(见 spec §2)。组件测试用 `mount(..., { global: { plugins: [i18n] } })` 并断言中文文本。**硬约束:既有 66 测试保持绿(靠 zh 值逐字复制);键对齐(zh↔en 叶子键全等);不动 `pick()`/枚举码/dev hint。** 仓库 `/home/shane/Code/cim-portal/cim-portal-client`(分支 `dev`,新建 `i18n-bilingual`)。门禁:`npm run verify`。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

**通用改造模式(每个转换任务遵循):**
1. 逐文件 Read,找硬编码中文串(模板文本、placeholder、`'xx'` 脚本字面量如 toast/校验/对话框)。
2. 每串在 `zh.ts` 对应命名空间加键,值 = **原中文逐字**;`en.ts` 同键加英文译文。
3. 组件:`const { t } = useLocale()`(需数据则 `{ t, pick }`);模板 `{{ t('ns.key') }}` / `:placeholder="t('ns.key')"`;脚本 `t('ns.key')`。插值 `t('ns.key', { n })`。
4. **不改** `pick()`、枚举/角色码、dev 身份 `hint`。
5. 跑该区域相关测试 + `npm run typecheck`;区域完成跑 `npm test`(应仍全绿,因 zh 逐字)。

---

## 文件结构

```
src/lib/i18n/locales/zh.ts        # T1 新(逐任务追加命名空间)
src/lib/i18n/locales/en.ts        # T1 新
src/lib/i18n/index.ts             # T1 改(注册 messages)
src/lib/i18n/useLocale.ts         # T1 改(暴露 t)
src/lib/i18n/i18n.spec.ts         # T1 新(键对齐 + 解析)
# 转换(逐任务):
src/lib/ui/{ConfirmDialog,NumberInput,Pagination,Select,SupportBar}.vue  # T2
src/features/dashboard/AppHeader.vue                                      # T2
src/features/dashboard/{HeroPanel,GlobalSearch,HomeView,SystemCard,SystemGrid}.vue + lib/composables/useClock.ts # T3
src/features/admin/{AdminLayout,links/LinksAdminView,enums/EnumsAdminView}.vue  # T4
src/features/admin/links/LinkFormModal.vue, enums/EnumFormModal.vue, features/auth/{LoginView,AccountInactiveView}.vue, lib/desktop/updater.ts # T5
```

---

## Task 1: i18n 基础设施(目录 + 注册 + useLocale.t + 键对齐测试)

**Files:** Create `src/lib/i18n/locales/zh.ts`, `src/lib/i18n/locales/en.ts`, `src/lib/i18n/i18n.spec.ts`; Modify `src/lib/i18n/index.ts`, `src/lib/i18n/useLocale.ts`

- [ ] **Step 1: `src/lib/i18n/locales/zh.ts`(起步含 common+brand;后续任务追加命名空间)**
```ts
export default {
  brand: { title: 'CIM 门户' },
  common: {
    save: '保存', cancel: '取消', delete: '删除', edit: '编辑', create: '新建', retry: '重试',
    loading: '加载中', search: '搜索', enabled: '启用', disabled: '停用',
    deleted: '已删除', deleteFailed: '删除失败', saved: '已保存', saveFailed: '保存失败', required: '必填',
  },
}
```

- [ ] **Step 2: `src/lib/i18n/locales/en.ts`(同结构同键,英文)**
```ts
export default {
  brand: { title: 'CIM Portal' },
  common: {
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', create: 'New', retry: 'Retry',
    loading: 'Loading', search: 'Search', enabled: 'Enabled', disabled: 'Disabled',
    deleted: 'Deleted', deleteFailed: 'Delete failed', saved: 'Saved', saveFailed: 'Save failed', required: 'Required',
  },
}
```

- [ ] **Step 3: 改 `src/lib/i18n/index.ts`**
```ts
import { createI18n } from 'vue-i18n'
import zh from './locales/zh'
import en from './locales/en'

export const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'zh',
  messages: { zh, en },
})
```

- [ ] **Step 4: 改 `src/lib/i18n/useLocale.ts`** — 暴露 `t`:
```ts
export function useLocale() {
  const { t, locale } = useI18n({ useScope: 'global' })
  return { locale, pick, t }
}
```
(`pick` 函数与导入不变。)

- [ ] **Step 5: 键对齐 + 解析测试 `src/lib/i18n/i18n.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import zh from './locales/zh'
import en from './locales/en'
import { i18n } from './index'

function leafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? leafKeys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`])
}

describe('i18n catalogs', () => {
  it('zh 与 en 叶子键完全一致(无漏译)', () => {
    expect(leafKeys(zh as Record<string, unknown>).sort()).toEqual(leafKeys(en as Record<string, unknown>).sort())
  })
  it('按 locale 解析', () => {
    i18n.global.locale.value = 'en'; expect(i18n.global.t('brand.title')).toBe('CIM Portal')
    i18n.global.locale.value = 'zh'; expect(i18n.global.t('brand.title')).toBe('CIM 门户')
  })
})
```

- [ ] **Step 6: 运行 + typecheck** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm test -- i18n && npm run typecheck` → PASS;typecheck 干净。

- [ ] **Step 7: Commit**
```bash
git add src/lib/i18n/locales src/lib/i18n/index.ts src/lib/i18n/useLocale.ts src/lib/i18n/i18n.spec.ts
git commit -m "feat(i18n): zh/en locale 目录 + 注册 + useLocale 暴露 t + 键对齐测试(common/brand)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: ui 原语 + AppHeader(common/ui/header/brand)

**Files:** Modify `src/lib/ui/{ConfirmDialog,NumberInput,Pagination,Select,SupportBar}.vue`, `src/features/dashboard/AppHeader.vue`; 追加 `zh.ts`/`en.ts` 的 `ui`/`header` 命名空间

- [ ] **Step 1: 追加命名空间** 到 `zh.ts`/`en.ts`(同键):
```ts
// zh
ui: {
  pagination: { total: '共 {n} 条' },
  numberInput: { increase: '增加', decrease: '减少' },
  select: { placeholder: '请选择' },               // 若 Select 有占位,按实际中文
  confirm: { confirm: '确认', cancel: '取消' },     // ConfirmDialog 默认按钮(若组件已有默认文案则逐字)
},
header: { admin: '管理', logout: '退出', toggleTheme: '主题', toggleLang: '中/EN' }, // 按 AppHeader 实际(aria/可见文本)
// en 对应:'{n} total' / 'Increase'/'Decrease' / 'Select…' / 'Confirm'/'Cancel' / 'Admin'/'Log out'/'Theme'/'中/EN'
```
（实现者 Read 各组件确认实际中文/aria,键值逐字。)

- [ ] **Step 2: 逐组件转换**(按通用模式):
  - `Pagination.vue`:`共 {{ total }} 条` → `{{ t('ui.pagination.total', { n: total }) }}`。
  - `NumberInput.vue`:`aria-label="增加"/"减少"` → `:aria-label="t('ui.numberInput.increase')"` 等。
  - `Select.vue`:占位中文 → `t('ui.select.placeholder')`(若有)。
  - `ConfirmDialog.vue`:默认确认/取消文案 → `t`(若 props 传入则不动,仅默认值)。
  - `SupportBar.vue`:`遇到问题请拨打 {phone}` / `Call {phone} …` → 用 `t('dashboard.support.*', { phone: SUPPORT_PHONE })`(support 键归 dashboard;此处先加 dashboard.support 占位或归 ui——择一,保持键存在两 locale)。建议 SupportBar 文案归 `dashboard.support`,本任务先加该键。
  - `AppHeader.vue`:品牌 `CIM 门户` → `{{ t('brand.title') }}`;`管理`→`t('header.admin')`;退出/主题等 aria/文本 → `header.*`。

- [ ] **Step 3: 运行** — `npm test 2>&1 | grep -E 'Tests |FAIL' | tail -2 && npm run typecheck`。**全绿**(zh 逐字;AppHeader/SupportBar 测试断言中文不变)。

- [ ] **Step 4: Commit**
```bash
git add src/lib/ui src/features/dashboard/AppHeader.vue src/lib/i18n/locales
git commit -m "i18n(ui): ui 原语 + AppHeader 文案接入 t()(ui/header/brand 命名空间)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: dashboard(dashboard 命名空间)

**Files:** Modify `src/features/dashboard/{HeroPanel,GlobalSearch,HomeView,SystemCard,SystemGrid}.vue`, `src/lib/composables/useClock.ts`(如问候在此);追加 `dashboard` 命名空间

- [ ] **Step 1: 追加 `dashboard` 命名空间**(zh 逐字 / en):
```ts
// zh(键举例,实现者按各文件补全)
dashboard: {
  greeting: { dawn: '凌晨好', morning: '早上好', afternoon: '下午好', evening: '晚上好' },
  stats: { systems: '系统', categories: '类别', online: '在线' },
  searchPlaceholder: '搜索系统',
  search: { found: '找到 {n} 个' },
  status: { active: '运行中', maintenance: '维护中', deprecated: '已停用' },
  empty: '暂无可访问的系统',
  error: '加载失败',
  maintenanceDlg: { title: '系统维护中', message: '「{name}」正在维护,可能暂时无法正常使用。仍要打开吗?' },
  deprecatedDlg: { title: '系统已停用', message: '「{name}」已停用(旧版),建议改用替代系统。仍要打开吗?' },
  support: { line: '遇到问题请拨打', call: 'Call {phone} if you run into problems' }, // 按 SupportBar 实际拆分
},
// en:'Good evening' 等;status:'Running'/'Maintenance'/'Deprecated';searchPlaceholder:'Search systems';found:'{n} found';...
```

- [ ] **Step 2: 转换各组件**:
  - `HeroPanel.vue`:`greeting` computed 改为按小时选键 `t('dashboard.greeting.morning')` 等;`stats` 的 `label: '系统'/'类别'/'在线'` → `t('dashboard.stats.*')`。
  - `GlobalSearch.vue`:`placeholder="搜索系统"` → `:placeholder="t('dashboard.searchPlaceholder')"`;`找到 {{ resultCount }} 个` → `t('dashboard.search.found', { n: resultCount ?? 0 })`;搜索按钮文案 → `common.search`。
  - `HomeView.vue`:空态 `暂无可访问的系统`、错误态文案、无匹配 → `dashboard.*`。
  - `SystemCard.vue`:`statusText` 三态 → `t('dashboard.status.*')`(状态码比较已用 `LINK_STATUS`,保留)。
  - `SystemGrid.vue`:维护/停用对话框 `title`/`message` → `t('dashboard.maintenanceDlg.*'/'deprecatedDlg.*', { name })`。
  - `SupportBar.vue`(若 T2 未完成 support):`{{ t('dashboard.support.line') }} {{ SUPPORT_PHONE }}` + `{{ t('dashboard.support.call', { phone: SUPPORT_PHONE }) }}`。

- [ ] **Step 3: 运行 + typecheck** — `npm test && npm run typecheck` → 全绿(HeroPanel/SystemGrid 等中文断言不变)。

- [ ] **Step 4: Commit**
```bash
git add src/features/dashboard src/lib/composables/useClock.ts src/lib/ui/SupportBar.vue src/lib/i18n/locales
git commit -m "i18n(dashboard): 首页/Hero/搜索/系统卡/状态/告警对话框/页脚接入 t()

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: admin 视图(admin 命名空间)

**Files:** Modify `src/features/admin/AdminLayout.vue`, `src/features/admin/links/LinksAdminView.vue`, `src/features/admin/enums/EnumsAdminView.vue`;追加 `admin`(nav/links/enums)命名空间

- [ ] **Step 1: 追加 `admin` 视图键**(zh 逐字 / en),例:
```ts
admin: {
  backToPortal: '返回门户', comingSoon: '即将上线',
  nav: { links: '链接', enums: '枚举', users: '用户' },
  links: { title: '链接管理', new: '新建链接', empty: '暂无链接', deleteTitle: '删除链接', deleteMessage: '确认删除「{name}」?' },
  enums: {
    title: '枚举管理', new: '新建', empty: '该分类暂无枚举值',
    deleteTitle: '删除枚举值', deleteMessage: '确认删除「{code}」?删除可能影响仍在使用该 code 的链接/授权。',
    categories: { department: '部门', role: '角色', linkCategory: '链接分类', linkStatus: '链接状态' },
  },
},
// en:'Links'/'Enums'/'Users';'Link management'/'New link'/'No links'/'Delete link'/'Delete “{name}”?';...
```

- [ ] **Step 2: 转换**:
  - `AdminLayout.vue`:`返回门户` → `t('admin.backToPortal')`;`nav` 数组 `label` 中文 → `t('admin.nav.*')`(数组项改为 key 或在模板 `t(...)`);`即将上线` → `t('admin.comingSoon')`。
  - `LinksAdminView.vue`:`AdminPanel title="链接管理"` → `:title="t('admin.links.title')"`;`新建链接` → `t('admin.links.new')`;空态/重试/删除确认 title+message(插值 `{name}`)→ `t('admin.links.*')`/`common.retry`;toast `已删除`/`删除失败` → `common.deleted`/`common.deleteFailed`。
  - `EnumsAdminView.vue`:`枚举管理`/`新建`/空态/删除 caution(插值 `{code}`)→ `t('admin.enums.*')`;`CATEGORIES` 的 `label`(部门/角色/链接分类/链接状态)→ `t('admin.enums.categories.*')`(`code` 不变)。

- [ ] **Step 3: 运行 + typecheck** — `npm test && npm run typecheck` → 全绿(LinksAdminView/EnumsAdminView 中文断言:`链接管理`/`角色`/`暂无链接` 等不变)。

- [ ] **Step 4: Commit**
```bash
git add src/features/admin/AdminLayout.vue src/features/admin/links/LinksAdminView.vue src/features/admin/enums/EnumsAdminView.vue src/lib/i18n/locales
git commit -m "i18n(admin): 管理布局/链接视图/枚举视图(含分类 tab)接入 t()

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: admin 模态 + auth + updater

**Files:** Modify `src/features/admin/links/LinkFormModal.vue`, `src/features/admin/enums/EnumFormModal.vue`, `src/features/auth/{LoginView,AccountInactiveView}.vue`, `src/lib/desktop/updater.ts`;追加 `admin.linkForm`/`admin.enumForm`/`auth`/`updater` 键

- [ ] **Step 1: 追加键**(zh 逐字 / en),覆盖:LinkFormModal 全部字段标签(代码/中文名/英文名/URL/图标/分类/状态/排序/新标签页打开/访问授权/添加授权)+ 标题(新建链接/编辑链接)+ 校验(必填)+ toast;EnumFormModal(代码/中文名/英文名/排序/启用 + 新建/编辑枚举值 + 校验/toast);LoginView(标题/副标题/登录按钮等);AccountInactiveView(标题/说明);updater(`title: '更新可用'`、`found: '发现新版本 {version},是否现在更新?'`)。

- [ ] **Step 2: 转换**:
  - `LinkFormModal.vue` / `EnumFormModal.vue`:模板字段标签、`<Modal :title>`、按钮、`fieldErrors` 的 `'必填'` → `t('common.required')`、toast `已更新`/`已创建`/`保存失败` → `t('admin.*Form.*'|'common.*')`。`grantTypeOpts` 的 `label`(部门/角色)→ `t('admin.enums.categories.*')` 或 `linkForm.grantType.*`(择一,键存在)。
  - `LoginView.vue`/`AccountInactiveView.vue`:标题/说明/按钮 → `t('auth.*')`。dev 身份名用 `pick`(已双语数据),`hint` 不译。
  - `updater.ts`:`import { i18n } from '@/lib/i18n'`;`ask(\`发现新版本 ${update.version}...\`, { title: '更新可用', ... })` → `ask(i18n.global.t('updater.found', { version: update.version }), { title: i18n.global.t('updater.title'), kind: 'info' })`。

- [ ] **Step 3: 运行 + typecheck + 全量** — `npm test && npm run typecheck && npm run build` → 全绿(LinkFormModal/EnumFormModal 测试断言如 `保存`/字段不变)、build OK。

- [ ] **Step 4: Commit**
```bash
git add src/features/admin/links/LinkFormModal.vue src/features/admin/enums/EnumFormModal.vue src/features/auth src/lib/desktop/updater.ts src/lib/i18n/locales
git commit -m "i18n(admin/auth/updater): 链接/枚举表单 + 登录/停用页 + 更新提示接入 t()

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 验证 + 运行冒烟

- [ ] **Step 1: 全量门禁** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → typecheck 干净;**全测试绿**(既有 66 + i18n 测试);键对齐测试通过(zh↔en 无缺);build OK。
- [ ] **Step 2: 残留中文扫描** — `grep -rn '[一-龥]' src --include='*.vue' | grep -v 'locales/' | grep -vE 'pick\(|//|注释'` → 复核仅剩:locale 文件、注释、`pick` 数据;模板/字面量无遗漏硬编码中文(有则补 t())。
- [ ] **Step 3: 运行冒烟** — `npm run dev`;登录 → 点 EN:逐页(首页/Hero/搜索/系统卡/页脚、/admin/links、/admin/enums + 分类 tab、链接&枚举编辑模态、登录页)确认**界面文本全英文**;切回中文确认复原。截图 dashboard EN + admin EN 各一。停止 `fuser -k 5173/tcp`。
- [ ] **Step 4: 汇报** — 双语完成;EN 切换全界面翻译;`pick` 数据 + 码不变。

---

## 自检清单(Self-Review)

**规格覆盖(spec §3–§7):** 目录+注册+useLocale.t+键对齐测试 → T1;ui+header/brand → T2;dashboard → T3;admin 视图 → T4;admin 模态+auth+updater → T5;验证+残留扫描+冒烟 → T6。`pick`/码/hint 不动 → 贯穿。

**占位符扫描:** 无 TBD;基础设施代码 + 键对齐测试完整;转换任务给「文件清单 + 命名空间 + 代表性键值 + 通用模式」,实现者据此逐文件清点(~193 串无法逐条列于计划,故以模式 + 例 + 文件清单驱动)。

**类型/命名一致性:** 命名空间固定(common/brand/header/dashboard/admin/auth/ui/updater);键点号 camelCase;`useLocale()` 返回 `{locale,pick,t}` 与各组件 `const { t } = useLocale()` 一致;插值参数名(`n`/`name`/`code`/`version`/`phone`)在 zh/en 同名。**硬约束**(zh 逐字→66 测试绿、键对齐、build)在每任务 Step3 + T6 复验。
