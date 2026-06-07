# 改名 + 链接模型改造(去 code + 多环境 URL)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** (1) 品牌 → `AP1 IT CIM Portal`;(2)删链接 `code`;加 DEV/UAT/RELEASE 多环境 URL(彩色按钮,三者全有=环境感知,否则单 URL,互斥),兼容单 URL 链接。

**Architecture:** 后端 `link` 表去 `code`(列+唯一约束)、`url` 改可空、加 `url_dev/url_uat/url_release`(Flyway V3 双库);DTO 加 `@AssertTrue` 互斥校验;前端 `LINK_ENVS` 固定常量 + 彩色按钮 + 表单环境开关。

**Tech Stack:** Spring Boot/JPA/Flyway/Testcontainers(后端);Vue3/Vite/Vitest(前端)。

**契约/现状(已核对):** spec `docs/superpowers/specs/2026-06-07-rename-and-link-env-design.md`。后端 `Link`(code NOT NULL+uk_link_code、url NOT NULL 1024…)、`LinkRequest`(@NotBlank code/url…)、`LinkResponse`、`DevDataSeeder`(`new Link(code,…)`)、Flyway V1(建表)/V2(drop label)、`OracleMigrationTest` 断言数=2。前端 `types.ts`(HomeLink/AdminLink/LinkInput 含 code)、`SystemCard.vue`(单 `<a>`+`· code`+blocked→SystemGrid)、`LinkFormModal.vue`(code+url 字段)、`LinksAdminView.vue`(code 副标题)、i18n `brand.title`/`auth.login.title`、`src-tauri/tauri.conf.json`(productName/title)。**硬约束:双端测试绿(改后);行为正确(env 互斥、单 URL 兼容);grants 不受影响(按 linkId)。** 前端仓库 `/home/shane/Code/cim-portal/cim-portal-client`(分支 `dev`,新建 `link-env`);后端 `/home/shane/Code/cim-portal/cim-portal-server` 模块 `backend/`(分支 `dev` 直接提交)。门禁:前端 `npm run verify`、后端 `cd backend && mvn -q test`。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## Task 1: 改名 → AP1 IT CIM Portal

**Files:** `src/lib/i18n/locales/{zh,en}.ts`, `src/lib/i18n/i18n.spec.ts`, `src-tauri/tauri.conf.json`, `src-tauri/README.md`

