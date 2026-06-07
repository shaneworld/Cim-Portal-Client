# 常量集中化(前端 + 后端)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把核心跨切面魔法字面量集中:前端 `src/constants.ts`、后端 `com.cimportal.common.AppConstants`,并将散落引用替换为常量。**行为完全不变**(同值)。

**Architecture:** 新增两个常量持有处(前端单文件、后端单类含嵌套静态组),逐处替换字面量;不改运行时行为;已有类型归属者(枚举/router/cors 配置)不动。

**Tech Stack:** Vue 3 + TS(前端)、Spring Boot/Java 21(后端)。

**契约/现状(已核对):** spec `docs/superpowers/specs/2026-06-07-centralize-constants-design.md`。前端 `stores/auth.ts`(`const KEY='cimp.token'`)、`stores/locale.ts`(`'cimp.locale'`)、`lib/theme/useTheme.ts`(`const KEY='cimp.theme'`)、`lib/ui/SupportBar.vue`(模板含 `39100`)、`lib/composables/useResponsivePageSize.ts`(`rowHeight=64,min=5` 默认参 + `computeRows`)、`features/admin/links/LinksAdminView.vue` & `features/admin/enums/EnumsAdminView.vue`(`const rowsPerPage = ref(10)`)、`features/dashboard/SystemCard.vue`(状态码比较)、`features/admin/links/LinkFormModal.vue`(`grantTypeOpts` 值 `'DEPARTMENT'/'ROLE'`)。后端 `auth/SecurityConfig.java`、`auth/CurrentUser.java`(`ADMIN_ROLE_CODE`)、`seed/DevDataSeeder.java`、`auth/dev/DevTokenController.java`;包顶 `com.cimportal`,已有 `com.cimportal.common.config.OpenApiConfig`。**硬约束:前端 65 测试 + 后端 25 测试保持绿;无运行时行为变化(key/TTL/role/profile/分页默认值不变)。** 前端仓库 `/home/shane/Code/cim-portal/cim-portal-client`(分支 `dev`,新建 `centralize-constants`);后端仓库 `/home/shane/Code/cim-portal/cim-portal-server` 模块 `backend/`(分支 `dev`,直接提交)。门禁:前端 `npm run verify`、后端 `cd backend && mvn -q test`。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## 文件结构

```
# 前端
src/constants.ts                              # T1 新
src/constants.spec.ts                         # T1 新(值锁)
src/stores/auth.ts / stores/locale.ts         # T2
src/lib/theme/useTheme.ts                     # T2
src/lib/ui/SupportBar.vue                      # T2
src/lib/composables/useResponsivePageSize.ts   # T2
src/features/admin/links/LinksAdminView.vue    # T2
src/features/admin/enums/EnumsAdminView.vue    # T2
src/features/dashboard/SystemCard.vue          # T2
src/features/admin/links/LinkFormModal.vue     # T2
# 后端
backend/src/main/java/com/cimportal/common/AppConstants.java  # T3 新
backend/.../auth/SecurityConfig.java / CurrentUser.java        # T4
backend/.../seed/DevDataSeeder.java                            # T4
backend/.../auth/dev/DevTokenController.java                   # T4
```

---

## Task 1: 前端 constants.ts + 值锁测试

**Files:** Create `src/constants.ts`, `src/constants.spec.ts`

- [ ] **Step 1: 创建 `src/constants.ts`**
```ts
/** 集中跨切面常量(非展示文本——文本由 i18n 负责)。 */

export const STORAGE_KEYS = {
  token: 'cimp.token',
  locale: 'cimp.locale',
  theme: 'cimp.theme',
} as const

export const SUPPORT_PHONE = '39100'

// 分页 / 列表布局
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_ROW_HEIGHT_PX = 64 // 对应行的 Tailwind 类 `h-16`(改其一须同步另一)
export const MIN_PAGE_ROWS = 5

// 链接状态码(状态驱动 UI 逻辑用;展示文本由 i18n)
export const LINK_STATUS = { ACTIVE: 'ACTIVE', MAINTENANCE: 'MAINTENANCE', DEPRECATED: 'DEPRECATED' } as const

// 授权类型码
export const GRANT_TYPES = { DEPARTMENT: 'DEPARTMENT', ROLE: 'ROLE' } as const
```

- [ ] **Step 2: 值锁测试 `src/constants.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { STORAGE_KEYS, SUPPORT_PHONE, DEFAULT_PAGE_SIZE, PAGE_ROW_HEIGHT_PX, MIN_PAGE_ROWS, LINK_STATUS, GRANT_TYPES } from './constants'

describe('constants', () => {
  it('值不变(防误改)', () => {
    expect(STORAGE_KEYS).toEqual({ token: 'cimp.token', locale: 'cimp.locale', theme: 'cimp.theme' })
    expect(SUPPORT_PHONE).toBe('39100')
    expect([DEFAULT_PAGE_SIZE, PAGE_ROW_HEIGHT_PX, MIN_PAGE_ROWS]).toEqual([10, 64, 5])
    expect(LINK_STATUS).toEqual({ ACTIVE: 'ACTIVE', MAINTENANCE: 'MAINTENANCE', DEPRECATED: 'DEPRECATED' })
    expect(GRANT_TYPES).toEqual({ DEPARTMENT: 'DEPARTMENT', ROLE: 'ROLE' })
  })
})
```

