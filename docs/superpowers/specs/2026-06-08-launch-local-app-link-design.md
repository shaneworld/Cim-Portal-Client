# 链接「启动本地应用」类型 设计

**日期:** 2026-06-08
**状态:** 设计已确认(用户 "looks right"),进入实现计划
**背景:** 门户为纯浏览器 Web 应用(Tauri 已移除)。需求:某些入口点击后自动**启动本地已安装的 .exe**;若本地未安装该应用,则自动**跳转下载地址**。

## 1. 机制与前置条件

浏览器**不能**按文件路径运行 .exe(安全沙箱)。可行方式是**自定义 URL 协议(URI scheme)**:本地应用在 Windows 注册一个 scheme(如 `mesclient://`),页面打开该 scheme 时,浏览器/系统弹出原生「**是否打开 xxx?**」对话框并启动已注册的应用。

- 已注册 → 点击 → 系统弹「是否打开 xxx?」→ 启动应用。
- 未注册(未安装)→ 无弹窗 → 视为「未找到」→ 跳转**下载地址**。

> **门户外前置(上线时):** 每个目标应用必须在客户机注册其 scheme(由应用安装包或一次性注册表项完成)。门户只**存储并使用** scheme,无法凭空创建。应用若无 scheme,点击将始终落到下载。**无参数**——仅启动应用,不传订单/记录等参数。

## 2. 数据模型(后端)

复用现有 `url` 作为点击目标,新增两列(最小改动、迁移友好):

| 字段 | 类型 | 说明 |
|---|---|---|
| `launch_app` | boolean(MariaDB `BOOLEAN`/Oracle `NUMBER(1)`),NOT NULL,默认 false | 为 true 时该条目是「启动本地应用」链接,`url` 存 **scheme**(`mesclient://`);为 false 时 `url` 为普通 Web URL(现状不变) |
| `download_url` | 可空 varchar(1024) | 未安装时的下载地址;`launch_app=true` 时必填 |

- `Link` 实体:加 `launchApp`(boolean,默认 false)+ `downloadUrl`(可空 String)+ 访问器。`url` 维持 NOT NULL(scheme 是合法 url 值)。
- `LinkRequest`(record):加 `boolean launchApp`(用 `Boolean` 可空 + 默认 false 取值)+ `String downloadUrl`;`@AssertTrue` 校验:**`launchApp` 为 true 时 `downloadUrl` 必填非空**;`url` 仍 `@NotBlank`。
- `LinkResponse` / `HomeLink`:加 `launchApp` + `downloadUrl`;`of(...)`/映射同步。
- 创建/更新映射:`link.setLaunchApp(...)` + `link.setDownloadUrl(...)`。
- **Flyway V5**(双库)`V5__link_launch_app.sql`:
  - mariadb:`ALTER TABLE link ADD COLUMN launch_app BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN download_url VARCHAR(1024) NULL;`
  - oracle:`ALTER TABLE link ADD (launch_app NUMBER(1) DEFAULT 0 NOT NULL, download_url VARCHAR2(1024));`
- `OracleMigrationTest`:`migrationsExecuted` 4 → **5**。
- 每个环境已是独立链接行,故 per-env 启动目标天然支持,无需额外字段。

## 3. 点击行为(前端 `SystemCard`)

「启动本地应用」链接点击时(非 ACTIVE 仍先走既有维护/停用确认):
1. 绑定 `blur` / `visibilitychange`(document.hidden)/ `pagehide` 监听 → 任一触发表示应用已接管 → **取消**回退。
2. 通过隐藏 iframe(或 `window.location.href`)打开 scheme → 浏览器弹「是否打开 xxx?」。
3. 若 **~2000ms** 内无上述事件 → 在**新标签页**打开下载地址 `window.open(downloadUrl, '_blank', 'noopener')`。

逻辑抽到可测试组合式函数 **`useAppLaunch()`**(`src/lib/composables/useAppLaunch.ts`),导出 `launchOrDownload(scheme, downloadUrl)`。

> **已知细节(回退的回退):** 点击 ~2s 后开新标签页已脱离用户手势,**可能被弹窗拦截**。缓解:`window.open` 返回 null(被拦截)时,改用 toast(`useToastStore`)显示可点击的「下载 / Download」链接,不强行跳转当前页。

## 4. 管理表单(`LinkFormModal`)

新增 **「启动本地应用 / Launch local app」** 开关(`launchApp`):
- 开:URL 字段标签改为 **「应用协议 URL / App protocol URL」**(占位 `mesclient://`),并出现必填 **「下载地址 / Download URL」** 字段(`downloadUrl`)。
- 关:现状普通 URL 字段,无 downloadUrl。
- `populate()`:回填 `launchApp` / `downloadUrl`;`save()`:提交两字段;前端校验:`launchApp` 时 `downloadUrl` 必填。
- i18n(zh/en 对齐)新增:`admin.linkForm.launchAppLabel`、`admin.linkForm.protocolUrlLabel`、`admin.linkForm.downloadUrlLabel`、`admin.linkForm.launchAppHint`(简述需客户机注册 scheme)。

## 5. 卡片标识(`SystemCard`)

「启动本地应用」链接显示一个小 **「APP」** 徽章(沿用 env 徽章风格,中性色),提示该入口会唤起本地应用、避免对系统弹窗感到意外。

## 6. 测试

- **后端**:`LinkRequest` 校验(`launchApp=true` 缺 `downloadUrl` → 400;web 链接不受影响);创建带 `launchApp/downloadUrl` → 201 且响应回显;`HomeIntegrationTest` 含新字段;V5 在测试容器应用;`OracleMigrationTest` 数=5;`DevDataSeeder` 加 1 条 launch 示范链接(scheme + downloadUrl),并更新 `DevDataSeederTest` 计数。
- **前端(Vitest,假定时器)**:`useAppLaunch` —— 触发 scheme 导航 + 排期回退;`visibilitychange`/`blur` 取消回退;`window.open` 被拦截(返回 null)→ 出 toast。`SystemCard` —— launch 链接点击调用 `launchOrDownload`、渲染 APP 徽章。`LinkFormModal` —— 开关切换显隐 downloadUrl、保存 payload 含 `launchApp/downloadUrl`、launch 时 downloadUrl 必填校验。i18n 键对齐。

## 7. 范围(YAGNI)

无启动参数;无 per-env 启动字段(由独立链接行覆盖);除时序启发外不做「是否已安装」的硬检测;客户机注册 scheme 属门户外运维任务。

## 8. 实现分解(一个 spec/plan)

1. **后端**:`Link` + `LinkRequest`(校验)+ `LinkResponse`/`HomeLink` + 映射 + V5 双库 + OracleMigrationTest + 种子 + 测试。
2. **前端**:types(`launchApp`/`downloadUrl`)+ `useAppLaunch` 组合式 + `SystemCard`(点击 + APP 徽章)+ `LinkFormModal`(开关 + downloadUrl 字段)+ i18n + 测试。
3. **验证**:双端门禁 + V5 实跑(dev 库 + Oracle 容器)+ 运行冒烟(普通 Web 链接照常;launch 链接点击触发 scheme 导航、未注册时新标签开下载;管理表单开关)。
