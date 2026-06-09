# SSO(OIDC/Keycloak)+ 内部登录 + 管理端 SSO 配置 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development(推荐)或 superpowers:executing-plans。Steps use checkbox (`- [ ]`).

**Goal:** 前端 PKCE 接 Keycloak SSO(认证成功直接进入);SSO 失败/禁用回退到内部账号登录(工号 + 全局初始密码);管理端可配 SSO。后端无状态 Resource Server 接受双签发方(portal-internal + Keycloak)。

**Architecture:** 后端按 `iss` 路由的委派 JwtDecoder(portal 自签 + 动态 Keycloak JWKS);`security_setting` 单行存 SSO 配置 + 初始密码 hash;前端 oidc-client-ts + 配置 bootstrap + 登录流程重构。

**Tech Stack:** Spring Boot 3.3.5/Spring Security OAuth2 Resource Server/Flyway/Testcontainers;Vue3/Vite/Vitest/oidc-client-ts;Keycloak(Docker)。

**契约/现状(本会话已核对):** spec `docs/superpowers/specs/2026-06-09-sso-keycloak-design.md`。后端:`SecurityConfig`(无状态、`.oauth2ResourceServer().jwt(jwt->jwt.jwtAuthenticationConverter(authoritiesConverter))`;dev/test 有内存 RSA `KeyPair`/`JwtEncoder`/`JwtDecoder` bean,@Profile(DEV,TEST);permitAll 含 `/dev/token`、actuator、swagger;`/api/admin/**` 需 PORTAL_ADMIN);`DevTokenController`(@Profile DEV,`/dev/token?employeeId`→签 RS256,sub=employeeId,**无 iss**);`UserInfoAuthoritiesConverter`(JWT→authorities,基于 user_info);`CurrentUser`(sub=employeeId);Flyway 当前 **V5**,`OracleMigrationTest`=5;`user_info`(employee_id PK/dept/role/email/active);`AppConstants`(Profiles/Roles.PORTAL_ADMIN/Paths.{DEV_TOKEN,ADMIN_API}/DevToken.TTL_HOURS)。前端:`stores/auth.ts`(token in localStorage;`provider=createAuthProvider()`;`login(employeeId?)`→`provider.login`;`setToken`/`hydrateUser`/`clear`);`src/lib/auth`(provider 抽象 + `DEV_IDENTITIES`);`router/index.ts`(`/login` public 守卫;`/admin` admin 守卫;`installGuards`);`lib/api/client.ts`(`configureClient`{getToken,onUnauthorized};401→onUnauthorized);`LoginView.vue`(dev 身份快选 → `auth.login(employeeId)`);Pinia + i18n(zh/en 键对齐测试)。**硬约束:双端测试绿;后端无状态不引会话;公开 config 不含任何 hash/secret;内部登录失败统一 401;Flyway 双库;V6;OracleMigrationTest=6;既有测试 token 补 iss=cim-portal。** 前端仓库分支 `dev`(新建 `sso`);后端 `backend/` 分支 `dev` 直接提交。门禁:前端 `npm run verify`、后端 `cd backend && mvn -q test`。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## Task 1: 后端 A — security_setting + 配置 API

**Files:** `backend/.../setting/SecuritySetting.java`(新)、`SecuritySettingRepository.java`(新)、`SecuritySettingService.java`(新)、`setting/dto/*`(新)、`setting/SecuritySettingAdminController.java`(新)、`portal/PortalConfigController.java`(新)、`db/migration/{mariadb,oracle}/V6__security_setting.sql`(新)、`test/.../migration/OracleMigrationTest.java`、新增控制器测试

- [ ] **Step 1: Read** `AppConstants.java`、`enumvalue/`(实体/repo/controller 范式)、`SecurityConfig`、`auth/RestAuthEntryPoint`、错误响应/`@ControllerAdvice`、`CurrentUser`/`UserInfo`。

