# 链接「启动本地应用」类型 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** 新增「启动本地应用」链接类型:点击经自定义 URL scheme 唤起本地 .exe;未安装则在新标签页打开下载地址。

**Architecture:** 复用 `Link.url` 作点击目标 + 新增 `launchApp`(bool)/`downloadUrl`(可空);前端组合式 `useAppLaunch` 用 scheme 导航 + blur/visibility 取消 + 2s 超时回退(新标签下载,弹窗被拦截则 toast)。

**Tech Stack:** Spring Boot/JPA/Flyway/Testcontainers;Vue3/Vite/Vitest。

**契约/现状(已核对本会话):** spec `docs/superpowers/specs/2026-06-08-launch-local-app-link-design.md`。后端 `Link`(url NOT NULL、environment 枚举、无 code,Flyway 当前 **V4**,`OracleMigrationTest` 断言数=4);`LinkRequest` 为 record(`@NotBlank url` + 可空 `environment`);`LinkResponse`/`HomeLink` 含 `environment`;`DevDataSeeder` 7 链接/`DevDataSeederTest` 计数 links=7/grants=4/enums=12。前端 `HomeLink`/`AdminLink`/`LinkInput` 含 `url:string`+`environment?`;`SystemCard` `<a :href="link.url" @click="onClick">`(onClick 非 ACTIVE→preventDefault+emit blocked)、env 徽章;`LinkFormModal` 有 `Switch`(openInNewTab)、`useToastStore`、url 字段、environment Select;`constants.ts` `LINK_ENVS`。**硬约束:双端测试绿;`launchApp=true` 必须有 `downloadUrl`;web 链接行为不变;grants 不变。** 前端仓库分支 `dev`(新建 `launch-app`);后端 `backend/` 分支 `dev` 直接提交。门禁:前端 `npm run verify`、后端 `cd backend && mvn -q test`。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## Task 1: 后端 — launchApp/downloadUrl + V5

**Files:** `backend/.../link/Link.java`, `link/dto/LinkRequest.java`, `link/dto/LinkResponse.java`, `portal/`(HomeLink), 映射(LinkService/Controller), `seed/DevDataSeeder.java`, `db/migration/{mariadb,oracle}/V5__link_launch_app.sql`(新), `test/.../migration/OracleMigrationTest.java`, `test/.../seed/DevDataSeederTest.java`, 相关测试/工厂

- [ ] **Step 1: Read** `Link.java`、`LinkRequest.java`、`LinkResponse.java`、HomeLink + 映射、`DevDataSeeder.java`/`DevDataSeederTest.java`、`LinkAdminControllerTest.java`、`HomeIntegrationTest.java`、`LinkTestFactory.java`、`OracleMigrationTest.java`(确认当前签名/计数)。

- [ ] **Step 2: `Link.java`** — 加:
  ```java
  @Column(name = "launch_app", nullable = false) private boolean launchApp = false;
  @Column(name = "download_url", length = 1024) private String downloadUrl;
  ```
  + getters/setters。`url` 维持 NOT NULL。构造器不变(launchApp/downloadUrl 经 setter)。

- [ ] **Step 3: `LinkRequest.java`(record)** — 加字段 `Boolean launchApp, String downloadUrl`(其余不变);加便捷 `public boolean launchAppOrDefault() { return Boolean.TRUE.equals(launchApp); }`;加校验:
  ```java
  @jakarta.validation.constraints.AssertTrue(message = "启动本地应用时必须提供下载地址")
  public boolean isDownloadUrlPresentWhenLaunch() {
      return !launchAppOrDefault() || (downloadUrl != null && !downloadUrl.isBlank());
  }
  ```
  `url` 仍 `@NotBlank`。

- [ ] **Step 4: `LinkResponse.java`** — 加 `boolean launchApp, String downloadUrl`;`of(...)` 传 `l.isLaunchApp()`/`l.getDownloadUrl()`。

- [ ] **Step 5: HomeLink(portal)** — 加 `boolean launchApp, String downloadUrl`;映射同步。