- [ ] **Step 1:** `zh.ts` `brand.title` `'CIM 门户'` → `'AP1 IT CIM 门户'`;`auth.login.title` `'CIM 门户'` → `'AP1 IT CIM 门户'`。`en.ts` `brand.title` `'CIM Portal'` → `'AP1 IT CIM Portal'`;`auth.login.title` `'CIM Portal'` → `'AP1 IT CIM Portal'`。
- [ ] **Step 2:** `i18n.spec.ts` 解析断言:`zh → 'AP1 IT CIM 门户'`、`en → 'AP1 IT CIM Portal'`。
- [ ] **Step 3:** `tauri.conf.json`:`"productName": "AP1 IT CIM Portal"`;窗口 `"title": "AP1 IT CIM 门户"`。
- [ ] **Step 4:** `src-tauri/README.md`:首行标题 `CIM Portal` → `AP1 IT CIM Portal`。
- [ ] **Step 5:** `cd /home/shane/Code/cim-portal/cim-portal-client && npm test -- i18n && npm run typecheck` → 绿。
- [ ] **Step 6: Commit**
```bash
git checkout -b link-env 2>/dev/null || git checkout link-env
git add src/lib/i18n src-tauri/tauri.conf.json src-tauri/README.md
git commit -m "feat: 品牌改名 AP1 IT CIM Portal(i18n brand/login + tauri productName/title + README)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 后端 — 去 code + 多环境 URL + V3 迁移

**Files:** `backend/.../link/Link.java`, `link/dto/LinkRequest.java`, `link/dto/LinkResponse.java`, `portal/`(HomeLink DTO), `seed/DevDataSeeder.java`, `db/migration/{mariadb,oracle}/V3__link_drop_code_add_env_urls.sql`, `test/.../migration/OracleMigrationTest.java`, 相关测试/工厂

- [ ] **Step 1: 读现状** — Read `V1__schema.sql`(两库,确认 link 列/约束名)、`HomeController`/`HomeResponse`(HomeLink 形状)、`LinkTestFactory`、`LinkAdminControllerTest`、`HomeIntegrationTest`、`LinkService`(若有 of/映射)。

- [ ] **Step 2: `Link.java`** — 删 `code` 字段+getter/setter+构造参数;`@Table` 去 `uniqueConstraints`;`url` 列去 `nullable=false`;加
  ```java
  @Column(name = "url_dev", length = 1024) private String urlDev;
  @Column(name = "url_uat", length = 1024) private String urlUat;
  @Column(name = "url_release", length = 1024) private String urlRelease;
  ```
  + getters/setters;构造器改 `Link(String nameZh, String nameEn, String url, String icon, String categoryCode, String statusCode, int sortOrder, boolean openInNewTab)`(env 经 setter)。

- [ ] **Step 3: `LinkRequest.java`** — 删 `code`;`url` 由 `@NotBlank String url` → `String url`(可空);加 `String urlDev, String urlUat, String urlRelease`;加:
  ```java
  @jakarta.validation.constraints.AssertTrue(message = "需提供单 URL,或同时提供 DEV/UAT/RELEASE 三个环境 URL")
  public boolean isValidUrlConfig() {
      boolean envAll = nb(urlDev) && nb(urlUat) && nb(urlRelease);
      boolean envNone = !nb(urlDev) && !nb(urlUat) && !nb(urlRelease);
      boolean single = nb(url);
      return (single && envNone) || (!single && envAll);
  }
  private static boolean nb(String s) { return s != null && !s.isBlank(); }
  ```
  （record 内可加静态/实例方法;`@AssertTrue` 方法名 `isValidUrlConfig`。）

- [ ] **Step 4: `LinkResponse.java`** — 删 `code`;加 `String urlDev, urlUat, urlRelease`;`of(...)` 同步。

- [ ] **Step 5: HomeLink(portal)** — 按 Step1 实际:删 `code`,加 3 env url;映射处(HomeController/service)同步。

- [ ] **Step 6: 写映射处**(LinkService/Controller 创建/更新):set url + urlDev/uat/release(env 互斥已由 DTO 校验保证;创建/更新时直接 set 四者,空即空)。

- [ ] **Step 7: `DevDataSeeder.java`** — `new Link(code,…)` → 新签名(去 code);多数链接单 URL;选 1–2 个设 `l.setUrlDev(...); l.setUrlUat(...); l.setUrlRelease(...)` 且 url 留 null(示范环境感知)。

- [ ] **Step 8: Flyway V3**
  - `backend/src/main/resources/db/migration/mariadb/V3__link_drop_code_add_env_urls.sql`:
    ```sql
    ALTER TABLE link DROP INDEX uk_link_code;
    ALTER TABLE link DROP COLUMN code;
    ALTER TABLE link MODIFY url VARCHAR(1024) NULL;
    ALTER TABLE link ADD COLUMN url_dev VARCHAR(1024) NULL,
                     ADD COLUMN url_uat VARCHAR(1024) NULL,
                     ADD COLUMN url_release VARCHAR(1024) NULL;
    ```
    （若 V1 约束/索引名不同,按实际改;mariadb 唯一约束=索引,用 `DROP INDEX`。）
  - `oracle/V3__link_drop_code_add_env_urls.sql`:
    ```sql
    ALTER TABLE link DROP CONSTRAINT uk_link_code;
    ALTER TABLE link DROP COLUMN code;
    ALTER TABLE link MODIFY (url VARCHAR2(1024) NULL);
    ALTER TABLE link ADD (url_dev VARCHAR2(1024), url_uat VARCHAR2(1024), url_release VARCHAR2(1024));
    ```
    （按 V1 oracle 实际约束名/类型校正。）

- [ ] **Step 9: `OracleMigrationTest`** — `migrationsExecuted` 断言 `2` → `3`。

- [ ] **Step 10: 测试更新/新增** — `LinkTestFactory`/`HomeIntegrationTest`/`LinkAdminControllerTest` 去 `code`、用新构造器/payload(payload 去 code、url 或三 env)。新增 `LinkRequest` 校验测试或控制器测试:单 URL 201;三 env 201;`url` 空且仅给 1 个 env → 400;`url` 与 env 同给 → 400。`HomeIntegrationTest` 断言响应含 env url、无 code。

- [ ] **Step 11: 全量** — `cd /home/shane/Code/cim-portal/cim-portal-server/backend && mvn -q test 2>&1 | grep -E 'Tests run:|BUILD' | tail -5` → BUILD SUCCESS(V3 在测试容器应用;校验/Home/Admin 测试绿)。

- [ ] **Step 12: Commit**(后端 dev)
```bash
cd /home/shane/Code/cim-portal/cim-portal-server
git add backend/src/main/java/com/cimportal/link backend/src/main/java/com/cimportal/portal backend/src/main/java/com/cimportal/seed backend/src/main/resources/db/migration backend/src/test
git commit -m "feat(link): 移除 code 字段 + DEV/UAT/RELEASE 多环境 URL(V3 迁移 + 互斥校验 + 种子示范)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 前端 — 类型 + 常量 + i18n + 卡片 + 表单 + 列表