- [ ] **Step 2: Flyway V6**
  - `mariadb/V6__security_setting.sql`:
    ```sql
    CREATE TABLE security_setting (
      id              BIGINT       NOT NULL PRIMARY KEY,
      sso_enabled     BOOLEAN      NOT NULL DEFAULT FALSE,
      sso_issuer_uri  VARCHAR(512) NULL,
      sso_client_id   VARCHAR(255) NULL,
      sso_scopes      VARCHAR(255) NOT NULL DEFAULT 'openid profile',
      sso_username_claim VARCHAR(64) NOT NULL DEFAULT 'preferred_username',
      internal_password_hash VARCHAR(100) NULL,
      updated_at      TIMESTAMP    NULL
    );
    INSERT INTO security_setting (id, sso_enabled, sso_scopes, sso_username_claim, internal_password_hash)
      VALUES (1, FALSE, 'openid profile', 'preferred_username',
              '$2a$10$Dow1Q8s8e0Qm0kqY8s9bIeJ2qkVZ6Yt5mE0o0o0o0o0o0o0o0o0'); -- BCrypt of dev 初始密码 cimp@123(实现时用真实哈希)
    ```
    > 实现:用 `new BCryptPasswordEncoder().encode("cimp@123")` 生成真实哈希填入(占位串仅示意)。
  - `oracle/V6__security_setting.sql`:同义 Oracle 语法(`NUMBER(1) DEFAULT 0`、`VARCHAR2`、`TIMESTAMP`;`INSERT` 同)。

- [ ] **Step 3: 实体/repo** — `SecuritySetting`(@Id Long id;字段同表;getters/setters)。`SecuritySettingRepository extends JpaRepository<SecuritySetting,Long>`。

- [ ] **Step 4: `SecuritySettingService`** — `get()` 取 id=1(缓存于字段,写后失效/刷新);`publicView()` → record `{ boolean ssoEnabled, String authority, String clientId, String scopes, String usernameClaim }`(authority=ssoIssuerUri);`adminView()` → 同 publicView 字段(**不含** hash);`update(req)`:写 ssoEnabled/issuerUri/clientId/scopes/usernameClaim;`req.initialPassword()` 非空 → `internalPasswordHash = encoder.encode(initialPassword)`;`updatedAt=now`;保存 + 刷新缓存。`ssoIssuer()` → 当前 ssoIssuerUri(供解码器)。`matchesInternalPassword(raw)` → `encoder.matches(raw, hash)`(hash 空则 false)。注入 `BCryptPasswordEncoder` bean(在 SecurityConfig 加 `@Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}`)。

- [ ] **Step 5: 公开 config** — `PortalConfigController`:`GET /api/portal/config` → `service.publicView()`(permitAll,见 Task 2 白名单)。

- [ ] **Step 6: 管理 API** — `SecuritySettingAdminController`:`GET /api/admin/security-settings` → `adminView()`;`PUT /api/admin/security-settings` 接 `SecuritySettingUpdateRequest{ Boolean ssoEnabled, String issuerUri, String clientId, String scopes, String usernameClaim, String initialPassword }`(校验:ssoEnabled=true 时 issuerUri/clientId @NotBlank;用 `@AssertTrue`)→ `update` → 返回 `adminView()`。路径在 `/api/admin/**` 下 → 已需 PORTAL_ADMIN。

- [ ] **Step 7: `OracleMigrationTest`** — `migrationsExecuted` 5 → **6**。

- [ ] **Step 8: 测试** — 控制器测试:`/api/portal/config` 匿名可访问、返回字段、**不含** internalPasswordHash;`GET/PUT /api/admin/security-settings` 需 PORTAL_ADMIN(匿名/非 admin 403)、PUT 存储且响应不回显 hash、initialPassword 写入后 `matchesInternalPassword` 为真。V6 在测试容器应用。

- [ ] **Step 9: 全量 + Commit** — `cd backend && mvn -q test`(BUILD SUCCESS);提交后端 dev:`feat(security): security_setting + 公开/管理 SSO 配置 API + V6`。

---

## Task 2: 后端 B — 多签发方 + 内部登录

**Files:** `backend/.../auth/PortalJwtKeys.java`(新)、`SecurityConfig.java`(改)、`auth/MultiIssuerJwtDecoder.java`(新)、`auth/AuthController.java`(新)、`auth/dev/DevTokenController.java`(改)、`UserInfoAuthoritiesConverter.java`/`CurrentUser` 解析(改 claim 映射)、`AppConstants.java`(加 portal issuer)、相关测试 + token 工厂

- [ ] **Step 1: Read** `SecurityConfig`(当前 keypair/encoder/decoder bean + filterChain)、`DevTokenController`、`UserInfoAuthoritiesConverter`、`CurrentUser`、token 测试工厂(`test/.../support` 或 LinkTestFactory 旁的 jwt 助手)。

- [ ] **Step 2: `AppConstants`** — 加 `public static final class Issuer { public static final String PORTAL = "cim-portal"; }`(或 `Auth.PORTAL_ISSUER`)。