- [ ] **Step 6: 映射(LinkService/Controller create+update)** — `link.setLaunchApp(req.launchAppOrDefault()); link.setDownloadUrl(req.downloadUrl());`。

- [ ] **Step 7: V5 迁移**
  - `mariadb/V5__link_launch_app.sql`:
    ```sql
    ALTER TABLE link ADD COLUMN launch_app BOOLEAN NOT NULL DEFAULT FALSE,
                     ADD COLUMN download_url VARCHAR(1024) NULL;
    ```
  - `oracle/V5__link_launch_app.sql`:
    ```sql
    ALTER TABLE link ADD (launch_app NUMBER(1) DEFAULT 0 NOT NULL, download_url VARCHAR2(1024));
    ```

- [ ] **Step 8: `OracleMigrationTest`** — `migrationsExecuted` `4` → `5`。

- [ ] **Step 9: `DevDataSeeder`** — 加 1 条 launch 示范链接(无授权,对所有人可见),例:
  ```java
  Link mesClient = new Link("MES 客户端", "MES Client", "mesclient://", "monitor", "MES", "ACTIVE", 70, true);
  mesClient.setLaunchApp(true);
  mesClient.setDownloadUrl("https://downloads.example.com/mes-client-setup.exe");
  links.save(mesClient);
  ```
  （若 icon `monitor` 不在前端 iconMap 则换 `factory`。）更新 `DevDataSeederTest`:links 7→8(grants 不变=4,enums=12)。

- [ ] **Step 10: 测试** — `LinkTestFactory`/`HomeIntegrationTest`/`LinkAdminControllerTest`:默认 `launchApp=false`(payload 可省略)。新增:`launchApp=true`+`downloadUrl` 创建 201 且响应回显;`launchApp=true` 缺 `downloadUrl` → 400;web 链接(launchApp 省略/false)201。`HomeIntegrationTest` 断言响应含 `launchApp`/`downloadUrl`。

- [ ] **Step 11: 全量** — `cd /home/shane/Code/cim-portal/cim-portal-server/backend && mvn -q test 2>&1 | grep -E 'Tests run:|BUILD' | tail -5` → BUILD SUCCESS(V1→V5 应用)。

