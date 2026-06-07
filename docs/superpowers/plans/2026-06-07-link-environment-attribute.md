# 链接环境属性(纠正版)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** 纠正环境模型:链接 = 单 `url`(必填)+ 可选 `environment`(DEV/UAT/RELEASE);同系统不同环境为独立链接,卡片以彩色徽章区分。回退上轮的多 URL/三按钮实现。`code` 移除 + 改名保留。

**Architecture:** 后端 Link 去 `urlDev/uat/release`、加 `environment`(枚举 STRING)、`url` 复 NOT NULL;前向 Flyway **V4** 纠正(V3 已应用);前端单 URL 卡片 + 环境彩色徽章 + 表单环境下拉。

**Tech Stack:** Spring Boot/JPA/Flyway/Testcontainers;Vue3/Vite/Vitest。

**契约/现状(已核对):** spec `docs/superpowers/specs/2026-06-07-link-environment-attribute-design.md`。当前(上轮纠正前)后端 `Link` 有 urlDev/uat/release + url 可空;`LinkRequest`(class,@AssertTrue);`LinkResponse`/`HomeLink` 含 env url;Flyway V3 已应用 dev 库 + 推送;`OracleMigrationTest`=3;`DevDataSeeder` 多 url 环境感知 + MAINTENANCE 分类。前端 types/admin 含 env url;`constants.LINK_ENVS`(field+btn);`SystemCard` 三按钮 + `blocked:{link,url}`;`SystemGrid` pending `{link,url}`;`LinkFormModal` envAware+三 url;i18n `admin.linkForm.envAware/urlDevLabel/urlUatLabel/urlReleaseLabel`。dev 库 3 链接经 SQL 多 url 环境感知(url 空)。**硬约束:双端测试绿;V4 不改已应用 V3;grants 按 linkId 不变;url 必填、environment 可选且 ∈{DEV,UAT,RELEASE}。** 前端仓库分支 `dev`(新建 `link-env-fix`);后端 `backend/` 分支 `dev` 直接提交。门禁:前端 `npm run verify`、后端 `cd backend && mvn -q test`。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## Task 1: 后端 — environment 属性 + V4 + 回退

**Files:** `backend/.../link/Link.java`, `link/LinkEnv.java`(新), `link/dto/LinkRequest.java`, `link/dto/LinkResponse.java`, `portal/`(HomeLink), 映射(LinkService/Controller), `seed/DevDataSeeder.java`, `db/migration/{mariadb,oracle}/V4__link_env_attribute.sql`(新), `test/.../migration/OracleMigrationTest.java`, 相关测试/工厂

- [ ] **Step 1: Read** Link.java、LinkRequest/LinkResponse、HomeLink + 映射、DevDataSeeder、LinkAdminControllerTest、HomeIntegrationTest、LinkTestFactory、DevDataSeederTest(确认当前 env-url 形态以便回退)。

- [ ] **Step 2: `LinkEnv.java`(新)** — `package com.cimportal.link; public enum LinkEnv { DEV, UAT, RELEASE }`。

- [ ] **Step 3: `Link.java`** — 删 `urlDev/urlUat/urlRelease` 字段+访问器;`url` 列改回 `nullable=false`;加 `@Enumerated(EnumType.STRING) @Column(name="environment", length=16) private LinkEnv environment;` + getter/setter。构造器维持 `(nameZh,nameEn,url,icon,categoryCode,statusCode,sortOrder,openInNewTab)`。

- [ ] **Step 4: `LinkRequest.java`** — 改回 **record**:`@NotBlank String code` 已无;`@NotBlank String url`;字段 + `LinkEnv environment`(可空);删 env url 与 `@AssertTrue`/辅助方法。

- [ ] **Step 5: `LinkResponse.java`** — 删 env url,加 `LinkEnv environment`;`of(...)` 同步(`l.getEnvironment()`)。

- [ ] **Step 6: HomeLink(portal)** — 删 env url,加 `LinkEnv environment`;映射同步。

- [ ] **Step 7: 映射(LinkService/Controller create/update)** — 去 set env url;加 `link.setEnvironment(req.environment())`。

- [ ] **Step 8: V4 迁移**
  - `mariadb/V4__link_env_attribute.sql`:
    ```sql
    UPDATE link SET url = COALESCE(url, url_release, url_uat, url_dev) WHERE url IS NULL;
    ALTER TABLE link DROP COLUMN url_dev, DROP COLUMN url_uat, DROP COLUMN url_release;
    ALTER TABLE link ADD COLUMN environment VARCHAR(16) NULL;
    ALTER TABLE link MODIFY url VARCHAR(1024) NOT NULL;
    ```
  - `oracle/V4__link_env_attribute.sql`:
    ```sql
    UPDATE link SET url = COALESCE(url, url_release, url_uat, url_dev) WHERE url IS NULL;
    ALTER TABLE link DROP (url_dev, url_uat, url_release);
    ALTER TABLE link ADD (environment VARCHAR2(16));
    ALTER TABLE link MODIFY (url VARCHAR2(1024) NOT NULL);
    ```

