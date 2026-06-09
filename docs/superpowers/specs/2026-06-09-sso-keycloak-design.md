# SSO(OIDC/Keycloak)+ 内部账号登录 + 管理端 SSO 配置 设计

**日期:** 2026-06-09
**状态:** 设计已确认(用户批准),进入实现计划
**背景:** 门户为纯浏览器 Vue SPA + 无状态 OAuth2 Resource Server 后端(校验 Bearer JWT)。需求:(1)内部账号登录——工号 + 初始密码,作为 SSO 失败/不可用时的回退;(2)SSO——认证成功后直接进入系统;(3)管理端新增 SSO 相关配置项。用 **Keycloak** 开发/测试(公司 SSO 与 Keycloak 一致),后续替换为真实 SSO。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| OIDC 流程位置 | **前端 SPA**:Authorization Code + **PKCE**(public client,oidc-client-ts)→ 拿 access token → 以 Bearer 调既有无状态后端 |
| 内部账号 | **全局统一「初始密码」**(管理端可配,BCrypt 存储);内部登录 = 有效启用工号 + 该密码;无 per-user 密码、无强制改密 |
| 登录 UX | **SSO 默认且自动发起**;仅当 SSO 失败/禁用时显示内部登录页(带「用 SSO 登录」重试按钮);会话级标志防重定向回环 |
| 后端校验 | **双签发方**:portal-internal(`iss: cim-portal`,门户自签)+ SSO/Keycloak(`iss: <配置 issuer>`);按 `iss` 路由的委派 JwtDecoder |
| 配置存储 | DB 单行 `security_setting`;公开 `/api/portal/config` 暴露非敏感 SSO 客户端参数;管理端 `/api/admin/security-settings` 读写 |

## 2. 认证架构 — 双签发方,单 Resource Server

后端保持无状态 Bearer 模型,但接受**两个** JWT 签发方,按 `iss` 路由(委派 `JwtDecoder`):

- **portal-internal**(`iss=cim-portal`):门户自有 RSA 私钥签名;由内部登录端点与既有 `/dev/token` 签发;用门户公钥校验(并校验 `iss=cim-portal`)。
- **SSO/Keycloak**(`iss=<配置 sso_issuer_uri>`):用 IdP 的 JWKS 校验(`NimbusJwtDecoder.withIssuerLocation(issuer)`,内含 iss 校验 + JWKS 拉取);按当前 DB issuer **惰性构建 + issuer 变更时重建**。
- 未知 `iss` → 拒绝(`BadJwtException`)。
- **门户签名密钥**:`PortalJwtKeys` 组件——配置提供 PEM(`app.security.portal-jwt.private-key`/`public-key`,uat/prod)则解析;否则生成(dev/test,重启失效可接受;非 dev 启动 WARN)。`JwtEncoder`/portal `JwtDecoder` 提升为**全部 profile**(内部登录在所有环境可用)。
- **委派解码器** `MultiIssuerJwtDecoder implements JwtDecoder`:用 `JWTParser` 不验签读取 `iss` → `cim-portal` 走 portalDecoder;等于当前 `SecuritySettingService.ssoIssuer()` 走 ssoDecoder(缓存,issuer 变更重建);其余抛错。Resource server 配置 `.jwt(jwt -> jwt.decoder(multiIssuer).jwtAuthenticationConverter(authoritiesConverter))`。
- **工号映射**:`UserInfoAuthoritiesConverter` / `CurrentUser` 解析 employeeId = `jwt.getClaimAsString(usernameClaim)`(配置项,默认 `preferred_username`),为空则回退 `jwt.getSubject()`。portal-internal token 用 `sub=employeeId`(无 preferred_username)→ 回退 sub。SSO 用户必须存在于 `user_info`(否则无角色/部门 → 视为未授权)。角色/部门仍来自 `user_info`(不从 SSO claim 映射)。

## 3. 数据模型 + API

