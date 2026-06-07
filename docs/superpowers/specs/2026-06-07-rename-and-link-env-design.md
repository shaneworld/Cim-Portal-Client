# 品牌改名 + 链接模型改造(去 code + 多环境 URL)设计

**日期:** 2026-06-07
**状态:** 设计已确认,进入实现计划
**背景:** 两项需求一并完成:(1)品牌 `CIM Portal` → `AP1 IT CIM Portal`;(2)链接模型:**移除无用的 `code` 字段**;为需要的链接加 **DEV/UAT/RELEASE 多环境 URL**(彩色按钮区分),并兼容**无需环境区分的单 URL 链接**。跨 `cim-portal-client`(前端)+ `cim-portal-server`(后端 `dev`)。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 品牌名 | `AP1 IT CIM Portal`(en)/ `AP1 IT CIM 门户`(zh)。 |
| 移除 | 链接 `code` 字段(如 `mes-wip`),含列/唯一约束/DTO/表单/卡片副标题/种子。 |
| 多环境 | 每链接可选 `urlDev`/`urlUat`/`urlRelease`;**环境感知 = 三者全有**(`url` 空);否则**单 URL**(`url` 有、三者空)。二者**互斥**。 |
| 环境 UI | 系统卡每环境一枚**彩色按钮**(DEV 灰 / UAT 琥珀 / RELEASE 绿);单 URL 链接一枚普通按钮。 |
| 环境枚举 | 前端**固定常量** `LINK_ENVS`(键 + 颜色);后端仅 3 个 URL 列,无 EnumCategory。 |
| 存储 | `link` 表加列(非子表)。 |

## 2. 现状(已核对)

- 后端 `Link`(`com.cimportal.link`):`code`(NOT NULL,唯一约束 `uk_link_code`)、`url`(NOT NULL 1024)、nameZh/En、icon、categoryCode、statusCode、sortOrder、openInNewTab、时间戳。`LinkRequest`(`@NotBlank code`、`@NotBlank url`、…)、`LinkResponse`(含 code/url)、`GrantResponse/GrantRequest/GrantsReplaceRequest`(grants 按 linkId,不涉 code)。Flyway 现 V1(建表含 code+uk)、V2(drop label)。`DevDataSeeder` 以 `new Link(code, …)` 建种子。`OracleMigrationTest` 断言迁移数=2。
- 前端 `HomeLink`/`AdminLink`/`LinkInput`(types.ts)含 `code`;`SystemCard.vue` 为单 `<a :href=url>`,显示 `… · {{ link.code }}`,非 ACTIVE 触发 `blocked` → `SystemGrid` 弹确认后 `window.open`;`LinkFormModal.vue` 有 `code`(编辑时只读)+ `url` 字段;`LinksAdminView.vue` 行显示 `code` 副标题。
- 测试引用 `code`:后端 `LinkAdminControllerTest`/`HomeIntegrationTest`/`LinkTestFactory`;前端 `admin.spec`/`LinksAdminView.spec`/`LinkFormModal.spec`/`SystemCard` 相关 + MSW 夹具。

## 3. Part 1 — 改名

- `src/lib/i18n/locales/zh.ts` `brand.title` → `AP1 IT CIM 门户`;`en.ts` → `AP1 IT CIM Portal`;`auth.login.title`(两 locale)同步(现为 `CIM 门户`/`CIM Portal`)。
- `src-tauri/tauri.conf.json`:`productName` `CIM Portal` → `AP1 IT CIM Portal`;窗口 `title` `CIM 门户` → `AP1 IT CIM 门户`(或 `AP1 IT CIM Portal`,统一用后者英文标题)。
- `src-tauri/README.md` 标题中的 CIM Portal → AP1 IT CIM Portal。
- 测试 `i18n.spec.ts` 解析断言更新为新值。

## 4. Part 2 — 后端模型

**`Link` 实体**:
- 删 `code` 字段/getter/setter/构造参数,删表注解里的 `uniqueConstraints`。
- `url` 改可空(`@Column(length=1024)`,去 nullable=false)。
- 加 `@Column(name="url_dev",length=1024) String urlDev;` 同理 `urlUat`、`urlRelease` + getters/setters。
- 构造器:`Link(nameZh,nameEn,url,icon,categoryCode,statusCode,sortOrder,openInNewTab)`(单 URL);env URL 经 setter 设置(或加一个全参构造器)。

**DTO**:
- `LinkRequest`:删 `code`;`url` 去 `@NotBlank`(改可空 String);加 `urlDev/urlUat/urlRelease`(可空);加校验方法
  ```java
  @AssertTrue(message = "需提供单 URL,或同时提供 DEV/UAT/RELEASE 三个环境 URL")
  public boolean isValidUrlConfig() {
      boolean envAll = notBlank(urlDev) && notBlank(urlUat) && notBlank(urlRelease);
      boolean envNone = blank(urlDev) && blank(urlUat) && blank(urlRelease);
      boolean single = notBlank(url);
      return (single && envNone) || (!single && envAll);
  }
  ```