**Files:** `src/lib/api/types.ts`, `src/constants.ts`, `src/lib/i18n/locales/{zh,en}.ts`, `src/features/dashboard/SystemCard.vue`, `src/features/dashboard/SystemGrid.vue`, `src/features/admin/links/LinkFormModal.vue`, `src/features/admin/links/LinksAdminView.vue`, 相关 `.spec.ts` + MSW 夹具

- [ ] **Step 1: `types.ts`** — `HomeLink`/`AdminLink` 删 `code`,改 `url?: string`,加 `urlDev?: string; urlUat?: string; urlRelease?: string`;`LinkInput` 删 `code`、`url?`、加三 env(可空)。

- [ ] **Step 2: `constants.ts`** — 加:
  ```ts
  export const LINK_ENVS = [
    { key: 'dev', field: 'urlDev', label: 'DEV', btn: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 hover:bg-slate-500/25' },
    { key: 'uat', field: 'urlUat', label: 'UAT', btn: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25' },
    { key: 'release', field: 'urlRelease', label: 'RELEASE', btn: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25' },
  ] as const
  ```
  （DEV 灰 / UAT 琥珀 / RELEASE 绿;按钮 Tailwind 类。)

- [ ] **Step 3: i18n** — `admin.linkForm` 加 `envAware`(zh `环境感知(DEV/UAT/RELEASE)` / en `Environment-aware (DEV/UAT/RELEASE)`)、`urlDevLabel`/`urlUatLabel`/`urlReleaseLabel`(如 `URL · DEV` 两 locale同;或 zh `开发环境 URL`/en `Dev URL` 等)。键对齐维持。

- [ ] **Step 4: `SystemCard.vue`** — `import { LINK_ENVS } from '@/constants'`;`const envButtons = computed(() => LINK_ENVS.filter(e => (props.link as any)[e.field]))`。模板:去 `· {{ link.code }}`。布局改为:图标 + 名 + 状态行;若 `envButtons.length` → 一行按钮 `<a v-for="e in envButtons" :href="(link as any)[e.field]" :target="link.openInNewTab?'_blank':'_self'" rel="noopener" :class="e.btn 基础类" @click="onClick($event, (link as any)[e.field])">{{ e.label }}</a>`;否则单 `<a :href="link.url" … @click="onClick($event, link.url)">`(整卡可点)。`onClick(e, url)`:`if (statusCode !== LINK_STATUS.ACTIVE) { e.preventDefault(); emit('blocked', { link, url }) }`(ACTIVE 时 `<a href>` 正常打开)。`emit` 签名改 `blocked: [{ link: HomeLink; url: string }]`。

- [ ] **Step 5: `SystemGrid.vue`** — `onBlocked` 接 `{ link, url }`,`pending` 存 `{ link, url }`(或单独 `pendingUrl`);`dlg` 用 `pending.link`;`proceed` 用 `pending.url` → `window.open(pending.url, …)`。`@blocked` 绑定更新。

- [ ] **Step 6: `LinkFormModal.vue`** — 删 `code` 字段 + form.code;加 `envAware` ref + form `urlDev/urlUat/urlRelease`;`Switch` 绑 `envAware`(label `t('admin.linkForm.envAware')`)。模板:`v-if="!envAware"` 单 URL 字段(form.url);`v-else` 三必填字段。`populate`:`envAware.value = !!props.link?.urlDev`,回填四者。`save`:构造 LinkInput——envAware 则 `{ ...form, url: undefined, urlDev, urlUat, urlRelease }`,否则 `{ ...form, url, urlDev: undefined, ... }`;前端校验(envAware 时三者必填,否则 url 必填)→ fieldErrors。`code` 相关全删。

- [ ] **Step 7: `LinksAdminView.vue`** — 删行内 `code` 副标题(`<span ...>{{ l.code }}</span>` 那行);保留名/分类/状态。