- [ ] **Step 3: `PortalJwtKeys`(全 profile)** — 组件产出 `KeyPair`:若 `app.security.portal-jwt.private-key`+`public-key`(PEM)配置存在则解析;否则 `KeyPairGenerator` 生成(非 dev/test 启动 `log.warn` 提示用持久密钥)。暴露 `JwtEncoder portalJwtEncoder()` + `JwtDecoder portalJwtDecoder()`(`NimbusJwtDecoder.withPublicKey(pub)` + `OAuth2TokenValidatorJwtIssuerValidator`/`JwtValidators` 校验 `iss=cim-portal`)。**移除** SecurityConfig 里 @Profile(DEV,TEST) 的 keypair/encoder/decoder 三 bean(由此组件全 profile 提供)。

- [ ] **Step 4: `MultiIssuerJwtDecoder implements JwtDecoder`** —
  ```java
  public Jwt decode(String token) {
      String iss;
      try { iss = com.nimbusds.jwt.JWTParser.parse(token).getJWTClaimsSet().getIssuer(); }
      catch (Exception e) { throw new BadJwtException("Malformed token"); }
      if (AppConstants.Issuer.PORTAL.equals(iss)) return portalDecoder.decode(token);
      String ssoIssuer = settings.ssoIssuer();
      if (ssoIssuer != null && ssoIssuer.equals(iss)) return ssoDecoder(ssoIssuer).decode(token);
      throw new BadJwtException("Untrusted issuer: " + iss);
  }
  ```
  `ssoDecoder(issuer)`:缓存 `(issuer, NimbusJwtDecoder)`;issuer 变更则 `NimbusJwtDecoder.withIssuerLocation(issuer).build()` 重建(线程安全,如 `volatile` 或 `synchronized`)。注册为 `JwtDecoder` bean;`filterChain` 用 `.jwt(jwt -> jwt.decoder(multiIssuerDecoder).jwtAuthenticationConverter(authoritiesConverter))`。

- [ ] **Step 5: token 加 issuer** — `DevTokenController`:`JwtClaimsSet.builder().issuer(AppConstants.Issuer.PORTAL).subject(employeeId)...`;改用 `portalJwtEncoder`。

- [ ] **Step 6: `AuthController`** — `POST /api/auth/login`(permitAll)`AuthLoginRequest{ @NotBlank employeeId, @NotBlank password }`:
  - `UserInfo u = userRepo.findById(employeeId).orElse(null)`;`if (u==null || !u.isActive() || !settings.matchesInternalPassword(password)) → throw` 统一 401(`INVALID_CREDENTIALS`,经既有错误响应或 `ResponseStatusException(UNAUTHORIZED)`)。
  - 成功 → 用 `portalJwtEncoder` 签 `iss=cim-portal,sub=employeeId,exp=TTL_HOURS` → 返回 `Map.of("access_token",t,"token_type","Bearer")`。

- [ ] **Step 7: claim 映射** — `UserInfoAuthoritiesConverter`(及 `CurrentUser` 解析处):employeeId = `jwt.getClaimAsString(settings.get().getSsoUsernameClaim())`,为空回退 `jwt.getSubject()`。(确保对 portal-internal token——无 preferred_username——回退到 sub。)

- [ ] **Step 8: 安全白名单** — `SecurityConfig` permitAll 增加 `/api/portal/config`、`/api/auth/login`(保留 `/dev/token`、actuator、swagger)。

- [ ] **Step 9: 测试** — token 工厂/集成测试:所有自签 token 加 `iss=cim-portal`(否则 portal decoder 拒)。新增:`AuthController`(正确凭据→200+token;错误密码→401;停用用户→401;不存在→401);`MultiIssuerJwtDecoder`(portal token 解析成功、未知 iss → BadJwt);`/api/auth/login` permitAll(匿名可达)。既有受保护端点测试改用带 iss 的 token(确认 `UserInfoAuthoritiesConverter` 仍解析 sub)。

- [ ] **Step 10: 全量 + Commit** — `mvn -q test`(SUCCESS);提交后端 dev:`feat(auth): 双签发方 JWT(portal+Keycloak)+ /api/auth/login 内部登录 + 全 profile 门户签名密钥`。

---

## Task 3: 前端 — oidc-client + 登录流程 + 管理 SSO UI

**Files:** `src/lib/api/portal.ts`(加 getConfig)、`src/stores/config.ts`(新)、`src/lib/auth/sso.ts`(新)、`src/lib/auth/index.ts`(改 provider)、`src/stores/auth.ts`(加 loginInternal)、`src/features/auth/CallbackView.vue`(新)、`src/router/index.ts`(加 /auth/callback + 流程)、`src/features/auth/LoginView.vue`(重构)、`src/features/admin/security/SecurityAdminView.vue`(新)+ `src/lib/api/admin.ts`(security settings API)、`src/features/admin/AdminLayout.vue`/侧栏(加项)、`src/lib/i18n/locales/{zh,en}.ts`、相关 `.spec.ts`

