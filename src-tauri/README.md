# CIM Portal — 桌面应用 (Tauri 2)

把既有 Vue SPA 封装为 Windows / Linux / macOS 桌面应用。WebView 本地加载构建后的 `../dist`,API 客户端经 **`VITE_API_BASE_URL`**(构建时注入)指向后端。

## 本地开发 / 构建

需要 Rust(已装)+ 平台 WebView 依赖。

- **Arch Linux:** `sudo pacman -S webkit2gtk-4.1 libsoup3 gtk3 librsvg`(本机当前缺 `webkit2gtk-4.1`,装后方可本地构建)。
- 开发(热重载,自动起 `npm run dev`):`npm run tauri:dev`
- 构建安装包:`VITE_API_BASE_URL=https://后端地址 npm run tauri:build`
  （留空则同源相对路径,桌面包通常需设为后端 URL。)

产物在 `src-tauri/target/release/bundle/`。

## 跨平台出包(CI)

`.github/workflows/desktop-release.yml`:推 `v*` tag(或手动 `workflow_dispatch`)→ 在 ubuntu/windows/macos runner 上分别出 `.deb`/`.AppImage`、`.msi`/`.exe`、`.dmg`/`.app`,上传到**草稿** GitHub Release。
后端基址经仓库 **Variable `VITE_API_BASE_URL`** 注入(未设则空)。

```bash
git tag v0.1.0 && git push origin v0.1.0   # 触发出包
```

## 图标

`icons/` 由占位源图 `icon-src.png`(纯色品牌占位)经 `npx tauri icon icon-src.png` 生成。
换品牌图:替换 `icon-src.png`(1024×1024 PNG)后重跑该命令(P3c)。

## 鉴权(P3b)

桌面 WebView 源 `tauri://localhost`(Win:`http://tauri.localhost`)跨域调用后端;后端已配置 CORS(`app.cors.allowed-origins`)放行该源。沿用既有 JWT Bearer 流:登录经 `GET {VITE_API_BASE_URL}/dev/token?employeeId=` 取 token 存 `localStorage`,后续 `Authorization: Bearer`。
**`/dev/token` 仅 dev profile** → 桌面登录目前仅对 **dev** 后端可用;uat/prod 桌面鉴权需真实 OIDC(后续阶段)。

## 范围

P3a:脚手架 + 内嵌 SPA + 可配置后端 + CI 出包。**P3b DONE**:后端 CORS 放行桌面源,既有 token 鉴权跨域可用。
后续:真实 OIDC/SSO(web + 桌面);P3c 托盘/自动更新/深链/品牌图标/签名公证。
