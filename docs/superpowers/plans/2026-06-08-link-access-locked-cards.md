# 权限:无权链接显示为「锁定卡片」实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development(推荐)或 superpowers:executing-plans。Steps use checkbox (`- [ ]`).

**Goal:** 授权从「可见性过滤」改为「打开权限闸门」:所有启用链接对所有人可见,无权者显示为锁定卡(可见不可开),目标地址服务端隐藏。

**Architecture:** `HomeService` 不再跳过无权链接,改为每链接计算 `accessible` 并在无权时把 `url`/`downloadUrl` 置 null;`HomeLink` 加 `accessible`;`SystemCard` 渲染锁定态并拦截点击。无 DB 改动。

**Tech Stack:** Spring Boot/JPA/Testcontainers;Vue3/Vite/Vitest。

**契约/现状(本会话已核对):** spec `docs/superpowers/specs/2026-06-08-link-access-locked-cards-design.md`。后端 `HomeService.resolveFor` 当前 `if (!PermissionResolver.isVisible(dept,role,g)) continue;` 后 `new HomeLink(id,nameZh,nameEn,url,icon,statusCode,openInNewTab,environment,launchApp,downloadUrl)`;`HomeLink` record 字段顺序见此;`PermissionResolver.isVisible(dept,role,grants)`(无 grants→true,否则匹配)。前端 `HomeLink`(`url:string` 必填、含 environment/launchApp/downloadUrl;无 accessible);`SystemCard` `<a :href @click="onClick">`(onClick:launchApp→launchOrDownload;非 ACTIVE→emit blocked;否则跳转)+ 状态行 StatusDot+statusText + env/APP 徽章;`SystemGrid` 接 blocked。**硬约束:双端测试绿;锁定链接 url/downloadUrl 必须 null(服务端隐藏);锁定为硬阻断、优先于 blocked/launch;链接总数不随授权变化;无 DB 改动。** 前端仓库分支 `dev`(新建 `locked-cards`);后端 `backend/` 分支 `dev` 直接提交。门禁:前端 `npm run verify`、后端 `cd backend && mvn -q test`。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## Task 1: 后端 — accessible + 隐藏目标

**Files:** `backend/.../portal/dto/HomeLink.java`, `backend/.../portal/HomeService.java`, `backend/src/test/.../portal/HomeIntegrationTest.java`

- [ ] **Step 1: Read** `HomeLink.java`、`HomeService.java`、`HomeIntegrationTest.java`、`PermissionResolver.java`(确认签名)。

- [ ] **Step 2: `HomeLink.java`** — 末位加 `boolean accessible`:
  ```java
  public record HomeLink(Long id, String nameZh, String nameEn,
                         String url, String icon, String statusCode,
                         boolean openInNewTab, LinkEnv environment,
                         boolean launchApp, String downloadUrl,
                         boolean accessible) { }
  ```

- [ ] **Step 3: `HomeService.resolveFor`** — 替换循环体:去掉 `continue`,计算 accessible,无权时隐藏目标:
  ```java
  for (Link l : all) {
      var g = grantsByLink.getOrDefault(l.getId(), List.of());
      boolean accessible = PermissionResolver.isVisible(user.departmentCode(), user.roleCode(), g);
      byCategory.computeIfAbsent(l.getCategoryCode(), k -> new ArrayList<>())
          .add(new HomeLink(l.getId(), l.getNameZh(), l.getNameEn(),
              accessible ? l.getUrl() : null, l.getIcon(), l.getStatusCode(),
              l.isOpenInNewTab(), l.getEnvironment(),
              l.isLaunchApp(), accessible ? l.getDownloadUrl() : null,
              accessible));
  }
  ```
  （分类分组/排序/统计不变。)

- [ ] **Step 4: `HomeIntegrationTest`** — 改原「无权链接被过滤」断言为:返回**全部**启用链接;对当前用户无权的 dept/role 限定链接 → JSON `accessible:false` 且 `url` 为 null(`$..links[?(...)].url` 为 null 或断言该链接节点 url 缺失/为 null);无授权链接 → `accessible:true` 且 `url` 非空;断言链接总数 == 启用链接数(不随用户变化)。用既有种子(如 OP1=FAB1-PROD 对 QA_ENGINEER 限定的 SPC 链接无权)。

- [ ] **Step 5: 全量** — `cd /home/shane/Code/cim-portal/cim-portal-server/backend && mvn -q test 2>&1 | grep -E 'Tests run:|BUILD' | tail -5` → BUILD SUCCESS。