- [ ] **Step 1: 依赖** — `npm install oidc-client-ts`。

- [ ] **Step 2: config API + store** — `portal.ts` 加 `getConfig(): Promise<PortalConfig>`(`GET /api/portal/config`,**不带** auth 也可,公开);类型 `PortalConfig { ssoEnabled:boolean; authority?:string; clientId?:string; scopes:string; usernameClaim:string }`。`stores/config.ts`:`load()` 拉取并缓存;`main.ts`/`App` 启动时 `await config.load()`(失败兜底 ssoEnabled=false)。

- [ ] **Step 3: `sso.ts`** — `import { UserManager } from 'oidc-client-ts'`;`buildManager(cfg)` → `new UserManager({ authority: cfg.authority, client_id: cfg.clientId, redirect_uri: location.origin + '/auth/callback', response_type: 'code', scope: cfg.scopes })`(PKCE 默认开)。`startSso(cfg)` → `manager.signinRedirect()`;`completeSso(cfg)` → `(await manager.signinRedirectCallback()).access_token`。

- [ ] **Step 4: `stores/auth.ts`** — 加 `async loginInternal(employeeId, password) { setToken((await internalLogin(employeeId,password)).access_token); await hydrateUser() }`(`internalLogin` = `POST /api/auth/login`,放 `src/lib/auth` 或 portal.ts)。保留 `setToken`/`hydrateUser`/`clear`。

- [ ] **Step 5: 路由 + Callback** — `router/index.ts`:加 `{ path:'/auth/callback', name:'auth-callback', component: ()=>import('@/features/auth/CallbackView.vue'), meta:{public:true} }`。`CallbackView`:`onMounted` → `try { auth.setToken(await completeSso(config)); await auth.hydrateUser(); router.replace('/') } catch { sessionStorage.setItem('sso_failed','1'); router.replace('/login') }`。
  - **守卫**:`installGuards` 未认证且访问非 public 时维持 → `/login`(LoginView 内部决定是否自动跳 SSO)。

- [ ] **Step 6: `LoginView.vue` 重构** — 移除 DEV_IDENTITIES 快选。逻辑:`onMounted`:`if (config.ssoEnabled && !sessionStorage.getItem('sso_failed')) startSso(config)`(自动跳);否则显示内部表单。模板:内部账号表单(工号 `Input` + 密码 `Input type=password`)→ `submit` → `auth.loginInternal(...)` → 成功 `router.push('/')`、`USER_INACTIVE/NOT_PROVISIONED` → `/account-inactive`、其余 → error 文案;若 `config.ssoEnabled` 显示「用 SSO 登录」按钮(`sessionStorage.removeItem('sso_failed'); startSso(config)`)。

- [ ] **Step 7: 管理 Security/SSO UI** — `admin.ts` 加 `getSecuritySettings()`/`updateSecuritySettings(body)`(`/api/admin/security-settings`);类型 `SecuritySettings { ssoEnabled; issuerUri?; clientId?; scopes; usernameClaim }` + 更新体含可选 `initialPassword`。`SecurityAdminView.vue`(沿用 AdminPanel 外壳 + 既有表单控件:`Switch`/`Input`/`Button`):字段 SSO 开关、issuer URI、client ID、scopes、username claim、初始密码(write-only,占位「留空则不变」)→ 保存调 update + toast。路由加 `/admin/security`(admin 守卫);`AdminLayout` 侧栏加「安全 / Security」项。

- [ ] **Step 8: i18n** — `auth.login` 加 `internalTitle`/`employeeIdLabel`/`passwordLabel`/`signIn`/`ssoButton`/`ssoFailed`;`admin.nav.security`、`admin.security.{title,ssoEnabled,issuerUri,clientId,scopes,usernameClaim,initialPassword,initialPasswordHint,save}`。zh/en 对齐。

- [ ] **Step 9: 测试** — mock `oidc-client-ts`(`vi.mock`)与 `sso.ts`。`config` store 加载;`LoginView`:ssoEnabled+无失败标志 → 调 `startSso`;ssoEnabled=false → 显示内部表单并提交调 `loginInternal`;有 `sso_failed` → 显示内部表单 + SSO 按钮。`CallbackView`:成功存 token 去 `/`、失败置标志去 `/login`(mock completeSso 解析/拒绝)。`SecurityAdminView`:读填表 + 保存 payload(含 initialPassword write-only)。i18n 键对齐。

