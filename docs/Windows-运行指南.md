# AP1 IT CIM Portal — Windows 环境搭建与运行指南

本指南介绍在 **Windows** 上从零搭建开发环境并运行整套系统(后端 + 前端)。

## 0. 项目组成

| 模块 | 目录 | 技术栈 | 监听端口 |
|---|---|---|---|
| 后端 | `cim-portal-server/backend` | Spring Boot 3.3 · JDK 21 · MariaDB · Flyway | `8080` |
| 前端 | `cim-portal-client` | Vue 3 · Vite · TypeScript | `5173` |
| 数据库 | — | MariaDB 11/12 | `3306` |

---

## 1. 前置软件(逐个安装)

| 软件 | 版本 | 下载 | 说明 |
|---|---|---|---|
| **Node.js** | LTS ≥ 20 | <https://nodejs.org> | 自带 `npm`(前端用) |
| **JDK** | **21**(Temurin) | <https://adoptium.net> | 安装后配置 `JAVA_HOME` |
| **Maven** | ≥ 3.9 | <https://maven.apache.org/download.cgi> | 本仓库未带 `mvnw`,需自行安装并加入 `PATH` |
| **MariaDB** | 11 或 12 | <https://mariadb.org/download> | 也可用 Docker Desktop 运行 |
| **Git** | 最新 | <https://git-scm.com> | 拉取代码 |

**配置环境变量(系统属性 → 环境变量):**

- `JAVA_HOME` = JDK 安装目录(如 `C:\Program Files\Eclipse Adoptium\jdk-21`)
- 在 `Path` 追加:`%JAVA_HOME%\bin`、Maven 的 `bin` 目录、Node 安装目录

验证(新开 PowerShell):

```powershell
node -v      # v20+.
npm -v
java -version  # 21
mvn -v       # 3.9+
```

---

## 2. 数据库(MariaDB)

1. 安装并启动 MariaDB 服务(安装向导会注册为 Windows 服务;也可在“服务”里启动 `MariaDB`)。
2. 用 `mysql` 命令行或 HeidiSQL 执行(创建库与开发账号):

```sql
CREATE DATABASE cim_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER 'cim_portal'@'localhost' IDENTIFIED BY 'cim_portal';
GRANT ALL PRIVILEGES ON cim_portal.* TO 'cim_portal'@'localhost';
FLUSH PRIVILEGES;
```

> 开发(`dev`)环境的数据库连接已写死为 `127.0.0.1:3306/cim_portal`,账号/密码均为 `cim_portal`。**无需手工建表** —— 后端启动时 Flyway 会自动建表并执行迁移。

---

## 3. 后端(Spring Boot)

目录:`cim-portal-server\backend`

**打包:**

```powershell
cd cim-portal-server\backend
mvn -DskipTests package      # 产物:target\portal.jar
```

**运行(dev 配置):**

PowerShell:
```powershell
$env:SPRING_PROFILES_ACTIVE = "dev"
java -jar target\portal.jar
```

CMD:
```cmd
set SPRING_PROFILES_ACTIVE=dev && java -jar target\portal.jar
```

启动成功后:

- 服务地址:<http://localhost:8080>
- 健康检查:<http://localhost:8080/actuator/health>
- 接口文档(Swagger):<http://localhost:8080/swagger-ui.html>
- 开发登录:`dev` 用 `dev-jwt` 模式,前端登录页直接“选择身份”(如 `ADMIN1`)即可;其底层调用 `GET http://localhost:8080/dev/token?employeeId=ADMIN1` 获取测试令牌。

> 也可不打包直接源码运行:`mvn spring-boot:run "-Dspring-boot.run.profiles=dev"`。
>
> 仓库通过 `.githooks/post-checkout` 按分支自动切换 profile(dev/uat/prod);本地手动运行时用上面的 `SPRING_PROFILES_ACTIVE=dev` 即可。

---

## 4. 前端(Vue + Vite)

目录:`cim-portal-client`

```powershell
cd cim-portal-client
npm install        # 首次安装依赖
npm run dev        # 开发服务器 → http://localhost:5173
```

- Vite 已配置代理:`/api` 与 `/dev` 自动转发到 `http://localhost:8080`,因此**本地开发无需额外配置后端地址**。
- 浏览器打开 <http://localhost:5173>,在登录页选择身份进入。

**构建生产包:**

```powershell
npm run build      # 产物:dist\(纯静态文件)
```