**`security_setting`(单行,id=1):** `sso_enabled`(bool 默认 false)、`sso_issuer_uri`(可空)、`sso_client_id`(可空)、`sso_scopes`(默认 `openid profile`)、`sso_username_claim`(默认 `preferred_username`)、`internal_password_hash`(可空,BCrypt)、`updated_at`。
- Flyway **V6**(mariadb + oracle):建表 + 插入默认行(sso 关、`internal_password_hash` = dev 默认初始密码的 BCrypt,如 `cimp@123`)。`OracleMigrationTest` 数 5→6。
- 实体 `SecuritySetting` + repo;`SecuritySettingService`(加载/缓存单行;`ssoIssuer()` 供解码器路由;`updateXxx` 写入,密码明文 → BCrypt)。
- **公开** `GET /api/portal/config`(permitAll)→ `{ ssoEnabled, authority, clientId, scopes, usernameClaim }`(无任何密钥/hash)。SPA 启动时读取以配置 OIDC 客户端 + 决定是否自动跳 SSO。
- **管理** `GET/PUT /api/admin/security-settings`(PORTAL_ADMIN):读全部(**不含** hash);PUT 接受 `{ ssoEnabled, issuerUri, clientId, scopes, usernameClaim, initialPassword? }`,`initialPassword` 为明文(给则 BCrypt 存储,**响应不回显**)。运行时生效(前端读实时;后端 issuer 变更触发 SSO 解码器重建)。

**内部登录** `POST /api/auth/login`(permitAll)`{ employeeId, password }`:
- 校验 `user_info` 存在 + active + `password` 经 BCrypt 匹配 `internal_password_hash` → 签发 portal-internal JWT(`sub=employeeId`,`iss=cim-portal`,TTL 同 dev)→ `{ access_token, token_type }`(与 `/dev/token` 同形)。
- 失败统一 401(`INVALID_CREDENTIALS`,不区分「无此人/密码错」)。无强制改密。

**安全白名单(permitAll):** `/actuator/health`、swagger、`/dev/token`、`/api/portal/config`、`/api/auth/login`。其余 authenticated;`/api/admin/**` 需 PORTAL_ADMIN(不变)。

## 4. 前端

- 依赖:`oidc-client-ts`。
- **配置 bootstrap**:应用启动(auth 决策前)`GET /api/portal/config` → 存入 config store(pinia)。
- **SSO 模块** `src/lib/auth/sso.ts`:`UserManager`(authority、client_id、`redirect_uri = origin + '/auth/callback'`、`response_type='code'`、scope、PKCE 默认开)。函数 `startSso()`(`signinRedirect`)、`completeSso()`(`signinRedirectCallback` → 返回 access_token)。
- **路由**:加 `/auth/callback`(public)→ `CallbackView`:`completeSso()` → 成功 `auth.setToken(token)` + `hydrateUser()` → `/`;失败 → 置会话标志 `sso_failed` → `/login`。
- **登录流程**(`src/lib/auth` provider 重构 + 路由守卫/LoginView):
  - 未认证且 `ssoEnabled` 且无 `sso_failed`(sessionStorage)→ `startSso()`(自动跳;已有 IdP 会话则秒回 = 直接进入)。
  - `ssoEnabled=false` 或已 `sso_failed` → 显示**内部登录页**(工号 + 密码 表单)+「用 SSO 登录」按钮(清标志 + `startSso`)。
- **`LoginView` 重构**:内部表单(工号 + 密码)→ `auth.loginInternal(employeeId, password)`(`POST /api/auth/login`)→ 存 token → `/`;SSO 按钮。**移除** dev 身份快选列表(dev 改用内部登录 + 种子初始密码;`/dev/token` 仅留后端测试用)。`auth` store 加 `loginInternal`;`createAuthProvider` 简化为内部登录 provider(SSO 走 sso.ts)。
- **管理端 Security/SSO UI**:新视图 `/admin/security`——表单:SSO 开关、issuer URI、client ID、scopes、username claim、设置初始密码(write-only)。`GET/PUT /api/admin/security-settings`。侧栏加「安全 / Security」项。
- **i18n**:`auth.login.*`(内部表单:employeeId/password/signIn/ssoButton/ssoFailed)、`admin.security.*`(各字段标签 + 初始密码 + 保存)。键对齐。
- api client `onUnauthorized` 既有(401 清 token → /login),不变。