- [ ] **Step 6: Commit**(后端 dev)
```bash
cd /home/shane/Code/cim-portal/cim-portal-server
git add backend/src
git commit -m "feat(portal): 无权链接改为可见锁定卡(home 返回全部 + accessible;无权隐藏 url/downloadUrl)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 前端 — 锁定卡渲染

**Files:** `src/lib/api/types.ts`, `src/features/dashboard/SystemCard.vue`, `src/lib/i18n/locales/{zh,en}.ts`, 相关 `.spec.ts`/夹具(`SystemGrid.spec.ts` 等)

- [ ] **Step 1: 类型** — `src/lib/api/types.ts` `HomeLink`:加 `accessible: boolean`;`url: string` → `url?: string`(锁定时缺省)。

- [ ] **Step 2: i18n** — `{zh,en}.ts` `dashboard` 加 `noAccess`(zh `无权限` / en `No access`)、`noAccessHint`(zh `无权限,请联系管理员` / en `No access — contact your administrator`)。键对齐。

- [ ] **Step 3: `SystemCard.vue`** —
  - `import { Lock } from 'lucide-vue-next'`;`const locked = computed(() => !props.link.accessible)`。
  - 计算点击目标(沿用现状,launch 链接 href = downloadUrl||url):仅非锁定时给 `:href`。模板根 `<a>`:`:href="locked ? undefined : <现有 href 表达式>"`,`:title="locked ? t('dashboard.noAccessHint') : undefined"`,`:aria-disabled="locked"`,`:class` 追加 `locked && 'opacity-60 cursor-not-allowed'`。
  - `onClick(e)`:函数体最前加 `if (locked.value) { e.preventDefault(); return }`,其后维持既有 launchApp / blocked / 普通逻辑。
  - 状态行:`<template v-if="locked"><span class="… text-ink-3 inline-flex items-center gap-1.5"><Lock class="size-3.5" /> {{ t('dashboard.noAccess') }}</span></template><template v-else>` 现有 `StatusDot + statusText` `</template>`。env/APP 徽章保持(在 locked 下照渲染)。

- [ ] **Step 4: 夹具/测试** — 现有 Home/SystemGrid 夹具补 `accessible: true`;新增 `accessible:false`(且 `url` 省略)夹具。`SystemGrid.spec`/`SystemCard`:锁定链接渲染 Lock 图标 + `无权限` 文案 + `title` = noAccessHint、根元素有 `opacity-60`/无 `href`、点击不 `emit('blocked')` 且不导航(可断言 `a[href]` 不存在或 click 后无 blocked 事件);可访问链接照常(env/APP/launch/blocked 行为不变)。

- [ ] **Step 5: 全量 + build** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → typecheck 净、测试绿、build OK。

- [ ] **Step 6: Commit**(前端 locked-cards)
```bash
git add -A
git commit -m "feat(portal): 无权链接锁定卡(置灰 + 锁图标 + 无权限提示 + 拦截点击)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 验证 + 冒烟

- [ ] **Step 1: 后端门禁** — `cd backend && mvn -q test 2>&1 | grep -E 'Tests run:|BUILD' | tail -3` → SUCCESS。
- [ ] **Step 2: 重启 dev 后端** — `mvn -q -DskipTests package`;`fuser -k 8080/tcp; sleep 3; rm -f /tmp/be.log; SPRING_PROFILES_ACTIVE=dev nohup java -jar target/portal.jar >/tmp/be.log 2>&1 &`;待起。
- [ ] **Step 3: API 校验(无权 vs 有权)** — 取 OP1 token(`/dev/token?employeeId=OP1`,字段 `access_token`)调 `/api/portal/home`:确认含对 OP1 无权的链接(如 QA 限定 SPC)且其 `accessible:false`、`url` 为 null;无授权链接 `accessible:true`、`url` 非空。
- [ ] **Step 4: 前端门禁** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → 绿。
- [ ] **Step 5: 冒烟** — `VITE_API_BASE_URL=http://localhost:8080 npm run dev`;以**有权限受限**的身份登录(如 OP1,FAB1-PROD/OPERATOR)→ 首页:无权链接显示为置灰锁定卡(锁图标 + 无权限 + 悬停 tooltip),点击无反应;有权链接照常打开。截图首页(含锁定卡)。`fuser -k 5173/tcp`。
- [ ] **Step 6: 边界** — 确认锁定卡无 `url`(网络响应 + DOM 无真实地址);锁定优先于维护/停用确认与 launch。

---

## 自检清单(Self-Review)

**规格覆盖(spec §2–§4):** HomeLink.accessible + HomeService 计算/隐藏目标 + HomeIntegrationTest → T1;types(accessible/url?)+ SystemCard 锁定态(置灰/锁图标/无权限/tooltip/拦截)+ i18n + 测试 → T2;双端门禁 + 无权/有权 API 校验 + 冒烟 → T3。服务端隐藏目标(锁定 url/downloadUrl=null)在 T1 + T3 §6 复验。

**占位符扫描:** 无 TBD;HomeLink/HomeService 片段给出完整内容;HomeIntegrationTest 断言以现有种子点名(OP1 vs QA 限定链接)。

**类型/命名一致性:** `accessible`(后端 HomeLink boolean 末位 ↔ 前端 HomeLink boolean);`url` 两端可空(后端 record String 可 null ↔ 前端 `url?`);`PermissionResolver.isVisible` 复用不改名(语义=访问权);`dashboard.noAccess`/`noAccessHint` zh/en 对齐。**硬约束**(双端绿、锁定隐藏目标、锁定硬阻断优先、总数不变、无 DB 改动)在 T1/T2/T3 复验。
