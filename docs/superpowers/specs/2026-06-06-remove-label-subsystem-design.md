# 移除 label 子系统(前端 + 后端 + 数据库)设计

**日期:** 2026-06-06
**状态:** 设计已确认,待用户审阅 → 实现计划
**背景:** 链接名称已用内联 `name_zh/name_en` 直接维护,`label` 子系统(i18n 字符串映射)冗余,决定整体移除。跨三处:前端 `cim-portal-frontend`、后端 `cim-portal-server/backend`、`cim_portal` MariaDB。

## 1. 依赖图(已核查)

- **`label` 表(7 行,列 `label_key/type/text_zh/text_en`)只服务 `/api/i18n/labels`**(`LabelI18nController` → `LabelService.i18nMap()`),前端 `labels` store 把它灌进 vue-i18n 的 messages。
- **但前端无任何组件用 `t('key')`**(组件用硬编码中文 + `pick()`;`AppHeader`/`HeroPanel` 仅用 `useI18n` 取 `locale`)。故该 i18n 映射**形同虚设,移除不改变任何可见文案**。
- **分类名**来自 `enum_value`(`LINK_CATEGORY`,`HomeService` 使用)——不依赖 `label`。
- **链接名**为 `link.name_zh/name_en` 内联——不依赖 `label`。
- **语言切换**(zh/en)也在 `labels` store(`setLocale`/`initLocale`,被 `AppHeader`+`bootstrap` 使用)——**必须保留**。
- 后端引用 `label` 处:`com/cimportal/label/*`、`DevDataSeeder`(注入 `LabelRepository` 并 seed 7 行)、测试 `label/LabelControllerTest`。Flyway:`V1__schema.sql`(mariadb+oracle)建 `label` 表;无 SQL seed(seed 在 `DevDataSeeder`)。

## 2. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 范围 | **整体移除**:前端 + 后端 + DB(三处一致清理)。 |
| DB | **新增 `V2__drop_label.sql`(mariadb+oracle)`DROP TABLE label`**,非破坏性(保留 links/enums/grants/users + 已 seed 数据);后端重建重启时 Flyway 应用。V1 仍历史性建表(迁移只追加)。 |
| 语言切换 | 保留;`labels` store 改名为 `locale` store(只留 `setLocale`/`initLocale`)。 |

## 3. 前端改动(cim-portal-frontend)

- **删除** `src/lib/api/i18n.ts`(`getLabels`)。
- **`src/lib/api/types.ts`**:删 `LabelEntry`、`LabelMap`。
- **`src/stores/labels.ts` → 重命名 `src/stores/locale.ts`**,导出 `useLocaleStore`(`defineStore('locale', …)`),仅保留 `setLocale(l)`、`initLocale()`;删除 `hydrate`、`loaded`、`getLabels`/`LabelMap` 导入与 vue-i18n `setLocaleMessage` 调用。
- **`src/features/dashboard/AppHeader.vue`**:`useLabelsStore`→`useLocaleStore`(`import` 路径与变量名相应改);`labels.setLocale(...)`→`locale store 实例.setLocale(...)`(行为不变)。
- **`src/bootstrap.ts`**:`useLabelsStore().initLocale()`→`useLocaleStore().initLocale()`。
- **`src/router/index.ts`**:删除 `const labels = useLabelsStore()` 与 `if (!labels.loaded) { await labels.hydrate() }` 整块;删 `useLabelsStore` import(其余守卫:requireAuth/requireAdmin/hydrateUser 不变)。
- **`src/features/admin/AdminLayout.vue`**:删除 `标签`(`/admin/labels`,`Tags`)导航项 + `Tags` 图标 import(P2b 仅剩枚举)。
- 测试:无 `labels.spec`;确保既有 44 测试保持绿(`vue-i18n` messages 仍为空 `{}`,无组件用 `t()` 故无影响)。

## 4. 后端改动(cim-portal-server/backend)

- **删除目录** `src/main/java/com/cimportal/label/`:`Label.java`、`LabelService.java`、`LabelRepository.java`、`LabelI18nController.java`、`LabelAdminController.java`、`dto/`(`LabelRequest`、`LabelResponse`)。
- **删除测试** `src/test/java/com/cimportal/label/LabelControllerTest.java`。
- **`src/main/java/com/cimportal/seed/DevDataSeeder.java`**:删 `import ...LabelRepository`、字段 `private final LabelRepository labels`、构造参数,以及所有 label seeding 语句;其余 seed(links/enums/grants/users)不动。
- **新增迁移**:
  - `src/main/resources/db/migration/mariadb/V2__drop_label.sql`:`DROP TABLE IF EXISTS label;`
  - `src/main/resources/db/migration/oracle/V2__drop_label.sql`:PL/SQL 守卫 drop(忽略 ORA-00942 表不存在):
    ```sql
    BEGIN EXECUTE IMMEDIATE 'DROP TABLE label'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
    /
    ```
- 确认无其它引用(`HomeService` 用 enums;grep `LabelService/LabelRepository/i18nMap` 仅 label 包 + DevDataSeeder)。
- 构建 + 测试:`mvn`(java/mvn 已在 PATH);既有非 label 测试(Link/Enum/User Admin)保持绿。

## 5. 数据库(cim_portal MariaDB)

- 由 `V2__drop_label.sql` 在后端重建重启时删除 `label` 表(Flyway 自动)。应用方式:重新 `mvn package` 后重启后端(`fuser -k 8080/tcp` 或按 PID;**勿 `pkill -f portal.jar`**),用 `SPRING_PROFILES_ACTIVE=dev`。
- 验证:`SHOW TABLES` 无 `label`;`flyway_schema_history` 含 V2。

## 6. 验证

- **前端**:`npm run verify`(typecheck+test+build)绿;`npm run dev` 登录后门户首页 + 管理链接正常;语言 zh/en 切换正常;Network 无 `/api/i18n/labels` 请求;`/admin` 侧栏无「标签」项。
- **后端**:`mvn test` 绿;dev 启动 Flyway 应用 V2;`GET /api/i18n/labels` → 404、`GET /api/admin/labels` → 404;`GET /api/portal/home`(ADMIN1/OP1)分类名 + 链接名正常。
- **DB**:`label` 表已删,其余表/数据完好。

## 7. 不在范围内(YAGNI)

i18n 字符串映射的替代(无组件使用,无需替代);链接名编辑(已是内联,已具备);重置数据库(用非破坏性 V2 drop);编辑 V1(迁移只追加);P2b 标签管理(随 label 一并取消,P2b 仅剩枚举)。
