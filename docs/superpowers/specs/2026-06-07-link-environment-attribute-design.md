# 链接环境属性(纠正版)设计

**日期:** 2026-06-07
**状态:** 设计已确认(用户 ok),进入实现计划
**背景:** 上一轮把"环境"误实现为**单链接多 URL(urlDev/uat/release)+ 一卡片三彩色按钮**。**纠正**:每个环境是**独立链接**(各自单 URL、各自卡片),链接带一个**环境属性**(DEV/UAT/RELEASE 或无),以彩色徽章区分。`code` 移除与品牌改名正确,**保留**。跨 `cim-portal-client` + `cim-portal-server`(dev)。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 模型 | 链接 = 单 `url`(必填)+ 可选 `environment`(DEV/UAT/RELEASE 或无)。同系统不同环境 = 多条独立链接;无需区分 = 单链接无环境。 |
| 环境展示 | 卡片上**彩色环境徽章**(DEV 灰 / UAT 琥珀 / RELEASE 绿);无环境则不显示徽章。 |
| 环境枚举 | **固定** DEV/UAT/RELEASE(前端常量 + 后端 Java 枚举 `LinkEnv`)。 |
| 迁移 | V3 已应用到 dev 库 → **前向新增 V4** 纠正(不改已应用的 V3)。 |

## 2. 现状(纠正前,需回退)

- 后端 `Link`:有 `urlDev/urlUat/urlRelease`(可空)、`url`(可空);`LinkRequest`(class)`@AssertTrue isValidUrlConfig` 互斥校验;`LinkResponse`/`HomeLink` 含三 env url。Flyway V3 已 drop code + url 可空 + 加三 url 列(**已应用 dev 库 + 已推送**);`OracleMigrationTest` 断言数=3。`DevDataSeeder` 含 2+3 个多 url 环境感知链接 + MAINTENANCE 分类。
- 前端 `types.ts`/`admin.ts`:HomeLink/AdminLink/LinkInput 含 `url?/urlDev?/urlUat?/urlRelease?`;`constants.ts` `LINK_ENVS`(field+btn 颜色);`SystemCard` 环境感知渲染三按钮、emit `blocked:{link,url}`;`SystemGrid` pending `{link,url}`;`LinkFormModal` `envAware` 开关 + 三 url 字段;i18n `admin.linkForm.envAware/urlDevLabel/urlUatLabel/urlReleaseLabel`。
- dev 库:3 条链接经 SQL 设为多 url 环境感知(url 空)。

## 3. 后端纠正

**`Link`**:删 `urlDev/urlUat/urlRelease`;`url` 改回 `nullable=false`(必填);加 `@Enumerated(EnumType.STRING) @Column(name="environment", length=16) private LinkEnv environment;`(可空)。新增枚举 `com.cimportal.link.LinkEnv { DEV, UAT, RELEASE }`。构造器保持单 url;environment 经 setter。

**`LinkRequest`**:由 class 改回 record;`@NotBlank String url`;加 `LinkEnv environment`(可空,Jackson 反序列化非法值 → 400);删 env url 字段与 `@AssertTrue`。

**`LinkResponse`/`HomeLink`**:删 env url,加 `LinkEnv environment`(序列化为字符串)。映射处同步。

**Flyway V4**(`db/migration/{mariadb,oracle}/V4__link_env_attribute.sql`):
- mariadb:
  ```sql
  UPDATE link SET url = COALESCE(url, url_release, url_uat, url_dev) WHERE url IS NULL;
  ALTER TABLE link DROP COLUMN url_dev, DROP COLUMN url_uat, DROP COLUMN url_release;
  ALTER TABLE link ADD COLUMN environment VARCHAR(16) NULL;
  ALTER TABLE link MODIFY url VARCHAR(1024) NOT NULL;
  ```
- oracle:
  ```sql
  UPDATE link SET url = COALESCE(url, url_release, url_uat, url_dev) WHERE url IS NULL;
  ALTER TABLE link DROP (url_dev, url_uat, url_release);
  ALTER TABLE link ADD (environment VARCHAR2(16));
  ALTER TABLE link MODIFY (url VARCHAR2(1024) NOT NULL);
  ```