- [ ] **Step 9: `OracleMigrationTest`** — `migrationsExecuted` `3` → `4`。

- [ ] **Step 10: `DevDataSeeder`** — 回退多 url;改为每环境独立链接:示范一个系统三条同名(environment DEV/UAT/RELEASE,各 url,无授权)+ 普通无环境链接若干;辅助 `seedEnvLink` 改为接收 `LinkEnv` + 单 url。更新 `DevDataSeederTest` 计数(按新种子条数)。

- [ ] **Step 11: 测试回退/新增** — `LinkTestFactory`/`HomeIntegrationTest`/`LinkAdminControllerTest`:单 url + 可选 environment;删互斥校验用例;新增:`environment=UAT` 创建 201 且响应回显 `environment`;非法 environment 字符串 → 400;`url` 缺失 → 400。`HomeIntegrationTest` 断言响应有 `environment` 字段、无 env url。

- [ ] **Step 12: 全量** — `cd /home/shane/Code/cim-portal/cim-portal-server/backend && mvn -q test 2>&1 | grep -E 'Tests run:|BUILD' | tail -5` → BUILD SUCCESS(V4 在测试容器 V1→V4 应用)。

- [ ] **Step 13: Commit**(后端 dev)
```bash
cd /home/shane/Code/cim-portal/cim-portal-server
git add backend/src
git commit -m "fix(link): 环境改为链接属性 environment(DEV/UAT/RELEASE)+ V4 回退多 URL(每环境独立链接)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 前端 — environment 徽章 + 表单下拉 + 回退

**Files:** `src/lib/api/types.ts`, `src/lib/api/admin.ts`, `src/constants.ts`, `src/features/dashboard/SystemCard.vue`, `src/features/dashboard/SystemGrid.vue`, `src/features/admin/links/LinkFormModal.vue`, `src/features/admin/links/LinksAdminView.vue`, `src/lib/i18n/locales/{zh,en}.ts`, 相关 `.spec.ts`/夹具

- [ ] **Step 1: 类型** — `HomeLink`/`AdminLink`:删 `urlDev/urlUat/urlRelease`,`url: string`(必有),加 `environment?: 'DEV' | 'UAT' | 'RELEASE'`;`LinkInput` 同(删 env url,`url: string`,加 `environment?`)。

- [ ] **Step 2: `constants.ts`** — `LINK_ENVS` 改为映射:
  ```ts
  export const LINK_ENVS = {
    DEV: { label: 'DEV', badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300' },
    UAT: { label: 'UAT', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300' },
    RELEASE: { label: 'RELEASE', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' },
  } as const
  export type LinkEnv = keyof typeof LINK_ENVS
  ```
  （删旧的 field/btn 数组。)

- [ ] **Step 3: `SystemCard.vue`** — 回退为单 `<a :href="link.url" :target=… @click="onClick">`(原 `onClick(e)`:非 ACTIVE → preventDefault + `emit('blocked', link)`;emit 类型 `blocked:[HomeLink]`)。删三按钮/`envButtons`/`LINK_ENVS.filter`。状态行加:`<span v-if="link.environment" :class="['rounded px-1.5 py-0.5 text-[10px] font-bold', LINK_ENVS[link.environment].badge]">{{ link.environment }}</span>`。

- [ ] **Step 4: `SystemGrid.vue`** — `pending: HomeLink | null`;`onBlocked(link: HomeLink)`;`proceed()` 用 `pending.url`;`@blocked="onBlocked"`。

- [ ] **Step 5: `LinkFormModal.vue`** — 删 `envAware` ref + 三 url 字段;`url` 单字段必填(回退原 url 字段)。加 `environment` `Select`,选项 `[{value:'',label:t('common.none')},{value:'DEV',label:'DEV'},{value:'UAT',label:'UAT'},{value:'RELEASE',label:'RELEASE'}]`,form `environment`;`populate` 回填 `form.environment = link.environment ?? ''`;`save` 提交 `environment: form.environment || undefined`。删多 url 校验;url 必填校验。

- [ ] **Step 6: `LinksAdminView.vue`** — 行内名旁加 `<span v-if="l.environment" :class badge>{{ l.environment }}</span>`(若有)。

- [ ] **Step 7: i18n** — `admin.linkForm` 删 `envAware/urlDevLabel/urlUatLabel/urlReleaseLabel`;加 `environmentLabel`(zh `环境` / en `Environment`);`common` 加 `none`(zh `无` / en `None`)。键对齐。

- [ ] **Step 8: 测试/夹具回退/新增** — `SystemCard`/`SystemGrid`/`LinkFormModal`/`LinksAdminView`/`admin.spec`/Home 夹具:删 env url,加 `environment`;删三按钮/envAware 用例;新增:SystemCard `environment` 渲染彩色徽章、无则不渲染;LinkFormModal environment Select 选 UAT → payload `environment:'UAT'`。

- [ ] **Step 9: 全量 + build** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → typecheck 干净、测试绿、build OK。

- [ ] **Step 10: Commit**(前端 link-env-fix)
```bash
git add -A
git commit -m "fix(link): 前端环境改为链接属性 + 彩色徽章 + 表单环境下拉(回退多 URL 三按钮)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 验证 + V4 应用 + 冒烟

- [ ] **Step 1: 后端门禁** — `cd backend && mvn -q test 2>&1 | grep -E 'Tests run:|BUILD' | tail -3` → SUCCESS。
- [ ] **Step 2: 重启 dev 后端(应用 V4)** — `mvn -q -DskipTests package`;`fuser -k 8080/tcp; sleep 3; rm -f /tmp/be.log; SPRING_PROFILES_ACTIVE=dev nohup java -jar target/portal.jar >/tmp/be.log 2>&1 &`;待起;`grep -iE 'Migrating|env_attribute|now at version' /tmp/be.log | tail`;`mariadb …cim_portal -e "SHOW COLUMNS FROM link;"` 确认无 url_dev/uat/release、有 `environment`、`url` NOT NULL。
- [ ] **Step 3: SQL 设演示环境** — 对若干现有链接设 `environment`:例 `UPDATE link SET environment='DEV' WHERE name_zh='设备监控'; UPDATE link SET environment='UAT' WHERE name_zh='质量看板'; UPDATE link SET environment='RELEASE' WHERE name_zh='维护工单';`(择 ADMIN1 可见的无授权链接)。
- [ ] **Step 4: 前端门禁** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → 绿。
- [ ] **Step 5: 冒烟** — `VITE_API_BASE_URL=http://localhost:8080 npm run dev`;登录 ADMIN1 → 首页:带 environment 的链接显示对应彩色徽章(DEV 灰/UAT 琥珀/RELEASE 绿),无环境链接无徽章,各为独立卡片;`/admin/links` 编辑:环境下拉(无/DEV/UAT/RELEASE)选值保存生效;改名 `AP1 IT CIM 门户`、无 code 保持。截图首页 + 编辑模态。`fuser -k 5173/tcp`。
- [ ] **Step 6: 残留扫描** — `grep -rn 'urlDev\|urlUat\|urlRelease\|envAware' src` 前端清零;后端 `grep -rn 'urlDev\|UrlRelease\|isValidUrlConfig' backend/src/main` 清零。
- [ ] **Step 7: 汇报边界** — Tauri 本机不编译。

---

## 自检清单(Self-Review)

**规格覆盖(spec §3–§6):** LinkEnv + Link/DTO/HomeLink environment + V4 + OracleMigrationTest + 映射 + 种子(每环境独立)+ 测试 → T1;types/constants/SystemCard/SystemGrid/LinkFormModal/LinksAdminView/i18n + 测试 → T2;门禁 + V4 实跑 + SQL 演示 + 冒烟 + 残留扫描 → T3。回退多 url(去 urlDev/uat/release、三按钮、envAware、@AssertTrue、blocked:{url})贯穿。`code` 移除 + 改名不动。

**占位符扫描:** 无 TBD;LinkEnv/V4 SQL/constants/SystemCard 片段完整;映射/HomeLink/V1-derived 以「Read 确认」点名。

**类型/命名一致性:** `environment`(实体列 environment ↔ LinkEnv 枚举 ↔ DTO/TS `'DEV'|'UAT'|'RELEASE'` ↔ constants `LINK_ENVS` 键);`url` 必填两端;`SystemCard` emit `blocked:[HomeLink]` ↔ `SystemGrid`;`admin.linkForm.environmentLabel`/`common.none` zh/en 对齐;V4 双库 ↔ OracleMigrationTest=4。**硬约束**(双端测试绿、V4 前向不改 V3、grants 不变、url 必填/environment 枚举校验)在 T1/T2/T3 复验。
