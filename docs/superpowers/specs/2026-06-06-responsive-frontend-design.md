# 全前端响应式(自适应所有窗口尺寸)设计

**日期:** 2026-06-06
**状态:** 设计已确认,待用户审阅 → 实现计划
**背景:** 让整个玻璃前端在所有窗口宽度下自适应、无横向溢出。审计发现的破绽:① 登录页在 360px 横向溢出(bodyScrollW 388 > 360);② AppHeader 在窄屏品牌名换行、姓名+按钮拥挤。其余组件已基本随断点重排。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 移动端字母索引栏 | **`<md` 保持隐藏**(手机用搜索框过滤;竖向 A–Z 栏不适合窄屏)。不新增移动端栏。 |
| 超宽屏 | **内容保持 `max-w-7xl`(1280px)居中**,两侧留白增大。不放宽、不全宽。 |
| 最小支持宽度 | **~360px**(主流小手机);该宽度下任何元素都不得超出视口。 |

## 2. 按组件的修改

- **LoginView (`features/auth/LoginView.vue`)** — 修 360px 溢出:外层 `grid min-h-screen place-items-center p-4 sm:p-6`;卡片 `w-full max-w-md`(原仅 `max-w-md` 导致按内容撑宽);身份行长文本(如 `PROCESS_ENGINEER`)允许换行或截断(`min-w-0` + 文本 `break-words`/`truncate`),不撑破卡片。
- **AccountInactiveView (`features/auth/AccountInactiveView.vue`)** — 卡片 `w-full max-w-md`;容器 `p-4 sm:p-6`。
- **AppHeader (`features/dashboard/AppHeader.vue`)** — 品牌区 `shrink-0` + 文字 `whitespace-nowrap`,避免「CIM 门户」换行;`name · employeeId` 文本 `hidden sm:inline`(手机隐藏,腾出空间);右侧 nav `flex items-center gap-1.5` 允许收缩(`min-w-0`),管理 pill + 语言/主题/退出在 360px 仍可见且不溢出;整卡 `p-3 sm:p-4` 保持。
- **HeroPanel** — 已有 `grid-cols-1 sm:grid-cols-[1.1fr_1fr]`(窄屏堆叠);统计磁贴 `grid-cols-3` 在 360px 不挤(确认数字 `text-3xl` 不溢出,必要时无需改)。仅验证,无结构改动。
- **GlobalSearch** — `flex items-center gap-2`,输入 `w-full max-w-md` + 搜索按钮 `shrink-0`;360px 下输入框可收缩、按钮完整。仅验证。
- **SystemGrid / SystemCard** — 已有 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;卡片内 `min-w-0` + 名称 `truncate` 防长名溢出(确认现有)。标题分隔线 `md:mr-12` 索引栏留空保留。仅验证。
- **LetterRail** — 不变:`hidden md:flex`,`right-[max(1.5rem,calc((100vw-80rem)/2))]` 顶居中右对齐;确认其 fixed 定位在任何宽度都不引入横向滚动(calc 在窄屏取 1.5rem,栏隐藏故无影响)。
- **SupportBar** — 不变:固定透明底栏、`pb-5 pt-3`、`flex-wrap` 居中;`HomeView` 内容 `pb-24` 底部留白在各尺寸保证滚动到底时不被遮挡(中途滚动的半透明重叠为既定取舍)。

## 3. 全局约束

- 任何宽度(360→ultrawide)`document.body.scrollWidth <= window.innerWidth`(无横向溢出)。
- 页面外层 padding `p-4 sm:p-6`;内容 `mx-auto max-w-7xl` 不变。
- 不改动 LetterRail 与内容的右边缘对齐关系(用户既定)。

## 4. 测试 / 验证

- **既有 37 单测保持绿**(响应式为 CSS class 调整,不改逻辑)。
- **多宽度溢出校验(Playwright)**:在 360 / 414 / 768 / 1024 / 1280 / 1920 登录后断言 `bodyScrollW <= winW`(无横向滚动),并各截图人工确认布局可读、无遮挡/重叠破绽。登录页同样在 360 校验无溢出。
- 重点回归点:登录 360 无溢出;AppHeader 360 品牌不换行、控件不溢出;首页各断点网格列数正确(1/2/3/4)。

## 5. 不在范围内(YAGNI)

移动端专属索引栏(保持隐藏);放宽/全宽超宽布局(保持 1280 cap);重做底栏固定/透明(用户既定);新增断点体系或 CSS 框架;后端改动。
