# i18n 双语(中英)补全 设计

**日期:** 2026-06-07
**状态:** 设计已确认,进入实现计划
**背景:** vue-i18n 已接线(locale 切换 + 持久化;`useLocale().pick` 切数据字段),但 `messages` 为空 `{zh:{},en:{}}`,所有 UI chrome 文本硬编码中文(~193 串、23 文件)→ EN 切换不翻译界面文本。本期建 zh/en 目录 + 全量 `t()` 改造。仅前端 `cim-portal-client`(分支 `dev`)。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 目录结构 | **两 locale 文件** `src/lib/i18n/locales/{zh,en}.ts`,嵌套命名空间;注册进既有 i18n。 |
| 品牌名 | EN 下 `CIM 门户` → **`CIM Portal`**(`brand.title`)。 |
| 数据字段 | 不动:`pick()` 继续切 `nameZh/nameEn` 等后端数据。 |
| 不翻译 | 枚举/角色码(MES/PORTAL_ADMIN)、dev 身份 `hint`、已双语数据。 |

## 2. 现状(已核对)

- `src/lib/i18n/index.ts`:`createI18n({legacy:false, locale:'zh', fallbackLocale:'zh', messages:{zh:{},en:{}}})`。
- `src/lib/i18n/useLocale.ts`:`useLocale()` 返回 `{ locale, pick }`(`pick` 按 locale 取 `${key}Zh|En`)。locale 切换由 AppHeader + `stores/locale`(持久化 `cimp.locale`)。
- ~193 串 / 23 文件:dashboard(AppHeader/GlobalSearch/HeroPanel/HomeView/SystemCard/SystemGrid)、admin(AdminLayout/LinksAdminView/EnumsAdminView/LinkFormModal/EnumFormModal)、auth(LoginView/AccountInactiveView)、lib/ui(ConfirmDialog/NumberInput/Pagination/Select/SupportBar)、`lib/composables/useClock.ts`(问候)、`lib/desktop/updater.ts`(更新提示)。
- 既有 **66 测试**(部分断言中文文本,如 `'新建链接'`/`'已删除'`/`'角色'`/`'暂无链接'`)。

## 3. 架构

- **`src/lib/i18n/locales/zh.ts` / `en.ts`**:`export default { ...嵌套命名空间 }`。
- **`src/lib/i18n/index.ts`**:`import zh from './locales/zh'; import en from './locales/en'`;`messages: { zh, en }`。其余不变。
- **`src/lib/i18n/useLocale.ts`**:`const { t, locale } = useI18n({ useScope: 'global' }); return { locale, pick, t }`。组件 `const { t } = useLocale()`(或 `{ t, pick }`)。
- **非组件**(`updater.ts`):`import { i18n } from '@/lib/i18n'` → `i18n.global.t('updater.found', { version })`。

## 4. 命名空间与键(点号 camelCase 段)

- `common`:`save/cancel/delete/edit/create/new/retry/loading/confirm/search/enabled/disabled/active/inactive` 等共用。
- `brand`:`title`(`CIM 门户`/`CIM Portal`)。
- `header`:`admin`(管理)、`logout`、`toggleTheme` 等(AppHeader)。
- `dashboard`:`greeting.{dawn,morning,afternoon,evening}`、`stats.{systems,categories,online}`、`searchPlaceholder`、`search.found`("找到 {n} 个")、`status.{active,maintenance,deprecated}`、`empty`(暂无可访问的系统)、`error`(加载失败)、`noMatch`、`maintenanceDlg.{title,message}`、`deprecatedDlg.{title,message}`(含 `{name}` 插值)、`support`(遇到问题请拨打 / Call …,含 `{phone}` 插值)。
- `admin`:`nav.{links,enums,users}`、`backToPortal`、`comingSoon`;`links.{title,new,empty,deleteTitle,deleteMessage}`;`enums.{title,new,empty,deleteTitle,deleteMessage,categories.{department,role,linkCategory,linkStatus}}`;`linkForm.{createTitle,editTitle,codeLabel,nameZhLabel,nameEnLabel,urlLabel,iconLabel,categoryLabel,statusLabel,sortLabel,openInNewTab,grants,addGrant,saved,saveFailed,required,...}`;`enumForm.{createTitle,editTitle,codeLabel,zhLabel,enLabel,sortLabel,enabledLabel,saved,saveFailed,required}`;通用 toast `deleted`/`deleteFailed`(或归 common)。
- `auth`:`login.{title,subtitle,signIn,...}`、`inactive.{title,message}`。
- `ui`:`pagination.total`("共 {n} 条")、`numberInput.{increase,decrease}`(aria)、`select.placeholder`、`confirm.{confirm,cancel}` 默认。
- `updater`:`title`(更新可用)、`found`("发现新版本 {version},是否现在更新?")。