- [ ] **Step 3: 运行 + typecheck** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm test -- constants && npm run typecheck` → PASS(1),typecheck 干净。

- [ ] **Step 4: Commit**
```bash
git add src/constants.ts src/constants.spec.ts
git commit -m "feat(constants): 新增 src/constants.ts(storage key/电话/分页/状态/授权码)+ 值锁测试

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 前端替换散落字面量

**Files:** Modify `src/stores/auth.ts`, `src/stores/locale.ts`, `src/lib/theme/useTheme.ts`, `src/lib/ui/SupportBar.vue`, `src/lib/composables/useResponsivePageSize.ts`, `src/features/admin/links/LinksAdminView.vue`, `src/features/admin/enums/EnumsAdminView.vue`, `src/features/dashboard/SystemCard.vue`, `src/features/admin/links/LinkFormModal.vue`

> 逐文件 Read 后改;均为同值替换。

- [ ] **Step 1: `stores/auth.ts`** — `import { STORAGE_KEYS } from '@/constants'`;删 `const KEY = 'cimp.token'`;将用到 `KEY` 处改 `STORAGE_KEYS.token`。

- [ ] **Step 2: `stores/locale.ts`** — `import { STORAGE_KEYS } from '@/constants'`;`'cimp.locale'`(get/set 各处)→ `STORAGE_KEYS.locale`。

- [ ] **Step 3: `lib/theme/useTheme.ts`** — `import { STORAGE_KEYS } from '@/constants'`;删 `const KEY = 'cimp.theme'`;用 `STORAGE_KEYS.theme`。

- [ ] **Step 4: `lib/ui/SupportBar.vue`** — `<script setup>` 加 `import { SUPPORT_PHONE } from '@/constants'`;模板 `<b ...>39100</b>` → `<b ...>{{ SUPPORT_PHONE }}</b>`。

- [ ] **Step 5: `lib/composables/useResponsivePageSize.ts`** — `import { PAGE_ROW_HEIGHT_PX, MIN_PAGE_ROWS } from '@/constants'`;函数默认参 `rowHeight = 64` → `rowHeight = PAGE_ROW_HEIGHT_PX`、`min = 5` → `min = MIN_PAGE_ROWS`(`computeRows` 仍接收数字参,签名不变)。

- [ ] **Step 6: `LinksAdminView.vue` + `EnumsAdminView.vue`** — 各 `import { DEFAULT_PAGE_SIZE } from '@/constants'`;`const rowsPerPage = ref(10)` → `ref(DEFAULT_PAGE_SIZE)`。

- [ ] **Step 7: `features/dashboard/SystemCard.vue`** — `import { LINK_STATUS } from '@/constants'`;状态比较 `'ACTIVE'/'MAINTENANCE'/'DEPRECATED'` → `LINK_STATUS.ACTIVE/MAINTENANCE/DEPRECATED`(Read 确认具体表达式,如 `status === 'DEPRECATED'`、`status === 'MAINTENANCE'` 的告警/停用逻辑)。

- [ ] **Step 8: `LinkFormModal.vue`** — `import { GRANT_TYPES } from '@/constants'`;`grantTypeOpts` 中 `value: 'DEPARTMENT'` → `value: GRANT_TYPES.DEPARTMENT`、`value: 'ROLE'` → `GRANT_TYPES.ROLE`(`label` 中文不动)。

- [ ] **Step 9: 全量门禁** — `npm run typecheck && npm test && npm run build` → typecheck 干净;**66 测试绿**(既有 65 + constants 1);build OK。重点:无行为变化(token 仍存 `cimp.token`、分页默认 10、状态 UI 不变)。

- [ ] **Step 10: Commit**
```bash
git add src/stores/auth.ts src/stores/locale.ts src/lib/theme/useTheme.ts src/lib/ui/SupportBar.vue src/lib/composables/useResponsivePageSize.ts src/features/admin/links/LinksAdminView.vue src/features/admin/enums/EnumsAdminView.vue src/features/dashboard/SystemCard.vue src/features/admin/links/LinkFormModal.vue
git commit -m "refactor(constants): 散落字面量改用 src/constants(storage/电话/分页/状态/授权码,行为不变)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 后端 AppConstants

**Files:** Create `backend/src/main/java/com/cimportal/common/AppConstants.java`

- [ ] **Step 1: 创建 `AppConstants.java`**(内容见 spec §4)。包 `com.cimportal.common`。

- [ ] **Step 2: 编译** — `cd /home/shane/Code/cim-portal/cim-portal-server/backend && mvn -q compile 2>&1 | tail -5` → BUILD SUCCESS。

- [ ] **Step 3: Commit**
```bash
cd /home/shane/Code/cim-portal/cim-portal-server
git add backend/src/main/java/com/cimportal/common/AppConstants.java
git commit -m "feat(common): AppConstants(Profiles/Roles/Paths/DevToken 集中常量)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 后端替换散落字面量

