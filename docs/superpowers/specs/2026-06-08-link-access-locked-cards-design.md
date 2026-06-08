# 权限:无权链接显示为「锁定卡片」(可见不可开) 设计

**日期:** 2026-06-08
**状态:** 设计已确认(用户 "looks right"),进入实现计划
**背景:** 当前链接授权(`link_access_grant` 的 DEPARTMENT/ROLE)用于**可见性过滤**——`/api/portal/home` 仅返回当前用户有权的链接(无授权=所有人可见;有授权=仅匹配 dept/role 的用户可见)。**新需求:** 无权用户**仍能看到**链接卡片,但**无法打开**;以视觉(置灰 + 锁图标 + 提示)标识锁定态。即授权从「可见性过滤」改为「打开权限闸门」——所有启用链接对所有人可见,无权者显示为锁定卡。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 行为 | 所有启用链接对所有人可见;授权决定「谁能**打开**」;无权链接渲染为锁定卡(不再过滤掉) |
| 锁定强制 | **服务端隐藏目标**:无权链接的 `url`/`downloadUrl` 返回 `null`,真实地址不出服务端 → 锁是真锁(非装饰) |
| 锁定标识 | 卡片置灰 + 锁图标 + 状态行显示「无权限」+ 悬停 tooltip「无权限,请联系管理员」;点击无任何动作 |
| 优先级 | 锁定为**硬阻断**,优先于维护/停用的「仍要打开」确认与启动应用逻辑 |
| 范围 | 全局规则;无 per-link「完全隐藏 vs 锁定」开关;无管理员绕过(访问仍纯按 dept/role 授权) |

## 2. 后端(`HomeService` + `HomeLink`)

- `HomeService.resolveFor`:**不再** `continue` 跳过无权链接;改为对每个链接计算 `accessible = PermissionResolver.isVisible(dept, role, grants)`(该方法语义现等于「是否有访问权」,沿用不改名),**始终加入**结果。
  - `accessible == true`:`HomeLink(... url, ..., downloadUrl, accessible=true)`(同现状)。
  - `accessible == false`:`HomeLink(... url=null, ..., downloadUrl=null, accessible=false)`(隐藏目标)。
- `HomeLink` record 加 `boolean accessible`(置于末位);`url`/`downloadUrl` 允许为 null(record String 字段本就可空)。
- 分类分组、排序、统计不变(锁定链接照常计入、照常分组显示)。
- **无 DB / Flyway 改动**(授权表不动)。`PermissionResolver` 逻辑不变(仍判 dept/role 是否匹配 grants;无 grants → true)。
- `HomeIntegrationTest` 更新:断言**返回全部启用链接**;某用户对其无权的 dept/role 限定链接 → `accessible:false` 且 `url` 为 null;无授权链接 → `accessible:true` 且 `url` 非空;链接总数不随用户/授权变化。

## 3. 前端(`SystemCard` / `SystemGrid` / 类型 / i18n)

- **类型** `src/lib/api/types.ts` `HomeLink`:加 `accessible: boolean`;`url` 改为可空 `url?: string`(锁定时 null);`downloadUrl?` 已可空。
- **`SystemCard.vue`**:`const locked = computed(() => !props.link.accessible)`。
  - `<a>` 的 `:href` 仅在非锁定时设(锁定时不设 href);加 `:class` 锁定态(`opacity-60 cursor-not-allowed`)、`:title="locked ? t('dashboard.noAccessHint') : undefined"`、`:aria-disabled="locked"`。
  - `onClick(e)`:**锁定时 `e.preventDefault(); return`(无动作)**;否则维持既有逻辑(launchApp → `launchOrDownload`;非 ACTIVE → `emit('blocked')`;普通 → 跳转)。
  - 状态行:`v-if="locked"` 显示 `<Lock class="size-3.5"/> {{ t('dashboard.noAccess') }}`(锁图标 lucide `Lock`,中性/静音色);`v-else` 维持 `StatusDot + statusText`。
  - env / APP 徽章在锁定卡仍渲染(仅元数据,无碍)。
- **`SystemGrid.vue`**:锁定卡不触发 `blocked`(SystemCard 已拦截);确认/打开流程不变。
- **i18n** `{zh,en}.ts` `dashboard`:加 `noAccess`(zh `无权限` / en `No access`)、`noAccessHint`(zh `无权限,请联系管理员` / en `No access — contact your administrator`)。键对齐。

## 4. 测试

- **后端**:`HomeIntegrationTest`——所有启用链接均返回;无权链接 `accessible:false` + `url` 为 null;有权/无授权链接 `accessible:true` + `url` 非空;总数不受授权影响。
- **前端(Vitest)**:`SystemGrid`/`SystemCard`——锁定链接(`accessible:false`)渲染锁图标 + 「无权限」+ tooltip(`title`)、置灰、点击不 `emit('blocked')`/不导航;可访问链接(`accessible:true`)照常打开/启动。夹具补 `accessible` 字段。i18n 键对齐。

## 5. 范围(YAGNI)

全局规则(无 per-link 完全隐藏开关);锁定链接仍计入「系统」统计与搜索(它们可见);无管理员全量绕过(如需另立)。

## 6. 实现分解

1. **后端**:`HomeService`(计算 accessible + 锁定置空 url/downloadUrl)+ `HomeLink`(加 accessible)+ `HomeIntegrationTest`。
2. **前端**:`types`(accessible + url?)+ `SystemCard`(锁定态:置灰/锁图标/无权限/tooltip/拦截点击)+ `SystemGrid` + i18n + 测试。
3. **验证**:双端门禁 + 运行冒烟(以无权用户登录见锁定卡不可点、有 tooltip;有权用户照常打开;后端 home 返回全部 + accessible 正确、锁定无 url)。
