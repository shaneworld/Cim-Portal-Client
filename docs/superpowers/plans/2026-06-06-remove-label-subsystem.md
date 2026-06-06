# 移除 label 子系统 实现计划(前端 + 后端 + DB)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 彻底删除 label 子系统:前端不再拉/用 i18n 标签映射,后端删除 label 实体/服务/控制器/DTO/seed,DB 经 Flyway V2 删表;语言切换、分类名(enums)、链接名(内联)均不受影响。

**Architecture:** 前端瘦身 locale store(原 labels store)并清除 getLabels/类型/路由 hydrate/管理「标签」项;后端删除 `com/cimportal/label` 包 + `DevDataSeeder` label seeding + `LabelControllerTest`,新增 `V2__drop_label.sql`(mariadb+oracle);重建重启后端令 Flyway 删表。

**Tech Stack:** 前端 Vue3+TS+Vite+Vitest;后端 Spring Boot + Flyway 9 + MariaDB(java/mvn 已在 PATH)。

**契约/现状:** spec `docs/superpowers/specs/2026-06-06-remove-label-subsystem-design.md`。两仓库:前端 `/home/shane/Code/cim-portal/cim-portal-frontend`、后端 `/home/shane/Code/cim-portal/cim-portal-server/backend`(各自 git)。**硬约束:前端既有 44 测试保持绿;后端非 label 测试保持绿。** 提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。前端在 `master` 上新建 `rm-label`;后端在其默认分支上直接改(确认其当前分支后,若非临时分支则新建 `rm-label`)。冒烟:后端 `SPRING_PROFILES_ACTIVE=dev` 在 :8080(**勿 `pkill -f portal.jar`**,用 `fuser -k 8080/tcp`)。

**已核查依赖(勿臆测):** `label` 表仅服务 `/api/i18n/labels`;前端无组件用 `t('key')`(仅 `useI18n` 取 `locale`);分类名来自 `enum_value(LINK_CATEGORY)`;`labels` store 同时管理语言切换(`setLocale`/`initLocale`,被 `AppHeader`+`bootstrap` 用);后端 label 引用点:`com/cimportal/label/*` + `seed/DevDataSeeder.java` + `test/.../label/LabelControllerTest.java`;Flyway 仅 `V1__schema.sql`(mariadb+oracle),seed 在 `DevDataSeeder`(非 SQL)。

---

## 文件结构

```
前端(cim-portal-frontend):
  src/stores/labels.ts        → 重命名 src/stores/locale.ts(瘦身)
  src/lib/api/i18n.ts         → 删除
  src/lib/api/types.ts        → 删 LabelEntry/LabelMap(改)
  src/features/dashboard/AppHeader.vue   → 改 import/用法
  src/bootstrap.ts            → 改 import/调用
  src/router/index.ts         → 删 hydrate 守卫块(改)
  src/features/admin/AdminLayout.vue     → 删「标签」项(改)
后端(cim-portal-server/backend):
  src/main/java/com/cimportal/label/**   → 整目录删除
  src/test/java/com/cimportal/label/LabelControllerTest.java → 删除
  src/main/java/com/cimportal/seed/DevDataSeeder.java        → 删 label seeding(改)
  src/main/resources/db/migration/mariadb/V2__drop_label.sql → 新增
  src/main/resources/db/migration/oracle/V2__drop_label.sql  → 新增
```

---

## Task 1: 前端 — 瘦身 locale store + 清除 label 引用

**Files (frontend):** Modify/rename `src/stores/labels.ts`→`src/stores/locale.ts`; Modify `src/lib/api/types.ts`, `src/features/dashboard/AppHeader.vue`, `src/bootstrap.ts`, `src/router/index.ts`, `src/features/admin/AdminLayout.vue`; Delete `src/lib/api/i18n.ts`

- [ ] **Step 1: 新建 `src/stores/locale.ts`(瘦身版),删除旧 `src/stores/labels.ts`**