**Files:** Modify `backend/.../auth/SecurityConfig.java`, `auth/CurrentUser.java`, `seed/DevDataSeeder.java`, `auth/dev/DevTokenController.java`

> 逐文件 Read 后改;均同值替换。各文件 import `com.cimportal.common.AppConstants`(或静态内嵌)。

- [ ] **Step 1: `SecurityConfig.java`** — import `AppConstants`;`requestMatchers(..., "/dev/token")` 中 `"/dev/token"` → `AppConstants.Paths.DEV_TOKEN`;`requestMatchers("/api/admin/**")` → `AppConstants.Paths.ADMIN_API`;`hasRole("PORTAL_ADMIN")` → `hasRole(AppConstants.Roles.PORTAL_ADMIN)`;三处 `@Profile({"dev", "test"})` → `@Profile({AppConstants.Profiles.DEV, AppConstants.Profiles.TEST})`。(框架路径 `/actuator/health`、swagger 内联不动。)

- [ ] **Step 2: `CurrentUser.java`** — import;`ADMIN_ROLE_CODE = "PORTAL_ADMIN"` → `= AppConstants.Roles.PORTAL_ADMIN`(保持 `public static final String`)。

- [ ] **Step 3: `DevDataSeeder.java`** — import;`@Profile({"dev", "uat"})` → `@Profile({AppConstants.Profiles.DEV, AppConstants.Profiles.UAT})`。

- [ ] **Step 4: `DevTokenController.java`** — import;`@Profile("dev")` → `@Profile(AppConstants.Profiles.DEV)`;`plus(12, ChronoUnit.HOURS)` → `plus(AppConstants.DevToken.TTL_HOURS, ChronoUnit.HOURS)`(`TTL_HOURS` 为 `long`,`plus(long,TemporalUnit)` 匹配)。

- [ ] **Step 5: 全量门禁** — `cd /home/shane/Code/cim-portal/cim-portal-server/backend && mvn -q test 2>&1 | tail -20` → BUILD SUCCESS,**25 测试绿**(@Profile 常量解析为原字符串 → profile 行为不变;CorsConfigTest 等通过)。

- [ ] **Step 6: Commit**
```bash
cd /home/shane/Code/cim-portal/cim-portal-server
git add backend/src/main/java/com/cimportal/auth/SecurityConfig.java backend/src/main/java/com/cimportal/auth/CurrentUser.java backend/src/main/java/com/cimportal/seed/DevDataSeeder.java backend/src/main/java/com/cimportal/auth/dev/DevTokenController.java
git commit -m "refactor(constants): 后端 profile/角色/路径/TTL 字面量改用 AppConstants(行为不变)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 收尾验证

- [ ] **Step 1: 前端** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify 2>&1 | grep -E 'Tests |✓ built' | tail -2` → 66 绿、build OK。
- [ ] **Step 2: 后端** — `cd /home/shane/Code/cim-portal/cim-portal-server/backend && mvn -q test 2>&1 | grep -E 'Tests run:|BUILD' | tail -3` → 25 绿、BUILD SUCCESS。
- [ ] **Step 3: 残留字面量复核** — `grep -rn "'cimp\.\|39100\|hasRole(\"PORTAL_ADMIN\"\|@Profile({\"dev\"" <两仓 src>` 确认核心字面量已无散落(枚举/router/cors/框架路径除外)。
- [ ] **Step 4: 汇报** — 行为不变;前端 66 / 后端 25 绿。

---

## 自检清单(Self-Review)

**规格覆盖(spec §3/§4/§5):** 前端 constants.ts + 值锁 → T1;前端 9 文件替换 → T2;后端 AppConstants → T3;后端 4 文件替换 → T4;双端门禁 + 残留复核 → T5。已有类型归属者不动(枚举/router/cors/框架路径)→ 贯穿。

**占位符扫描:** 无 TBD;常量内容完整;替换点逐文件点名(SystemCard/SecurityConfig 等以「Read 确认具体表达式」标注——同值替换,语义固定)。

**类型/命名一致性:** 前端 `STORAGE_KEYS`/`SUPPORT_PHONE`/`DEFAULT_PAGE_SIZE`/`PAGE_ROW_HEIGHT_PX`/`MIN_PAGE_ROWS`/`LINK_STATUS`/`GRANT_TYPES` 在 constants.ts 定义 ↔ 各消费文件 import 一致;后端 `AppConstants.{Profiles,Roles,Paths,DevToken}` 字段名 ↔ 各替换点一致;`@Profile` 用常量(编译期常量表达式合法)。**硬约束**(66/25 测试绿、行为不变、@Profile 解析原值)在 T2/T4/T5 复验。