- [ ] **Step 8: 测试/夹具更新** — `SystemCard`/`LinkFormModal`/`LinksAdminView`/`admin.spec` 及 MSW 夹具:去 `code`,加 `url`/env url 字段;新增:SystemCard 环境感知渲染 3 按钮(DEV/UAT/RELEASE)、单 URL 渲染 1;LinkFormModal envAware 开关切换字段 + 保存 payload(env 三字段 / 单 url)。`i18n.spec`(改名已在 T1)。

- [ ] **Step 9: 全量 + build** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → typecheck 干净、测试绿、build OK。

- [ ] **Step 10: Commit**(前端 link-env 分支)
```bash
git add src/lib/api/types.ts src/constants.ts src/lib/i18n/locales src/features/dashboard/SystemCard.vue src/features/dashboard/SystemGrid.vue src/features/admin/links/LinkFormModal.vue src/features/admin/links/LinksAdminView.vue src/**/*.spec.ts src/test 2>/dev/null
git add -A
git commit -m "feat(link): 前端去 code + DEV/UAT/RELEASE 彩色环境按钮 + 表单环境开关

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 验证 + 运行冒烟 + 收尾

- [ ] **Step 1: 后端门禁** — `cd /home/shane/Code/cim-portal/cim-portal-server/backend && mvn -q test 2>&1 | grep -E 'Tests run:|BUILD' | tail -3` → SUCCESS。
- [ ] **Step 2: 重启 dev 后端(应用 V3)** — `mvn -q -DskipTests package`;`fuser -k 8080/tcp; sleep 3; rm -f /tmp/be.log; SPRING_PROFILES_ACTIVE=dev nohup java -jar target/portal.jar >/tmp/be.log 2>&1 &`;待起;`grep -iE 'Migrating|drop_code|version of schema' /tmp/be.log | tail`;`mariadb …cim_portal -e "SHOW COLUMNS FROM link;"` 确认无 `code`、有 `url_dev/url_uat/url_release`。
- [ ] **Step 3: 前端门禁** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → 绿。
- [ ] **Step 4: 运行冒烟** — `npm run dev`(VITE_API_BASE_URL=http://localhost:8080);登录 → 首页:示范环境感知系统显示 DEV/UAT/RELEASE 三彩色按钮、各自打开对应 URL;单 URL 系统正常一按钮;无 `code` 副标题;品牌显示 `AP1 IT CIM 门户`/EN `AP1 IT CIM Portal`;`/admin/links` 编辑:环境开关切换单/三 URL,保存生效。截图首页(含环境按钮)+ 编辑模态。`fuser -k 5173/tcp`。
- [ ] **Step 5: 残留扫描** — `grep -rn '\.code\b\|code:' src/features/admin/links src/features/dashboard/SystemCard.vue` 确认链接 `code` 引用清零(不误伤 enum code)。
- [ ] **Step 6: 汇报边界** — Tauri 本机不编译(改名仅改 conf,CI/装依赖机验证)。

---

## 自检清单(Self-Review)

**规格覆盖(spec §3–§6):** 改名 → T1;后端实体/DTO/校验/V3/HomeLink/seeder/OracleMigrationTest/测试 → T2;前端 types/constants/i18n/SystemCard/SystemGrid/LinkFormModal/LinksAdminView/测试 → T3;双端门禁 + V3 实跑 + 冒烟 + 残留扫描 → T4。env 互斥(XOR)与单 URL 兼容 → DTO `@AssertTrue` + 表单 envAware + SystemCard envButtons。grants 不变(按 linkId)。

**占位符扫描:** 无 TBD;实体/DTO/校验/V3 SQL/LINK_ENVS 给出完整内容;映射处/HomeLink/V1 约束名以「Read 确认」点名(同语义,实现期对齐)。

**类型/命名一致性:** `url`/`urlDev`/`urlUat`/`urlRelease`(实体列 url_dev/uat/release ↔ DTO/TS 驼峰 ↔ LINK_ENVS.field);`LINK_ENVS`(constants ↔ SystemCard);`SystemCard` emit `blocked:{link,url}` ↔ `SystemGrid` 接收;`admin.linkForm.envAware`/`url*Label` 键 zh/en 对齐;Flyway V3 双库 ↔ OracleMigrationTest 数=3。**硬约束**(双端测试绿、env 互斥、单 URL 兼容、grants 不变)在 T2/T3/T4 复验。
