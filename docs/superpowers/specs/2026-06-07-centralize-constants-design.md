# 常量集中化(前端 + 后端)设计

**日期:** 2026-06-07
**状态:** 设计已确认,进入实现计划
**背景:** 魔法字面量散落两端(localStorage key、电话、分页数值、状态/授权码;后端 profile 名、角色、TTL、安全路径)。本期把**核心跨切面常量**集中:前端单文件 `src/constants.ts`,后端单类 `AppConstants`。**行为保持不变**(同值替换)。i18n 文本翻译为**另一子项目**(下一轮)。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 范围 | **核心跨切面字面量**:集中散落的 key/电话/分页数值/状态码/授权码(前端);profile/角色/TTL/安全路径(后端)。**已有类型归属者不重复**(TS `EnumCategory`、Java `EnumCategory`/`GrantType` 枚举、router 路由表、`app.cors.*` 配置)。 |
| 顺序 | 常量先行;i18n(~193 串、23 文件)下一子项目。 |

## 2. 现状(已核对)

- 前端散落:`stores/auth.ts` `'cimp.token'`、`stores/locale.ts` `'cimp.locale'`、`lib/theme/useTheme.ts` `'cimp.theme'`;`SupportBar.vue` `39100`;`rowsPerPage = ref(10)`(Links/Enums 视图)、`useResponsivePageSize(el,out,rowHeight=64,min=5)`;`SystemCard.vue` 状态码 `ACTIVE/MAINTENANCE/DEPRECATED`;`LinkFormModal.vue` `grantTypeOpts` 值 `DEPARTMENT/ROLE`。无集中常量文件。
- 后端散落:`SecurityConfig` `hasRole("PORTAL_ADMIN")`、`"/dev/token"`、`"/api/admin/**"`、`@Profile({"dev","test"})`;`CurrentUser` `ADMIN_ROLE_CODE="PORTAL_ADMIN"`;`DevDataSeeder` `@Profile({"dev","uat"})`;`DevTokenController` `@Profile("dev")`、`plus(12, ChronoUnit.HOURS)`。无 `AppConstants`(有 `CorsProperties`/`OpenApiConfig`)。
- 测试:前端 65、后端 25(均需保持绿)。

## 3. 前端:`src/constants.ts`(新)

```ts
/** 集中跨切面常量(非展示文本——文本由 i18n 负责)。 */

export const STORAGE_KEYS = {
  token: 'cimp.token',
  locale: 'cimp.locale',
  theme: 'cimp.theme',
} as const

export const SUPPORT_PHONE = '39100'

// 分页/列表布局
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_ROW_HEIGHT_PX = 64 // 对应行的 Tailwind 类 `h-16`(改其一须同步另一)
export const MIN_PAGE_ROWS = 5

// 链接状态码(状态驱动的 UI 逻辑用;展示文本另由 i18n)
export const LINK_STATUS = { ACTIVE: 'ACTIVE', MAINTENANCE: 'MAINTENANCE', DEPRECATED: 'DEPRECATED' } as const

// 授权类型码
export const GRANT_TYPES = { DEPARTMENT: 'DEPARTMENT', ROLE: 'ROLE' } as const
```

**替换点:**
- `stores/auth.ts`:`const KEY = 'cimp.token'` → `STORAGE_KEYS.token`(直接用,删局部 KEY)。
- `stores/locale.ts`:`'cimp.locale'` → `STORAGE_KEYS.locale`。
- `lib/theme/useTheme.ts`:`const KEY = 'cimp.theme'` → `STORAGE_KEYS.theme`。
- `lib/ui/SupportBar.vue`:模板 `39100` → `{{ SUPPORT_PHONE }}`(`<script setup>` import)。
- `lib/composables/useResponsivePageSize.ts`:默认参数 `rowHeight = PAGE_ROW_HEIGHT_PX`、`min = MIN_PAGE_ROWS`(import 常量)。
- `features/admin/links/LinksAdminView.vue`、`features/admin/enums/EnumsAdminView.vue`:`ref(10)` → `ref(DEFAULT_PAGE_SIZE)`。
- `features/dashboard/SystemCard.vue`:`'ACTIVE'/'MAINTENANCE'/'DEPRECATED'` 比较 → `LINK_STATUS.*`。
- `features/admin/links/LinkFormModal.vue`:`grantTypeOpts` 的 `value: 'DEPARTMENT'/'ROLE'` → `GRANT_TYPES.*`(`label` 中文保留,留待 i18n)。

## 4. 后端:`com.cimportal.common.AppConstants`(新)

```java
package com.cimportal.common;

public final class AppConstants {
    private AppConstants() {}

    public static final class Profiles {
        public static final String DEV = "dev";
        public static final String UAT = "uat";
        public static final String PROD = "prod";
        public static final String TEST = "test";
        private Profiles() {}
    }

    public static final class Roles {
        public static final String PORTAL_ADMIN = "PORTAL_ADMIN";
        private Roles() {}
    }

    public static final class Paths {
        public static final String DEV_TOKEN = "/dev/token";
        public static final String ADMIN_API = "/api/admin/**";
        private Paths() {}
    }

    public static final class DevToken {
        public static final long TTL_HOURS = 12;
        private DevToken() {}
    }
}
```
(包 `com.cimportal.common`——`OpenApiConfig` 在 `com.cimportal.common.config`,沿用该顶包。)

**替换点:**
- `SecurityConfig`:`hasRole("PORTAL_ADMIN")` → `hasRole(AppConstants.Roles.PORTAL_ADMIN)`;`"/dev/token"` → `AppConstants.Paths.DEV_TOKEN`;`"/api/admin/**"` → `AppConstants.Paths.ADMIN_API`;`@Profile({"dev","test"})` → `@Profile({AppConstants.Profiles.DEV, AppConstants.Profiles.TEST})`(常量为编译期常量表达式,注解可用)。
- `CurrentUser`:`ADMIN_ROLE_CODE = "PORTAL_ADMIN"` → `= AppConstants.Roles.PORTAL_ADMIN`(单一来源)。
- `DevDataSeeder`:`@Profile({"dev","uat"})` → `@Profile({AppConstants.Profiles.DEV, AppConstants.Profiles.UAT})`。
- `DevTokenController`:`@Profile("dev")` → `@Profile(AppConstants.Profiles.DEV)`;`plus(12, ChronoUnit.HOURS)` → `plus(AppConstants.DevToken.TTL_HOURS, ChronoUnit.HOURS)`。

**不动:** 框架路径(`/actuator/health`、swagger)保留内联;`EnumCategory`/`GrantType` Java 枚举;`app.cors.*` 配置。

## 5. 测试 / 验证(行为不变)

- **同值替换**,无运行时行为变化 → 既有 **65 前端 + 25 后端**测试保持绿即为门禁。
- 前端:`npm run verify`(typecheck + 65 测试 + build)。可加轻量 `constants.spec.ts` 断言 `STORAGE_KEYS.token==='cimp.token'` 等(锁值,防误改)。
- 后端:`cd backend && mvn -q test`(25 绿;@Profile 常量解析为原字符串,profile 行为不变)。
- 重点验证:登录后 token 仍存 `cimp.token`(key 不变);分页默认 10;dev-token 仍 12h;`/api/admin/**` 仍需 PORTAL_ADMIN。

## 6. 不在范围内(YAGNI / 后续)

i18n 文本翻译(zh/en 目录 + `t()` 扫描,~193 串)——下一子项目;route 路径/env key 集中(maximal,本期不做);框架健康/swagger 路径常量化;前端 `EnumCategory`/后端枚举重构。