- `dist\` 用任意静态服务器或 Nginx 托管即可。
- 若前端与后端**不同源**部署:需设置环境变量 `VITE_API_BASE_URL` 指向后端地址(构建时注入),并在后端对应 profile 的 `app.cors.allowed-origins` 中加入前端域名。

**本地校验(类型检查 + 单元测试 + 构建):**

```powershell
npm run verify
```

---

## 5. 完整启动顺序

1. 启动 **MariaDB** 服务。
2. 启动**后端**:`cd cim-portal-server\backend` →(首次)`mvn -DskipTests package` → 设置 `SPRING_PROFILES_ACTIVE=dev` → `java -jar target\portal.jar` → 等待日志出现 `Started ... on port 8080`。
3. 启动**前端**:`cd cim-portal-client` →(首次)`npm install` → `npm run dev`。
4. 浏览器打开 <http://localhost:5173>,选择身份(如 `ADMIN1`)登录。

---

## 6. 常见问题

| 现象 | 排查 |
|---|---|
| `mvn` / `java` / `node` 不是可识别命令 | 对应软件未安装或未加入 `PATH`,重装后重开终端 |
| 后端启动报数据库连接 / Flyway 失败 | 确认 MariaDB 已启动,且库 `cim_portal`、账号/密码 `cim_portal/cim_portal` 已按第 2 节创建 |
| 端口被占用(8080/5173/3306) | `netstat -ano | findstr :8080` 查 PID,`taskkill /PID <PID> /F` 释放,或修改对应端口 |
| 前端能打开但接口 401/跨域 | 确认后端已在 `8080` 运行;开发模式走 Vite 代理通常无需 CORS |
| `JAVA_HOME` 指向了 JDK 8/17 | 必须为 **JDK 21**;重设 `JAVA_HOME` 后重开终端 |

---

## 7. 切换到 Oracle 数据库

后端已内置 Oracle 支持(`ojdbc11` 驱动 + `flyway-database-oracle` + `db/migration/oracle` 下的 V1–V4 迁移),并提供 **`oracle-dev`** profile:它等于 `dev`(dev-jwt 登录、`/dev/token`、自动种子)**叠加** `oracle-db`(把数据源与 Flyway 目录覆盖为 Oracle)。即:在 Oracle 上获得与本地 `dev` 完全一致的调试体验(无需配置 SSO/OIDC)。

> 仅用于本地/调试。真实 UAT/生产的 Oracle + 单点登录请用 `uat`/`prod` profile(OIDC)。

### 7.1 连接到你的 Oracle

设置环境变量指向你的 Oracle,用 `oracle-dev` profile 启动后端:

PowerShell:
```powershell
cd cim-portal-server\backend
$env:SPRING_PROFILES_ACTIVE = "oracle-dev"
$env:DB_URL      = "jdbc:oracle:thin:@//<主机>:1521/<服务名>"   # 例:jdbc:oracle:thin:@//localhost:1521/XEPDB1
$env:DB_USER     = "cim_portal"
$env:DB_PASSWORD = "你的密码"
java -jar target\portal.jar
```

- URL 用 **EZConnect** 格式 `jdbc:oracle:thin:@//主机:端口/服务名`;若用 SID:`jdbc:oracle:thin:@主机:端口:SID`。
- 不设环境变量时的默认值:`jdbc:oracle:thin:@//localhost:1521/XEPDB1`,账号/密码 `cim_portal/cim_portal`。
- `ojdbc11` 驱动已内置,无需手动安装。
- 该 Oracle 账号需有建表权限(`CREATE TABLE/SEQUENCE` 等);Flyway 会在该用户 schema 下建表。

### 7.2 导入全部测试数据(自动,无需手工 SQL)

**首次**用 `oracle-dev` 启动、且目标 schema 为空时,会自动完成两件事:

1. **Flyway** 执行 `db/migration/oracle` 的 V1–V4,建好所有表(`enum_value` / `link` / `link_access_grant` / `user_info`)。
2. **DevDataSeeder** 插入全部测试数据:**12 条枚举、4 个用户(ADMIN1/OP1/ENG1/QA1)、7 条链接(含「SPC 分析」DEV/UAT/RELEASE 三套环境)、4 条授权**。

也就是说:把后端指向**空的** Oracle 库并启动一次,表结构与测试数据就全部导入好了。

验证(SQL\*Plus / SQL Developer,以 `cim_portal` 账号连接):
```sql
SELECT COUNT(*) FROM link;        -- 期望 7
SELECT COUNT(*) FROM enum_value;  -- 期望 12
SELECT COUNT(*) FROM user_info;   -- 期望 4
SELECT name_zh, environment FROM link ORDER BY sort_order;
```

### 7.3 重新导入 / 重置数据

种子只在表为空时执行(`if count == 0`)。需要重新导入时,清空数据后重启即可重新种入:
```sql
DELETE FROM link_access_grant; DELETE FROM link; DELETE FROM enum_value; DELETE FROM user_info; COMMIT;
```
若想连表结构一起重建:删除该 schema 下所有对象(含 `flyway_schema_history` 表),重启后端 → Flyway 重新建表 + 种子重新导入。

### 7.4 登录与前端

`oracle-dev` 仍是 **dev-jwt** 模式:前端登录页直接「选择身份」(如 `ADMIN1`)即可,与 MariaDB 的 `dev` 完全一致。**前端无需任何改动**,照常 `npm run dev`(经 Vite 代理访问 `http://localhost:8080`)。