> 键覆盖以实现期逐文件清点为准;命名空间固定如上,新键归入对应命名空间。

## 5. 改造模式(关键:zh 值逐字复制现状 → 既有测试不破)

- 每个硬编码中文字符串 → `t('ns.key')`;**zh 目录里该键的值 = 原中文逐字**。因默认 locale=`zh`,渲染结果不变 → 断言中文的既有测试照过。
- 插值:`t('ui.pagination.total', { n })`(zh `共 {n} 条` / en `{n} total`);`t('dashboard.search.found', { n })`;`t('updater.found', { version })`;`support` 用 `{phone}`(来自 `SUPPORT_PHONE` 常量)。
- 模板示例:`新建链接` → `{{ t('admin.links.new') }}`;`placeholder="搜索系统"` → `:placeholder="t('dashboard.searchPlaceholder')"`;脚本内 toast `'已删除'` → `t('common.deleted')`。
- 枚举 4 分类 tab 标签(部门/角色/链接分类/链接状态)是 UI chrome → `t('admin.enums.categories.*')`;分类**码**不变。
- `useClock` 问候 or HeroPanel `greeting`:改为按小时选键 `t('dashboard.greeting.morning')` 等。
- `pick()` 与数据字段保持不动。

## 6. 测试

- **`src/lib/i18n/i18n.spec.ts`(新)**:
  - 键**对齐**:递归收集 zh 与 en 的所有叶子键集合,断言完全相等(无缺漏 → 防漏译)。
  - 解析:`i18n.global.locale.value='en'` 时 `t('brand.title')==='CIM Portal'`;`='zh'` 时 `==='CIM 门户'`。
- **既有 66 测试**:zh 值逐字复制 → 渲染中文不变 → 全过(组件测试已传 `[i18n]` 插件,`t()` 可解析)。
- 新增本测试后总数 ~67。`npm run verify` 干净/绿/build OK。

## 7. 实现分解(一个 spec;计划任务)

1. **i18n 基础设施**:`locales/zh.ts`+`en.ts`(命名空间骨架,先放 `common`/`brand`)、`index.ts` 注册、`useLocale` 暴露 `t`、键对齐+解析测试。
2. **common + ui 原语 + header/brand**:ConfirmDialog/NumberInput/Pagination/Select/SupportBar/AppHeader。
3. **dashboard**:HeroPanel/GlobalSearch/HomeView/SystemCard/SystemGrid + 问候。
4. **admin 视图**:AdminLayout/LinksAdminView/EnumsAdminView(+分类 tab)。
5. **admin 模态 + auth + updater**:LinkFormModal/EnumFormModal/LoginView/AccountInactiveView/updater.ts。
6. **验证**:`npm run verify` + 运行冒烟(切 EN,逐页确认界面文本全部英文;切回中文复原)。

## 8. 不在范围内(YAGNI)

复数规则(用简单插值);浏览器语言自动探测(保留默认 zh + 手动切换);第三语言;翻译外置 JSON/翻译平台;后端文案。
