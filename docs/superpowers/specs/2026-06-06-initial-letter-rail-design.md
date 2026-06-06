# 首页首字母索引栏(A–Z)设计

**日期:** 2026-06-06
**状态:** 设计已确认,待用户审阅 → 实现计划
**背景:** 在玻璃仪表盘首页(`HomeView`)右侧加一条固定的 A–Z 首字母索引栏,点选字母按首字母**过滤**系统网格。系统双语(`nameZh`/`nameEn`),按类别分组。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 首字母来源 | **按语言:** zh = 中文名拼音首字母(`在`→Z、`设`→S、`帮`→B;拉丁字符如「SPC」直接透传),en = 英文名首字母。非 A–Z(数字/符号)归入 `#` 桶。 |
| 交互 | **过滤网格**(非滚动跳转):点字母 → 网格仅显示首字母匹配的系统(跨类别;空类别隐藏,与搜索一致);再点该字母 / 顶部清除键 → 复位。无系统的字母置灰禁用。 |
| 依赖 | 新增 **`pinyin-pro`**(轻量、可 tree-shake)算中文拼音首字母。 |

## 2. 组件与数据

- **`src/lib/i18n/initial.ts`** —
  - `initialFor(name: string, locale: 'zh' | 'en'): string`:返回大写 `A`–`Z` 或 `#`。
    - en:取 `name` 首字符大写。
    - zh:取首字符的拼音首字母(`pinyin(firstChar, { pattern: 'first', toneType: 'none', type: 'array' })[0]`;拉丁字符透传);大写。
    - 结果非 `[A-Z]` → `#`。空串 → `#`。
  - `availableInitials(names: string[], locale): Set<string>`:对一组名称求出现的首字母集合(供索引栏置灰判断)。
- **`src/lib/ui/LetterRail.vue`** — 固定在页面右侧的竖向 A–Z(+`#`)栏。
  - Props:`available: Set<string>`、`active: string | null`。Emits:`select: [string]`(点字母;点 active 字母时父级负责复位)。
  - 字母不在 `available` → 置灰 + `disabled`(不可点);`active` 字母高亮(主色);顶部一个清除控件(`·`/✕)在有 active 时显示,点击 emit `''` 复位。
  - 定位:`fixed right-2 top-1/2 -translate-y-1/2`,**仅桌面**(`hidden md:flex`),避免移动端遮挡(移动端用搜索)。`pointer-events` 正常(可点)。
- **`HomeView` 集成** — 新增 `letter` ref(`string`,空=未选)。
  - `searchFiltered`:现有搜索过滤结果(按 query)。
  - `available` = `availableInitials(searchFiltered 的所有链接名(按 locale pick), locale)`。
  - `filtered`(最终用于网格)= 在 `searchFiltered` 基础上,若 `letter` 非空,仅保留 `initialFor(pick(link,'name'), locale) === letter` 的链接;空类别移除。
  - `letter` 非空时**隐藏 DomainHighlights**(与搜索一致:`v-if="!query && !letter"`);`所有系统` 网格始终显示 `filtered`。
  - `LetterRail` 接 `:available` / `:active="letter"`,`@select="letter = (letter === $event ? '' : $event)"`(toggle);清除 emit `''`。
  - 无匹配(搜索+字母后为空)→ 复用既有「无匹配系统」状态。
  - locale 切换时 `initialFor` 结果随之变化(computed 自动重算)。

## 3. 行为细节

- 字母过滤与搜索框 **AND 组合**(两者同时生效)。
- `available` 基于**搜索后**的集合 → 搜索收窄时索引栏相应置灰。
- `#` 桶置于 A–Z 之后;仅当存在非字母首字母系统时才会出现在 available。
- 选中字母后类别分组保留(在各类别内过滤),空类别隐藏。

## 4. 测试

- **`initial.spec.ts`**:`initialFor('在制品管理','zh')==='Z'`、`('设备综合效率','zh')==='S'`、`('帮助文档','zh')==='B'`、`('SPC 分析','zh')==='S'`、`('WIP','en')==='W'`、`('123','zh')==='#'`;`availableInitials` 去重正确。
- **`LetterRail.spec.ts`**:渲染含 A–Z;不在 available 的字母带 disabled;点可用字母 emit `select` 带该字母;active 字母有高亮类。
- **`HomeView`**(扩展现有 spec):选某字母后网格仅剩匹配系统、其他隐藏;清除后恢复;字母与搜索组合。
- 既有 29 测试保持绿。`pinyin-pro` 在 jsdom 正常(纯 JS)。

## 5. 不在范围内(YAGNI)

滚动跳转式索引(已选过滤);移动端索引栏(桌面专属,移动端用搜索);后端改动;字母分组重排布局(保留类别分组)。