- [ ] **Step 12: Commit**(后端 dev)
```bash
cd /home/shane/Code/cim-portal/cim-portal-server
git add backend/src
git commit -m "feat(link): 启动本地应用链接类型(launchApp + downloadUrl + V5 迁移 + 校验 + 种子)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 前端 — useAppLaunch + 卡片/表单

**Files:** `src/lib/api/types.ts`, `src/lib/api/admin.ts`, `src/lib/composables/useAppLaunch.ts`(新), `src/lib/composables/useAppLaunch.spec.ts`(新), `src/features/dashboard/SystemCard.vue`, `src/features/admin/links/LinkFormModal.vue`, `src/features/admin/links/LinksAdminView.vue`, `src/lib/i18n/locales/{zh,en}.ts`, 相关 `.spec.ts`/夹具

- [ ] **Step 1: 类型** — `HomeLink`/`AdminLink`/`LinkInput` 加 `launchApp: boolean` + `downloadUrl?: string`(`HomeLink` 也加这两者)。

- [ ] **Step 2: `useAppLaunch.ts`(新)** —
  ```ts
  import { useToastStore } from '@/stores/toast'
  import { i18n } from '@/lib/i18n'
  /** 尝试经自定义 scheme 唤起本地应用;~2s 内无接管则新标签打开下载页(被拦截则 toast)。 */
  export function launchOrDownload(scheme: string, downloadUrl: string, timeoutMs = 2000) {
    let done = false
    const cleanup = () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('blur', onHide)
      window.removeEventListener('pagehide', onHide)
    }
    const onHide = () => { if (document.hidden || true) { done = true; clearTimeout(t); cleanup() } }
    const t = window.setTimeout(() => {
      if (done) return
      cleanup()
      const win = window.open(downloadUrl, '_blank', 'noopener')
      if (!win) useToastStore().push({ type: 'info', message: i18n.global.t('dashboard.launch.downloadHint'), action: { label: i18n.global.t('common.download'), href: downloadUrl } })
    }, timeoutMs)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('blur', onHide)
    window.addEventListener('pagehide', onHide)
    // 触发 scheme(隐藏 iframe,避免未注册时当前页报错)
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'; iframe.src = scheme
    document.body.appendChild(iframe)
    window.setTimeout(() => iframe.remove(), 1000)
  }
  ```
  （`onHide` 简化:任一事件即视为已接管。若 `useToastStore` 的 `push` 不支持 `action`,改为 `message` 内含提示 + 不抛错;实现期对齐 toast API。）

- [ ] **Step 3: `useAppLaunch.spec.ts`(新)** — 用 `vi.useFakeTimers()`:(a) 调用后未触发隐藏事件 → 推进 2s → `window.open` 被调用(mock);(b) 触发 `window.dispatchEvent(new Event('blur'))` → 推进 2s → `window.open` 未被调用;(c) `window.open` 返回 null → toast push 被调用(mock store)。

- [ ] **Step 4: `SystemCard.vue`** — `import { launchOrDownload } from '@/lib/composables/useAppLaunch'`。`onClick(e)`:保持非 ACTIVE 的 `emit('blocked', link)`;**ACTIVE 且 `link.launchApp`** 时 `e.preventDefault(); launchOrDownload(link.url, link.downloadUrl ?? link.url)`。`<a :href>`:launch 链接 href 设为 `link.downloadUrl || link.url`(无 JS 时退化为下载页;有 JS 时 onClick 接管)。状态行(env 徽章旁)加 launch 标识:`<span v-if="link.launchApp" class="…中性徽章…">APP</span>`(可用 `LINK_ENVS` 同款 ring/pill 风格 + 中性色 `bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]`)。

- [ ] **Step 5: `LinkFormModal.vue`** — 加 `launchApp` ref + form `downloadUrl`;在 URL 行附近加 `Switch`(`t('admin.linkForm.launchAppLabel')`)。模板:URL 字段标签 `launchApp ? t('admin.linkForm.protocolUrlLabel') : t('admin.linkForm.urlLabel')`,placeholder `launchApp ? 'mesclient://' : 'https://...'`;`v-if="launchApp"` 显示必填 `downloadUrl` 字段(label `t('admin.linkForm.downloadUrlLabel')`)+ 小字 hint `t('admin.linkForm.launchAppHint')`。`populate`:`launchApp.value = !!props.link?.launchApp`,回填 `form.downloadUrl`。`save`:`{ ...input, launchApp: launchApp.value, downloadUrl: launchApp.value ? form.downloadUrl : undefined }`;校验:`launchApp` 时 `downloadUrl` 必填(fieldErrors)。

- [ ] **Step 6: `LinksAdminView.vue`** — 行内名旁可加 `APP` 小徽章(若 `l.launchApp`),沿用第 4 步样式。

- [ ] **Step 7: i18n** — `admin.linkForm` 加 `launchAppLabel`(zh `启动本地应用` / en `Launch local app`)、`protocolUrlLabel`(zh `应用协议 URL` / en `App protocol URL`)、`downloadUrlLabel`(zh `下载地址` / en `Download URL`)、`launchAppHint`(zh `需客户机已注册该协议;未安装将跳转下载地址` / en `Client must have the protocol registered; otherwise redirects to the download URL`);`common` 加 `download`(zh `下载` / en `Download`);`dashboard` 加 `launch: { downloadHint }`(zh `未检测到本地应用,可前往下载` / en `Local app not detected — you can download it`)。键对齐。

- [ ] **Step 8: 测试/夹具** — 夹具加 `launchApp:false`(及一条 `launchApp:true`+`downloadUrl`);`SystemCard`:launch 链接点击调用 `launchOrDownload`(mock 该模块)、渲染 APP 徽章;`LinkFormModal`:开关切换显隐 downloadUrl + 保存 payload 含两字段 + launch 时 downloadUrl 必填。

- [ ] **Step 9: 全量 + build** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → typecheck 净、测试绿、build OK。

- [ ] **Step 10: Commit**(前端 launch-app)
```bash
git add -A
git commit -m "feat(link): 启动本地应用入口(useAppLaunch + APP 徽章 + 表单开关/下载地址)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 验证 + 冒烟

