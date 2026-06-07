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

## 托盘 + 自动更新(P3c)

- **系统托盘**:托盘图标 + 菜单(显示主窗口 / 退出);左键点击切换窗口显示。关闭窗口仍为退出(不隐藏到托盘)。Linux 需 `libayatana-appindicator`。
- **自动更新**:`tauri-plugin-updater`,渠道 = GitHub Releases `latest.json`(`https://github.com/shaneworld/Cim-Portal-Client/releases/latest/download/latest.json`)。启动时检查 → 有更新弹原生确认 → 下载安装 → 重启(`src/lib/desktop/updater.ts`,`isTauri()` 守卫,web 端 no-op)。

**用户操作项(必做才能出可用更新):**
1. **生成签名密钥**:`npx tauri signer generate -w ~/.tauri/cim-portal-updater.key`,把 `*.key.pub` 单行内容填入 `tauri.conf.json` `plugins.updater.pubkey`(当前为占位 `REPLACE_WITH_TAURI_SIGNER_PUBKEY`)。
2. **私钥加为 GH secret** `TAURI_SIGNING_PRIVATE_KEY`(设了密码再加 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`);私钥**勿入库**(`*.key` 已 gitignore)。
3. **仓库须 public**,否则 `releases/latest/download/latest.json` 取不到(改内部 host)。
4. 更新仅从**已发布(非草稿)** release 下发——发布 CI 生成的草稿 release。
5. 本机试运行需 `sudo pacman -S webkit2gtk-4.1 libayatana-appindicator` 后 `npm run tauri:dev`。

## 范围

P3a:脚手架 + 内嵌 SPA + 可配置后端 + CI 出包。**P3b DONE**:后端 CORS 放行桌面源,token 鉴权跨域可用。**P3c DONE**:系统托盘 + 自动更新(GitHub Releases latest.json,签名校验)。
后续:真实 OIDC/SSO(web + 桌面);OS 级代码签名/公证;增量更新/进度 UI。