## 5. 开发/测试:Keycloak(Docker)

- 跑 Keycloak:`docker run -p 8081:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:26.0 start-dev`(8080 留给后端)。
- 经 admin REST/控制台建:realm `cim`;public client `cim-portal-spa`(standard flow on、PKCE S256、redirect `http://localhost:5173/auth/callback`、web origins `+`/`http://localhost:5173`);用户 `ADMIN1`(username=ADMIN1,设密码,enabled)——username 即映射 `user_info.employee_id`。
- 设 `security_setting`:`sso_enabled=true`、`sso_issuer_uri=http://localhost:8081/realms/cim`、`sso_client_id=cim-portal-spa`、`sso_username_claim=preferred_username`(经管理 API 或 SQL)。
- 端到端验证:SSO 往返登录(SPA→Keycloak→callback→token iss=keycloak→后端 JWKS 校验→进入,ADMIN1=PORTAL_ADMIN);内部登录回退(关 SSO 或制造失败 → 工号+初始密码);管理端改 SSO 配置生效。产出可复现的 setup 文档(便于后续替换真实 SSO 的 issuer/clientId)。

## 6. 测试

- **后端**:`security_setting` 迁移(V6 双库,OracleMigrationTest=6);`/api/portal/config` permitAll 返回非敏感字段、不含 hash;`/api/admin/security-settings` GET/PUT(PORTAL_ADMIN;非 admin 403;PUT 不回显 hash;initialPassword BCrypt 存储);`/api/auth/login`(正确凭据→token、错误→401、停用用户→401);`MultiIssuerJwtDecoder`(portal token 通过、未知 iss 拒绝);既有测试 token 工厂补 `iss=cim-portal`。SSO/Keycloak 端到端属手动/容器验证(单测不连真 IdP;可对 issuer-location 解码逻辑做轻量测试或留集成验证)。
- **前端(Vitest)**:config bootstrap;LoginView 内部表单提交 → `loginInternal`;SSO 禁用/失败时显示内部页、启用时触发 `startSso`(mock sso 模块);`/auth/callback` 成功存 token、失败置标志去 /login;admin Security 表单读写 payload(含 initialPassword write-only)。i18n 键对齐。`oidc-client-ts` 在测试中 mock。

## 7. 范围(YAGNI)

per-user 密码/改密/强制轮换;SSO 单点登出/后端通道登出(后续);SSO claim → 角色映射(角色仍来自 user_info);refresh token 轮换(用 oidc-client-ts 默认)。

## 8. 实现分解(一个 spec,多任务计划)

1. **后端 A — 配置基础**:`security_setting` 表 + V6 双库 + 实体/repo/service + 管理 API(`/api/admin/security-settings`)+ 公开 `/api/portal/config`。
2. **后端 B — 多签发方 + 内部登录**:`PortalJwtKeys`(全 profile)+ token 加 `iss=cim-portal`(dev-token + 内部登录)+ `MultiIssuerJwtDecoder`(portal + 动态 Keycloak)+ `/api/auth/login` + claim 映射;安全白名单更新;测试。
3. **前端**:`oidc-client-ts` + config bootstrap + `sso.ts` + `/auth/callback` + 登录流程重构(SSO 默认/内部回退)+ `LoginView` 重构 + 管理端 Security/SSO UI + i18n + 测试。
4. **E2E**:Keycloak 容器 + realm/client/user + 接线 + 全流程验证 + 可复现 setup 文档。