```ts
import { defineStore } from 'pinia'
import { i18n } from '@/lib/i18n'
import type { Locale } from '@/lib/api/types'

export const useLocaleStore = defineStore('locale', () => {
  function setLocale(l: Locale) { i18n.global.locale.value = l; localStorage.setItem('cimp.locale', l) }
  function initLocale() { const l = localStorage.getItem('cimp.locale') as Locale | null; if (l) i18n.global.locale.value = l }
  return { setLocale, initLocale }
})
```
然后 `git rm src/stores/labels.ts`(旧文件)。

- [ ] **Step 2: 删除 `src/lib/api/i18n.ts`** — `git rm src/lib/api/i18n.ts`。

- [ ] **Step 3: `src/lib/api/types.ts` 删除 label 类型**

删去这两行(保留 `Locale`、`EnumCategory`、`EnumValue` 等其余):
```ts
export interface LabelEntry { zh: string; en: string; type: string }
export type LabelMap = Record<string, LabelEntry>
```

- [ ] **Step 4: `src/features/dashboard/AppHeader.vue`** — `import { useLabelsStore } from '@/stores/labels'` → `import { useLocaleStore } from '@/stores/locale'`;`const labels = useLabelsStore()` → `const locale = useLocaleStore()`。**注意命名冲突:** 该文件已有 `const { locale } = useI18n(...)`。为避免重名,store 实例命名为 `localeStore`:
  - `const localeStore = useLocaleStore()`
  - `toggleLocale()` 内 `labels.setLocale(...)` → `localeStore.setLocale(...)`(`locale.value` 来自 useI18n 不变)。

- [ ] **Step 5: `src/bootstrap.ts`** — `import { useLabelsStore } from '@/stores/labels'` → `import { useLocaleStore } from '@/stores/locale'`;`useLabelsStore().initLocale()` → `useLocaleStore().initLocale()`。

- [ ] **Step 6: `src/router/index.ts`** — 删 `import { useLabelsStore } from '@/stores/labels'`;在守卫中删除整块:
```ts
    const labels = useLabelsStore()
    if (!labels.loaded) { try { await labels.hydrate() } catch { /* non-fatal */ } }
```
(保留 requireAuth/requireAdmin/`auth.hydrateUser()` 等其余守卫逻辑不变。)

- [ ] **Step 7: `src/features/admin/AdminLayout.vue`** — 删除 `标签` 导航项;`import { ChevronLeft, Link2, ListChecks, Tags, Users } from 'lucide-vue-next'` 去掉 `Tags`;`nav` 数组删 `{ to: '/admin/labels', label: '标签', icon: Tags, enabled: false }` 那行。

- [ ] **Step 8: typecheck + 全量 + build + 无残留引用**

```bash
cd /home/shane/Code/cim-portal/cim-portal-frontend
grep -rn "useLabelsStore\|getLabels\|LabelMap\|LabelEntry\|/stores/labels\|/api/i18n\b\|标签" src && echo "STILL REFERENCED ↑" || echo "✓ no label refs"
npm run typecheck && npm test && npm run build
```
Expected: 无残留(「标签」仅可能出现在不相关处——确认无 `/admin/labels`/`Tags`/labels store 引用);typecheck 干净;44 测试绿;build OK。

