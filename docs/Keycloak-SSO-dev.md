# Keycloak SSO 本地开发/测试指南

本指南用 **Keycloak**(与公司 SSO 一致的 OIDC)在本地跑通门户的 SSO 登录,验证完成后只需改几个配置即可切到公司真实 SSO。

> 登录策略:**SSO 默认且自动发起**;SSO 失败/禁用时显示**内部账号登录**(工号 + 初始密码)。前端为 PKCE 公有客户端(`oidc-client-ts`),后端无状态 Resource Server 同时接受 **门户自签 token**(内部登录,`iss=cim-portal`)与 **Keycloak token**(`iss=<realm issuer>`)。

## 1. 启动 Keycloak(Docker,端口 8081)

```bash
docker run -d --name cim-keycloak -p 8081:8080 \
  -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.0 start-dev
# 就绪检查:curl http://localhost:8081/realms/master 返回 200
```

## 2. 建 realm / client / 用户(admin REST)

```bash
# 取 master 管理 token
ADM=$(curl -s -X POST http://localhost:8081/realms/master/protocol/openid-connect/token \
  -d client_id=admin-cli -d username=admin -d password=admin -d grant_type=password \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
H="Authorization: Bearer $ADM"

# realm cim
curl -s -X POST http://localhost:8081/admin/realms -H "$H" -H 'Content-Type: application/json' \
  -d '{"realm":"cim","enabled":true}'

# public PKCE client(redirect 指向前端 /auth/callback)
curl -s -X POST http://localhost:8081/admin/realms/cim/clients -H "$H" -H 'Content-Type: application/json' \
  -d '{"clientId":"cim-portal-spa","protocol":"openid-connect","publicClient":true,
       "standardFlowEnabled":true,"directAccessGrantsEnabled":true,
       "redirectUris":["http://localhost:5173/auth/callback","http://localhost:5173/*"],
       "webOrigins":["+"],"attributes":{"pkce.code.challenge.method":"S256"}}'

# 用户 ADMIN1(username 必须等于门户 user_info.employee_id)
curl -s -X POST http://localhost:8081/admin/realms/cim/users -H "$H" -H 'Content-Type: application/json' \
  -d '{"username":"ADMIN1","enabled":true,"email":"admin1@example.com","emailVerified":true,"firstName":"Adam","lastName":"Admin"}'
KID=$(curl -s "http://localhost:8081/admin/realms/cim/users?username=ADMIN1" -H "$H" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")   # 注:zsh 里勿用变量名 UID(只读)
curl -s -X PUT "http://localhost:8081/admin/realms/cim/users/$KID/reset-password" -H "$H" -H 'Content-Type: application/json' \
  -d '{"type":"password","value":"Pass123!","temporary":false}'
```

realm issuer = `http://localhost:8081/realms/cim`(见 `/.well-known/openid-configuration`)。

## 3. 在门户配置 SSO

先用**内部账号**登录拿到管理 token(dev 默认初始密码 `cimp@123`,见 `security_setting` 种子):

```bash
PT=$(curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"employeeId":"ADMIN1","password":"cimp@123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -s -X PUT http://localhost:8080/api/admin/security-settings -H "Authorization: Bearer $PT" \
  -H 'Content-Type: application/json' \
  -d '{"ssoEnabled":true,"issuerUri":"http://localhost:8081/realms/cim","clientId":"cim-portal-spa","scopes":"openid profile","usernameClaim":"preferred_username"}'
```

或登录后在 **管理端 → 安全 / SSO**(`/admin/security`)页面填写并保存(可同时设置内部「初始密码」)。

## 4. 验证

- 浏览器开 `http://localhost:5173/` → 自动跳转 Keycloak → 输入 `ADMIN1 / Pass123!` → 回到门户**直接进入**(顶栏显示该用户 + 管理入口=PORTAL_ADMIN)。
- 内部回退:SSO 失败/禁用 → 显示「使用内部账号登录」表单 → 工号 `ADMIN1` + 初始密码 `cimp@123` → 进入;页面有「使用 SSO 登录」重试按钮。
- 后端多签发方:Keycloak token 与门户自签 token 均可作 Bearer 访问 `/api/portal/**`(已实测 `/api/portal/home` 200)。

## 5. 切换到公司真实 SSO

只改配置,无需改代码:
1. 在公司 IdP 注册一个 **public client(PKCE/S256,standard flow)**,redirect URI = `<门户前端地址>/auth/callback`,Web Origin 加门户前端地址。
2. 管理端「安全 / SSO」改:`issuerUri` = 公司 realm/issuer 地址、`clientId` = 上面注册的 client、`usernameClaim` = 真实 token 中等于工号的 claim(常见 `preferred_username`,也可能是 `sub`/自定义)。
3. 确保 SSO 用户名/claim 能映射到门户 `user_info.employee_id`(门户角色/部门仍来自 `user_info`,不从 SSO claim 取)。
4. 后端会按新 `issuerUri` 自动拉取 JWKS 校验 token(issuer 变更即时生效)。

## 清理

```bash
docker rm -f cim-keycloak
```
