# CIM 门户前端 — 玻璃拟态全量重建 设计

**日期:** 2026-06-06
**状态:** 视觉方向已确认,待用户审阅本规格 → 进入实现计划
**背景:** 旧前端文件已被删除,**从零重建**。保留 **Vue 技术栈**;视觉**全新**(玻璃拟态),**不参考任何旧前端设计/计划**。**仅 Web**(本期不做 Tauri 桌面打包)。后端未变,契约不变。

## 1. 目标与范围

重建整个 CIM 门户前端(内部 SSO 应用):**登录 + 仪表盘 + 管理控制台**,双语(中/英)、明/暗主题、按角色/部门的访问控制。视觉采用**玻璃拟态(glassmorphism)**:柔和渐变背景 + 磨砂玻璃卡片,清晰、专业。仪表盘含**实时数据可视化 Hero**、**带图标的领域高亮**、系统卡片、**安全合规条**(代替营销式「信任徽章」)。

**明确不在范围:** Tauri 桌面打包(后续独立项目);后端改动;营销落地页元素(定价表、购买式信任徽章 —— 内部 SSO 应用无购买)。

## 2. 技术栈(保留 Vue 栈)

Vue 3.5 + TypeScript(strict)+ Vite 6 + **Tailwind CSS v3**(玻璃工具类)+ Pinia(状态)+ vue-router + **vue-i18n**(中/英)+ **reka-ui**(无障碍 headless 原语:Dialog/Select/Tabs/Switch)+ lucide-vue-next(图标)。**数据可视化:手写 SVG 组件**(Gauge/AreaChart/Sparkline/KpiStat)—— 轻量、可玻璃化、无重型图表依赖。测试:Vitest + MSW(单测,无需后端)+ Playwright(E2E)。**无新增重依赖。**

## 3. 后端契约(集成边界,不改动)

22 个端点(`../cim-portal-server/docs/api/api-reference.md`):
- **门户:** `GET /api/portal/home`(按访问控制返回 categories+links)、`GET /api/portal/me`、`GET /api/enums/{category}`、`GET /api/i18n/labels`、dev `POST /dev/token`(开发登录)。
- **管理(PORTAL_ADMIN):** links CRUD + `/{id}/grants`(GET/PUT 整组替换/POST/DELETE)、enums CRUD `/{category}`、labels CRUD、`GET /api/admin/users`。
- **鉴权:** JWT 仅认证;部门/角色/admin 来自 `user_info`(经 `/api/portal/me`)。可插拔 AuthProvider:dev → `/dev/token` 选身份;uat/prod → OIDC(stub 本期)。
- **访问控制:** `/api/portal/home` 已按 per-link 白名单(部门 OR 角色,空=所有人)过滤;前端只渲染返回内容。

## 4. 视觉系统 — 玻璃拟态

**背景:** 柔和多色渐变(靛/青/紫 模糊光斑)叠加近白底:
`radial(靛 .42) + radial(青 .34) + radial(紫 .30) + linear(160deg,#eaf0fb,#eef2f8)`。暗主题:深靛/午夜底 + 同色系低亮光斑。

**玻璃配方(`.glass`):** `background:rgba(255,255,255,.55); backdrop-filter:blur(18px); border:1px solid rgba(255,255,255,.75); box-shadow:0 10px 34px -12px rgba(30,41,80,.20); border-radius:18px`。暗主题:`rgba(255,255,255,.06)` 玻璃 + `rgba(255,255,255,.12)` 边 + 深阴影。提供 `.glass-strong`(更实,用于浮层/输入)。