- [ ] **Step 9: Commit(前端仓库)**
```bash
git add -A
git commit -m "refactor: 移除前端 label 子系统(getLabels/类型/hydrate),labels store→locale store(保留语言切换),去管理「标签」项

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 后端 — 删除 label 包 + 清理 DevDataSeeder + 删测试

**Files (backend):** Delete `src/main/java/com/cimportal/label/` (whole dir) + `src/test/java/com/cimportal/label/LabelControllerTest.java`; Modify `src/main/java/com/cimportal/seed/DevDataSeeder.java`

- [ ] **Step 1: 确认后端 git 分支 + 起分支**
```bash
cd /home/shane/Code/cim-portal/cim-portal-server/backend
git rev-parse --show-toplevel; git branch --show-current; git status --porcelain | head
```
若在 master/main 且干净 → `git checkout -b rm-label`(在仓库根)。记录根路径用于后续 git。

- [ ] **Step 2: 读 `DevDataSeeder.java`,移除 label 相关**

先读全文:`sed -n '1,200p' src/main/java/com/cimportal/seed/DevDataSeeder.java`。移除:
- `import com.cimportal.label.LabelRepository;`(及任何 `import com.cimportal.label.*`)
- 字段 `private final LabelRepository labels;`
- 构造函数参数 `LabelRepository labels,` 及方法体内 `this.labels = labels;`
- 所有用 `labels.` 的 seeding 语句(label 行的 save/创建)。
其余 seeding(links/enums/grants/users/`linkAccessGrant` 等)**保持不变**。确保构造函数签名与 Spring 注入一致(去掉 label 参数后其余参数顺序不变)。

- [ ] **Step 3: 删除 label 包 + 测试**
```bash
git rm -r src/main/java/com/cimportal/label
git rm src/test/java/com/cimportal/label/LabelControllerTest.java
```

- [ ] **Step 4: 确认无残留引用 + 编译**
```bash
grep -rn "com.cimportal.label\|LabelService\|LabelRepository\|LabelI18n\|LabelAdmin\|\bLabel\b" src/main/java src/test/java | grep -v "labelZh\|labelEn\|LabelController" ; echo "--- (上面应为空) ---"
mvn -q -o compile 2>&1 | tail -20 || mvn -q compile 2>&1 | tail -20
```
Expected: 无残留;编译成功(若离线 `-o` 失败,去掉 `-o`)。

- [ ] **Step 5: 后端测试(非 label 保持绿)**
```bash
mvn -q test 2>&1 | tail -25
```
Expected: BUILD SUCCESS;Link/Enum/User Admin 等测试通过(LabelControllerTest 已删)。若某测试因 DevDataSeeder 签名变化失败,按实际修正其装配。

- [ ] **Step 6: Commit(后端仓库)**
```bash
git add -A
git commit -m "refactor: 删除 label 子系统(实体/服务/仓库/两控制器/DTO/测试)+ DevDataSeeder 去 label seeding

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 后端 — V2 drop_label 迁移

**Files (backend):** Create `src/main/resources/db/migration/mariadb/V2__drop_label.sql`, `src/main/resources/db/migration/oracle/V2__drop_label.sql`

- [ ] **Step 1: mariadb 迁移**

`src/main/resources/db/migration/mariadb/V2__drop_label.sql`:
```sql
-- label 子系统已移除(链接名内联、分类名来自枚举);删除冗余的 i18n 标签表。
DROP TABLE IF EXISTS label;
```

- [ ] **Step 2: oracle 迁移(守卫忽略 ORA-00942)**

`src/main/resources/db/migration/oracle/V2__drop_label.sql`:
```sql
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE label';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -942 THEN RAISE; END IF;
END;
/
```

- [ ] **Step 3: 打包(校验迁移可被 Flyway 读取,语法无误)**
```bash
cd /home/shane/Code/cim-portal/cim-portal-server/backend
mvn -q -DskipTests package 2>&1 | tail -15
```
Expected: BUILD SUCCESS;`target/portal.jar`(或既有产物名)生成。