- [ ] **Step 10: 全量 + Commit** — `npm run verify`(typecheck/测试/build 绿);提交前端 sso 分支:`feat(auth): 前端 SSO(PKCE/oidc-client)+ 内部登录回退 + 管理端 SSO 配置`。

---

## Task 4: E2E — Keycloak 容器 + 全流程验证 + 文档

- [ ] **Step 1: 后端门禁** — `cd backend && mvn -q test` → SUCCESS。前端门禁 `npm run verify` → 绿。
- [ ] **Step 2: 起 Keycloak** — `docker rm -f cim-keycloak 2>/dev/null; docker run -d --name cim-keycloak -p 8081:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:26.0 start-dev`;待就绪(`curl localhost:8081/realms/master`)。
- [ ] **Step 3: 配 realm/client/user(经 admin REST)** — 取 admin token(`/realms/master/protocol/openid-connect/token`,client_id=admin-cli);建 realm `cim`;建 public client `cim-portal-spa`(`publicClient=true`、`standardFlowEnabled=true`、`redirectUris=["http://localhost:5173/auth/callback"]`、`webOrigins=["http://localhost:5173","+"]`、PKCE S256 via `attributes."pkce.code.challenge.method"="S256"`);建 user `ADMIN1`(username=ADMIN1、enabled、邮箱、设密码 非临时)。脚本化(curl)以便复现。
- [ ] **Step 4: 接线** — dev 后端起(`SPRING_PROFILES_ACTIVE=dev`);经 `PUT /api/admin/security-settings`(用 ADMIN1 的 portal token,或先内部登录拿 token)设 `ssoEnabled=true, issuerUri=http://localhost:8081/realms/cim, clientId=cim-portal-spa, usernameClaim=preferred_username`。前端 `npm run dev`。
- [ ] **Step 5: 全流程验证(playwright/headless)** — (a) 访问 5173 → 自动跳 Keycloak 登录页 → 输 ADMIN1 → 回 callback → 进入首页(顶栏显示 ADMIN1、可见管理入口=PORTAL_ADMIN);截图。(b) 关 SSO(或置 `sso_failed`)→ 显示内部登录页 → 工号 ADMIN1 + 初始密码 cimp@123 → 进入;截图。(c) 管理端 `/admin/security` 改配置保存生效。
- [ ] **Step 6: 文档** — 写 `docs/Keycloak-SSO-dev.md`(中文):起容器、建 realm/client/user 的脚本、设 security_setting、替换真实 SSO 时改 issuerUri/clientId/usernameClaim 的说明。
- [ ] **Step 7: 清理** — `docker rm -f cim-keycloak`;`fuser -k 5173/tcp 8080/tcp`(按需保留 dev 后端)。
- [ ] **Step 8: 合并/推送** — 前端 `sso`→`dev`(ff;`npm run verify`)推送;后端 dev 推送。

---

## 自检清单(Self-Review)

**规格覆盖(spec §2–§6):** security_setting + 配置 API → T1;多签发方解码器 + PortalJwtKeys + 内部登录 + claim 映射 + 白名单 → T2;oidc-client/PKCE + config bootstrap + 登录流程(SSO 默认/内部回退)+ callback + LoginView + 管理 SSO UI + i18n → T3;Keycloak 容器 + realm/client/user + 接线 + 全流程 + 文档 → T4。双签发方校验(portal+Keycloak)在 T2 + T4 复验。

**占位符扫描:** 无 TBD;V6 SQL/MultiIssuerJwtDecoder/sso.ts/AuthController/security_setting 给出具体内容;BCrypt 哈希「实现时生成真实值」明确点名;现有 token 工厂「补 iss」点名。

**类型/命名一致性:** `iss=cim-portal`(AppConstants.Issuer.PORTAL ↔ DevToken/AuthController 签发 ↔ MultiIssuerJwtDecoder/portalDecoder 校验);`usernameClaim`(security_setting ↔ publicView.usernameClaim ↔ 前端 PortalConfig ↔ UserInfoAuthoritiesConverter 解析);`authority`=`sso_issuer_uri`(后端 issuer 路由 ↔ 前端 oidc authority);`/api/portal/config`+`/api/auth/login` permitAll;Flyway V6 双库 ↔ OracleMigrationTest=6;config 公开视图**不含** hash。**硬约束**(双端绿、无状态、公开无 secret、统一 401、双库迁移)在 T1/T2/T3/T4 复验。