- [ ] **Step 1: 后端门禁** — `cd backend && mvn -q test 2>&1 | grep -E 'Tests run:|BUILD' | tail -3` → SUCCESS。
- [ ] **Step 2: dev 库 V5(MariaDB)** — `mvn -q -DskipTests package`;`fuser -k 8080/tcp; sleep 3; rm -f /tmp/be.log; SPRING_PROFILES_ACTIVE=dev nohup java -jar target/portal.jar >/tmp/be.log 2>&1 &`;待起;`grep -iE 'Migrating|launch_app|now at version' /tmp/be.log | tail`;`mariadb …cim_portal -e "SHOW COLUMNS FROM link;"` 确认有 `launch_app`/`download_url`。
- [ ] **Step 3: Oracle V5(可选,容器)** — `docker run -d --name cim-oracle -p 1521:1521 -e ORACLE_PASSWORD=syspw -e APP_USER=cim_portal -e APP_USER_PASSWORD=cim_portal gvenzl/oracle-free:slim-faststart`;待 "DATABASE IS READY";`SPRING_PROFILES_ACTIVE=oracle-dev DB_URL=jdbc:oracle:thin:@//localhost:1521/FREEPDB1 DB_USER=cim_portal DB_PASSWORD=cim_portal java -jar target/portal.jar` → 日志 V1→V5 应用;完后 `docker rm -f cim-oracle`。
- [ ] **Step 4: 前端门禁** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → 绿。
- [ ] **Step 5: 冒烟** — `VITE_API_BASE_URL=http://localhost:8080 npm run dev`;登录 ADMIN1 → 首页:普通 Web 链接照常打开;launch 链接(MES 客户端)显示 `APP` 徽章,点击触发 scheme 导航(无注册处理器时约 2s 后新标签打开下载页);`/admin/links` 编辑:开关「启动本地应用」→ URL 标签变协议、出现下载地址必填字段,保存生效。截图首页 + 编辑模态。`fuser -k 5173/tcp`。
- [ ] **Step 6: 残留/边界** — 确认 web 链接(launchApp=false)行为不变;说明 scheme 注册属客户机运维(门户外)。

---

## 自检清单(Self-Review)

**规格覆盖(spec §2–§6):** 后端 launch_app/download_url + 校验 + V5 + OracleMigrationTest + 映射 + HomeLink + 种子 + 测试 → T1;前端 types + useAppLaunch(+spec)+ SystemCard(点击+APP 徽章)+ LinkFormModal(开关+downloadUrl)+ LinksAdminView + i18n + 测试 → T2;双端门禁 + V5 实跑(Maria+Oracle)+ 冒烟 → T3。回退的回退(window.open 被拦截→toast)在 useAppLaunch + 其 spec 覆盖。

**占位符扫描:** 无 TBD;实体/DTO/校验/V5 SQL/useAppLaunch/i18n 键给出具体内容;映射/HomeLink/toast `action` API 以「Read 确认/实现期对齐」点名。

**类型/命名一致性:** `launchApp`(实体列 launch_app ↔ DTO/TS 驼峰 boolean)、`downloadUrl`(download_url ↔ 驼峰,可空)两端一致;`SystemCard` emit `blocked:[HomeLink]` 不变;`admin.linkForm.{launchAppLabel,protocolUrlLabel,downloadUrlLabel,launchAppHint}` + `common.download` + `dashboard.launch.downloadHint` zh/en 对齐;Flyway V5 双库 ↔ OracleMigrationTest=5。**硬约束**(双端绿、launchApp⇒downloadUrl、web 不变、grants 不变)在 T1/T2/T3 复验。