- `LinkResponse`:删 `code`,加 `urlDev/urlUat/urlRelease`。
- `HomeLink`(门户首页 DTO,`com.cimportal.portal`):删 `code`,加 3 个 env url(读 `HomeController`/`HomeResponse` 实际结构后改)。

**Flyway V3**(`db/migration/{mariadb,oracle}/V3__link_drop_code_add_env_urls.sql`):
- mariadb:`ALTER TABLE link DROP INDEX uk_link_code;` → `ALTER TABLE link DROP COLUMN code;` → `ALTER TABLE link MODIFY url VARCHAR(1024) NULL;` → `ALTER TABLE link ADD COLUMN url_dev VARCHAR(1024) NULL, ADD COLUMN url_uat VARCHAR(1024) NULL, ADD COLUMN url_release VARCHAR(1024) NULL;`(实现期读 V1 确认约束/列名。)
- oracle:`ALTER TABLE link DROP CONSTRAINT uk_link_code;` → `DROP COLUMN code;` → `MODIFY (url VARCHAR2(1024) NULL);` → `ADD (url_dev VARCHAR2(1024), url_uat VARCHAR2(1024), url_release VARCHAR2(1024));`。
- `OracleMigrationTest` 断言迁移数 2 → **3**。

**`DevDataSeeder`**:去 `code` 入参;多数链接单 URL;**示范 1–2 个环境感知链接**(设 urlDev/uat/release,url 留空)。

## 5. Part 2 — 前端

- **`types.ts`**:`HomeLink`/`AdminLink` 删 `code`,加 `url?: string; urlDev?: string; urlUat?: string; urlRelease?: string`;`LinkInput` 同(删 code)。
- **`constants.ts`**:`export const LINK_ENVS = [{ key:'dev', field:'urlDev', label:'DEV', dot:'bg-slate-500', btn:'…gray classes' }, { key:'uat', field:'urlUat', label:'UAT', …amber }, { key:'release', field:'urlRelease', label:'RELEASE', …green }] as const`(颜色 Tailwind 类;DEV 灰/UAT 琥珀/RELEASE 绿)。
- **`SystemCard.vue`**:计算 `envButtons = LINK_ENVS.filter(e => link[e.field])`。若 `envButtons.length`(环境感知)→ 头部(icon+名+状态,去 `· code`)+ 一行彩色按钮(每环境一枚,文案 `e.label`,色 `e.btn`);否则单按钮(原 `link.url`)。点击:ACTIVE → 打开对应 URL(`openInNewTab`);非 ACTIVE → 走维护/停用确认(`blocked` 事件携带目标 URL,`SystemGrid.proceed` 打开携带的 URL)。`pick(name)`/状态文案不变。
- **`LinkFormModal.vue`**:删 `code` 字段;加 `envAware` 开关(Switch,`admin.linkForm.envAware`)。关 → 单 `url` 字段;开 → `urlDev/urlUat/urlRelease` 三个**必填**字段。保存:envAware 则提交三 env url(url 空)、否则提交 url(env 空)。编辑回填:`envAware = !!link.urlDev`。校验对应。
- **`LinksAdminView.vue`**:删行内 `code` 副标题(只留名;分类/状态列已在)。
- **i18n**:`admin.linkForm` 加 `envAware`、`urlDevLabel`/`urlUatLabel`/`urlReleaseLabel`(如 `URL · DEV`)。环境名 DEV/UAT/RELEASE 作为按钮文案保持字面(不入目录)。键对齐维持。

## 6. 测试

- **后端**:V3 在测试容器 Flyway 应用(HomeIntegrationTest 等启动即验);`OracleMigrationTest` 数=3;`LinkAdminControllerTest`/`LinkTestFactory`/`HomeIntegrationTest` 去 `code`、`new Link(...)` 新签名;**新增校验测试**(单 URL 通过、三 env 通过、部分/两者皆有→400)。`HomeIntegrationTest` 断言返回含 env url、无 code。
- **前端**:`SystemCard` 环境感知渲染 3 彩色按钮、单 URL 渲染 1 按钮;`LinkFormModal` envAware 开关切换字段、保存 payload 正确;`LinksAdminView`/`admin.spec`/MSW 夹具去 code、加 env url 字段。键对齐测试更新(brand 改名)。
- 双端全绿为门禁;前端 `npm run verify`、后端 `mvn -q test`。

## 7. 实现分解(一个 spec/plan)

1. **改名**(前端 i18n + tauri.conf + README + i18n.spec)。
2. **后端**:Link 实体 + V3 迁移(双库)+ DTO/校验 + HomeLink + DevDataSeeder + OracleMigrationTest + 后端测试更新/新增。
3. **前端**:types + constants(LINK_ENVS)+ i18n + SystemCard + LinkFormModal + LinksAdminView + 前端测试/夹具更新。
4. **验证**:双端门禁 + 重启 dev 后端(V3 应用)+ 运行冒烟(环境感知系统显示三彩色按钮并各自打开;改名生效;表单切换;删 code 无残留)。

## 8. 不在范围内(YAGNI)

环境作为可管理 EnumCategory;每环境独立状态/授权(状态/授权仍链接级);env URL 数 ≠3;链接 code 的任何保留;历史 code 数据迁移(直接 drop)。