- `OracleMigrationTest` 断言 3 → **4**。

**`DevDataSeeder`**:回退多 url 写法;改为**每环境独立链接**——示范一个系统三条(同名 "SPC 分析",environment DEV/UAT/RELEASE,各自 url)+ 普通无环境链接若干。env 链接可无授权(对所有人可见)以便演示。

## 4. 前端纠正

- **`types.ts`/`admin.ts`**:HomeLink/AdminLink/LinkInput 删 `urlDev/urlUat/urlRelease`;`url` 改必有(`url: string`);加 `environment?: 'DEV' | 'UAT' | 'RELEASE'`。
- **`constants.ts`**:`LINK_ENVS` 改为环境→徽章色映射:`{ DEV: { label:'DEV', badge:'…slate' }, UAT: {…amber}, RELEASE: {…emerald} }`(或数组 `[{key,label,badge}]`)。删 `field`/`btn`(按钮)。
- **`SystemCard.vue`**:回退为单 `<a :href="link.url">` 整卡可点(原 `onClick` 单 url、emit `blocked:[HomeLink]`);头部状态行旁加 `<Badge v-if="link.environment" :class env 色">{{ link.environment }}</Badge>`(或用现 `Badge` 组件 + 环境色)。去三按钮逻辑、去 `· code`(已无)。
- **`SystemGrid.vue`**:`onBlocked(link)` / `pending: HomeLink`(回退 `{link,url}`);`proceed` 用 `pending.url`。
- **`LinkFormModal.vue`**:删 `envAware` 开关 + 三 url 字段;`url` 单字段必填(回退);加 `environment` `Select`(选项:无/DEV/UAT/RELEASE),保存写 `environment`(无 → undefined/null)。
- **`LinksAdminView.vue`**:行内加环境徽章(若有)。
- **i18n**:删 `admin.linkForm.envAware/urlDevLabel/urlUatLabel/urlReleaseLabel`;加 `admin.linkForm.environmentLabel`(环境/Environment)+ `common.none`(无/None)用于 Select 空选项。环境名 DEV/UAT/RELEASE 字面(不入目录)。

## 5. 测试

- **后端**:V4 在测试容器应用(V1→V4);`OracleMigrationTest` 数=4;`LinkAdminControllerTest`/`HomeIntegrationTest`/`LinkTestFactory` 回退(单 url + 可选 environment);删互斥校验测试,**新增**:创建带 `environment=UAT` 链接 201 且响应回显;非法 environment 值 → 400;`url` 缺失 → 400。`DevDataSeederTest` 计数更新(按新种子)。
- **前端**:`SystemCard` 有 environment 渲染彩色徽章、无则不渲染;`LinkFormModal` environment Select 选值 → payload `environment`;回退多 url 相关测试/夹具。i18n 键对齐。
- 双端门禁:前端 `npm run verify`、后端 `mvn -q test`。

## 6. dev 库处理

V4 启动应用:回填 3 条 SQL-环境链接的 `url`(= release url)、删三 url 列、加 environment、url NOT NULL → 它们变为普通无环境链接。随后**冒烟前** SQL 设若干现有链接 `environment`('DEV'/'UAT'/'RELEASE')演示徽章(种子仅对空库生效)。

## 7. 实现分解(一个纠正 spec/plan)

1. **后端**:LinkEnv 枚举 + Link/DTO 回退+environment + V4 双库 + OracleMigrationTest + 映射 + 种子(每环境独立链接)+ 测试回退/新增。
2. **前端**:types/constants/SystemCard/SystemGrid/LinkFormModal/LinksAdminView/i18n 回退+environment 徽章/Select + 测试回退/新增。
3. **验证**:双端门禁 + 重启 dev 后端(V4 应用,确认列)+ SQL 设演示环境 + 运行冒烟(同系统多环境为多卡片各带彩色徽章;无环境链接无徽章;表单环境下拉;改名/去 code 保持)。

## 8. 不在范围内(YAGNI)

环境作可管理 EnumCategory;环境特定授权/状态(仍链接级);同系统多环境的自动分组/折叠(各为独立卡片即可);历史 url_dev/uat/release 数据保留(V4 回填 url 后丢弃)。