**令牌(CSS 变量,three-layer:primitive→semantic→component):**
- 文本四级:`--ink`(#1e293b)、`--ink-2`(#475569)、`--ink-3`(#94a3b8)、muted。
- 主色(单一强调,=动作):靛 `--accent:#4f46e5`,搭档蓝 `#2563eb`(图标砖渐变)。
- 语义/状态(=含义,非装饰):go `#16a34a`、caution `#d97706`、stop `#dc2626`。
- 半径:输入/按钮 10px、卡片 14–18px、浮层 18px。深度策略:**玻璃 + 柔影**(统一,不混用)。
- 排版:**Inter**(界面)+ 数字 `font-variant-numeric:tabular-nums`;标题 700/800、正文 400/500、标签 600。

**动画:** 快速微交互(~120–160ms,减速缓动,无回弹);hover 卡片轻抬升 + 阴影加深;`LIVE` 脉冲点;弹层**纯淡入淡出**(opacity-only,不缩放、不从角落弹出);全部 `prefers-reduced-motion` 安全。

**主题:** 明/暗双主题(`useTheme` light/dark/system);玻璃/光斑分别调校,保证可读与「玻璃感」。

## 5. 关键界面

### 5.1 登录(`/login`)
柔和渐变背景上的居中玻璃卡:dev 身份以**徽章行**列出(`employeeId` 等宽 + 姓名 + 部门·角色 + 在线点),点击 → `/dev/token` → 进入。靛色主行动按钮。uat/prod 走 OIDC(本期 stub)。停用/未配置用户 → `/account-inactive`(玻璃提示卡)。

### 5.2 仪表盘(`/`)— 核心展示
- **玻璃顶栏:** logo、导航(总览/系统/报表/管理[admin 可见])、语言/主题切换、用户 pill。
- **Hero 概览面板(玻璃):** `LIVE` 脉冲 + 问候 + **用户身份**(姓名 · 部门 · 角色 · 工号)+ **实时时钟** + **真实统计磁贴**(系统数 / 类别数 / 在线数,由 `/api/portal/home` 派生)。**不展示制造 KPI 示例数据**(用户 2026-06-06 决定;`MetricsProvider` 与 SVG 图表已移除)。
- **领域高亮(带图标):** 按类别的玻璃图标卡(制造执行/质量·SPC/设备·AMS/物流/报表),每张:渐变图标砖 + 名称 + 一行描述 + 系统数 →,点击进入该类别。
- **我的系统:** 玻璃卡网格(实际 links;图标砖 + 名称 + 状态点 + code),按 `/api/portal/home` 渲染。
- **底部支持条(`SupportBar`):** 细玻璃条:「遇到问题请拨打 **39100**」(Call 39100 if you run into problems)。
- **状态:** 加载=玻璃骨架;空=友好玻璃面板;错误=玻璃面板 + 重试;搜索=客户端按名称/code/类别过滤。

### 5.3 管理控制台(`/admin`)
同一玻璃系统。顶栏 + 侧栏/分段;**Links**(玻璃表 + 筛选 + 对话框表单含图标选择 + 部门/角色 chip 白名单 + 链接优先保存再 PUT grants);**Enums**(四类标签页 → 通用管理器 + 行内启用开关 + IN_USE→停用);**Labels**(玻璃表 + 类型筛选 + 对话框,保存后即时刷新 i18n);**Users**(只读玻璃表 + 筛选)。错误经 `fieldErrorMap`(`DUPLICATE_CODE`/`IN_USE`)入字段或 toast。

## 6. Hero 数据来源(已定稿)

**Hero 只展示真实数据:** 用户身份(`/api/portal/me`)+ 实时时钟(客户端)+ 按 `/api/portal/home` 派生的统计(系统数 / 类别数 / 在线数=`statusCode==='ACTIVE'`)。**不再展示制造 KPI(OEE/WIP/良率/产出)示例数据** —— 用户 2026-06-06 决定移除;原 `MetricsProvider` 适配器与 SVG 图表原语(Gauge/Sparkline/AreaChart/KpiStat)已删除。若未来需要真实制造指标,需后端新增 metrics 端点(独立项目)再引入。

**本规格采用「默认方案」**;请在审阅时确认或改选。

## 7. 组件与可视化原语

- **玻璃 UI 原语**(`lib/ui/`):`GlassCard`、`Button`、`Input`、`Select`(reka)、`Dialog`(reka,纯淡入淡出)、`Tabs`(reka)、`Switch`(reka)、`Badge`、`Table` 套件、`Toaster` + toast store、`Skeleton`、`StatusDot`/`StatusBadge`。
- **可视化原语**(`lib/viz/`,手写 SVG):`Gauge`(径向)、`AreaChart`、`Sparkline`、`KpiStat`(数值 + delta + sparkline)、`MiniBar`。可主题化、随玻璃。
- **领域/系统**(`features/dashboard/`):`AppHeader`、`HeroPanel`、`DomainHighlights`、`SystemCard`、`SystemGrid`、`TrustStrip`、`GlobalSearch`。
- **可插拔:** `AuthProvider`(devAuth / oidcAuth-stub)、`MetricsProvider`(sampleMetrics / future-api)。

## 8. i18n / 主题 / 鉴权 / 访问控制

- **i18n:** vue-i18n(legacy:false, global scope),标签经 `/api/i18n/labels` 注水(在路由守卫中,因需鉴权);双语字段 `pick(record,key)`。中/英切换。
- **主题:** `useTheme` light/dark/system,localStorage 持久化。
- **鉴权:** 可插拔 `AuthProvider`;dev = 身份选择 → `/dev/token`;token 存 localStorage;`/api/portal/me` 取身份;`isAdmin` 控制 `/admin`。路由守卫:requireAuth / requireAdmin + 标签注水。
- **访问控制:** 由后端 `/api/portal/home` 决定可见 links;前端忠实渲染。停用/未配置 → 403/404 → `/account-inactive`。

## 9. 测试

- **单测(Vitest + jsdom + MSW):** API 客户端 + 类型契约;玻璃原语行为;viz 原语渲染;auth/labels/theme store;各 feature 视图(MSW 驱动)。`matchMedia` polyfill(若用 reduced-motion)。
- **E2E(Playwright):** 关键流 —— dev 登录 → 仪表盘渲染 Hero/领域/系统 → 搜索过滤 → 进管理新建/编辑/删除链接(admin)。
- **门禁:** `npm run verify` = typecheck + test + build。

## 10. 实施分期(每期独立 spec/plan,均可运行可测)

- **P1 · 基础 + 登录 + 仪表盘:** 脚手架(Vue+TS+Vite+Tailwind+玻璃令牌)、API 客户端 + 类型、i18n/主题/auth、路由守卫、登录、玻璃原语、viz 原语、仪表盘(Hero + 领域高亮 + 系统网格 + 安全条 + 搜索)。**可运行的门户首屏。**
- **P2 · 管理控制台:** links+grants、enums、labels、users(玻璃表/对话框)。
- **P3 · Tauri 桌面(延后):** 用户已选「本期仅 Web」;未来独立项目。

## 11. 不在范围内(YAGNI)

Tauri / 桌面打包(本期);后端 metrics 端点(Hero 用示例适配器);营销元素(定价、购买式信任徽章);light/dark/system 之外的主题;新增重型图表/动画依赖。