- [ ] **Step 4: Commit(后端仓库)**
```bash
git add -A
git commit -m "feat(db): V2__drop_label 迁移(mariadb+oracle)删除 label 表

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 应用迁移(重启后端)+ DB 验证

- [ ] **Step 1: 停旧后端、起新(dev,应用 V2)**
```bash
cd /home/shane/Code/cim-portal/cim-portal-server/backend
fuser -k 8080/tcp 2>/dev/null; sleep 2
SPRING_PROFILES_ACTIVE=dev nohup java -jar target/portal.jar >/tmp/be.log 2>&1 &
for i in $(seq 1 40); do curl -s -o /dev/null http://localhost:8080/actuator/health 2>/dev/null && break; curl -s -o /dev/null "http://localhost:8080/dev/token?employeeId=ADMIN1" && break; sleep 1; done
grep -iE "flyway|V2|drop|migrat" /tmp/be.log | tail -10
```
Expected: 启动日志显示 Flyway 迁移到 V2;无错误。

- [ ] **Step 2: DB 验证 — label 表已删、其余完好**
```bash
mariadb -h127.0.0.1 -P3306 -ucim_portal -pcim_portal cim_portal -e "SHOW TABLES;"
mariadb -h127.0.0.1 -P3306 -ucim_portal -pcim_portal cim_portal -e "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
mariadb -h127.0.0.1 -P3306 -ucim_portal -pcim_portal cim_portal -e "SELECT COUNT(*) AS links FROM link; SELECT COUNT(*) AS enums FROM enum_value;"
```
Expected: `SHOW TABLES` 无 `label`;flyway 历史含 V2 success=1;link/enum 计数不变(数据完好)。

- [ ] **Step 3: 端点验证 — label 端点 404、门户正常**
```bash
T=$(curl -s "http://localhost:8080/dev/token?employeeId=ADMIN1" | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
echo "i18n labels:"; curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/api/i18n/labels
echo "admin labels:"; curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $T" http://localhost:8080/api/admin/labels
echo "home (categories+links ok?):"; curl -s http://localhost:8080/api/portal/home -H "Authorization: Bearer $T" | python3 -c "import sys,json;d=json.load(sys.stdin);print('cats',len(d['categories']),'sample cat',d['categories'][0].get('categoryCode'),'sample link',d['categories'][0]['links'][0]['nameZh'])"
```
Expected: `/api/i18n/labels` → 404;`/api/admin/labels` → 404;home 返回分类(含 categoryCode/Label)+ 链接名正常。

- [ ] **Step 4: Commit** — 无代码改动(纯运行验证);跳过。

---

## Task 5: 前端联动冒烟 + 全量收尾

- [ ] **Step 1: 前端全量门禁** — `cd /home/shane/Code/cim-portal/cim-portal-frontend && npm run verify` → typecheck 干净;44 测试绿;build OK。

- [ ] **Step 2: 运行冒烟(前端 dev + 后端 dev 已起)**

`npm run dev`(:5173)→ 登录 OP1/ADMIN1 → 首页分类名(MES/制造执行 等)+ 链接名正常显示;切换 EN/中 语言生效;DevTools Network **无** `/api/i18n/labels` 请求;`/admin` 侧栏**无**「标签」项,链接管理正常。停止:`fuser -k 5173/tcp`。

- [ ] **Step 3: Commit(若有小修)** — 无改动跳过。

---

## 自检清单(Self-Review)

**规格覆盖(spec §3/§4/§5/§6):** 前端删 getLabels/类型/hydrate + store 改名 + 去「标签」项 → Task 1;后端删 label 包/测试 + DevDataSeeder → Task 2;V2 迁移 → Task 3;DB 删表 + 端点 404 验证 → Task 4;前端冒烟 + 全量 → Task 5。保留项(语言切换、enums 分类名、内联链接名)在 Task 1(store 保留 setLocale/initLocale)+ Task 4 Step 3(home 正常)复核。

**占位符扫描:** 无 TBD;DevDataSeeder 改动为「读后按实际删除 label 相关行」(其内容因未逐行读取,给出明确移除清单:import/字段/构造参数/`labels.` 语句);其余均给出确切代码/命令。

**类型/命名一致性:** 前端 `useLocaleStore`(`stores/locale.ts`,id `'locale'`,导出 `setLocale`/`initLocale`)在 store/AppHeader/bootstrap 一致;AppHeader 用 `localeStore` 实例名避免与 useI18n 的 `locale` 冲突;router 不再引用该 store。后端删除 `com.cimportal.label.*` 后无残留引用(Task 2 Step 4 grep 校验)。迁移版本 `V2__drop_label`(mariadb+oracle)。**硬约束**(前端 44 测试、后端非 label 测试)在 Task 1/2/5 复测。
