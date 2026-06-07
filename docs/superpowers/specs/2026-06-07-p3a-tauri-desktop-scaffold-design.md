# P3a Tauri 桌面应用脚手架 + 打包流水线 设计

**日期:** 2026-06-07
**状态:** 设计已确认,待用户审阅 → 实现计划
**背景:** 将既有 CIM Portal Vue SPA(`cim-portal-client`)封装为 Tauri 2 桌面应用(Windows/Linux/macOS)。P3 拆为三子项目;本文为 **P3a**:脚手架 + 打包内嵌 SPA + 可配置后端 URL + 跨平台 CI 出包。后续 P3b(桌面鉴权/SSO + 后端 CORS)、P3c(托盘/自动更新/深链/品牌图标)另立。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 应用形态 | **内嵌构建后的 SPA(dist) + 可配置 API 基址**:WebView 本地加载 dist,API 客户端经 `VITE_API_BASE_URL`(构建时注入)指向后端。 |
| 出包策略 | **GitHub Actions 矩阵出包**(ubuntu/windows/macos runner)。本机(Arch,无 webkit2gtk-4.1、无免密 sudo)**不能**本地 `tauri build`。 |
| src-tauri 位置 | `cim-portal-client/src-tauri/`(Tauri 标准布局)。 |
| Tauri 版本 | **v2**。 |

## 2. 环境现状(已核对)

- Rust 1.96 + cargo 已装;`libsoup3`/`gtk3`/`librsvg` 已装;**`webkit2gtk-4.1` 缺失**(`pkg-config` 找不到),**无免密 sudo** → 本机不能编译/运行 Tauri。
- `@tauri-apps/cli`、Rust `tauri` crate 尚未引入。
- 前端:`npm run build` = `vue-tsc --noEmit && vite build`,输出默认 `dist/`,vite 无 base/outDir 覆盖。
- `src/bootstrap.ts` 现 `configureClient({ baseUrl: '' })`(同源相对)——桌面内嵌(非同源)需改为可配置基址。
- 无 `.env*` 文件。仓库 `cim-portal-client` 远程 `git@github.com:shaneworld/Cim-Portal-Client.git`,主分支 `dev`。

## 3. 组件与文件

```
src-tauri/
  tauri.conf.json            # 应用/窗口/打包配置
  Cargo.toml                 # Rust 依赖(tauri 2)
  build.rs                   # tauri-build
  src/main.rs                # 入口(调用 lib run)
  src/lib.rs                 # run():Builder + 默认插件
  capabilities/default.json  # 能力(core 默认)
  icons/                     # 占位图标(P3c 换品牌图)
  .gitignore                 # /target, /gen
src/bootstrap.ts             # 改:baseUrl 用 VITE_API_BASE_URL
.env.example                 # 新:文档化 VITE_API_BASE_URL
package.json                 # 改:@tauri-apps/cli devDep + tauri 脚本
.gitignore                   # 改:忽略 src-tauri/target
.github/workflows/desktop-release.yml  # 新:跨平台出包
```

## 4. tauri.conf.json(要点)

```jsonc
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "CIM Portal",
  "version": "0.1.0",
  "identifier": "com.cimportal.portal",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [{
      "title": "CIM 门户",
      "width": 1280, "height": 832,
      "minWidth": 960, "minHeight": 600,
      "center": true, "resizable": true
    }],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns", "icons/icon.ico"]
  }
}
```
- `productName` 用 ASCII(产物文件名/bundle 友好);窗口 `title` 用中文「CIM 门户」。
- `identifier` 反域名唯一(与后端 `com.cimportal` 一致前缀)。
- `csp: null`(P3a 不收紧;P3b 处理后端连通/CORS/CSP)。

## 5. Rust 端(最小)

`src-tauri/Cargo.toml`(要点):`[package] name="cim-portal-desktop"`;`[lib] name="cim_portal_desktop" crate-type=["staticlib","cdylib","rlib"]`;`[build-dependencies] tauri-build={version="2",features=[]}`;`[dependencies] tauri={version="2",features=[]}`、`serde`、`serde_json`、`tauri-plugin-opener`(默认脚手架含)。

`src/main.rs`:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() { cim_portal_desktop_lib::run() }
```
`src/lib.rs`:
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```
`build.rs`:`fn main(){ tauri_build::build() }`。`capabilities/default.json`:默认 `core:default` + `opener:default`,窗口 `main`。
（以上为 Tauri 2 `create-tauri-app` 标准产物;实现时以 CLI 脚手架生成为准,再按 §4 改 conf。）

## 6. 前端接入

- `src/bootstrap.ts`:`baseUrl: ''` → `baseUrl: import.meta.env.VITE_API_BASE_URL ?? ''`。Web 构建不设该变量 → 仍同源相对;桌面构建设 `VITE_API_BASE_URL=https://后端:端口`。
- `src/vite-env.d.ts`(若有 ImportMeta 类型则补 `VITE_API_BASE_URL: string`;无则加一处 `interface ImportMetaEnv { readonly VITE_API_BASE_URL?: string }`)。
- `.env.example`:`# 桌面构建指向后端;Web 留空走同源\nVITE_API_BASE_URL=`。
- `package.json`:devDep `@tauri-apps/cli@^2`;scripts:`"tauri": "tauri"`、`"tauri:dev": "tauri dev"`、`"tauri:build": "tauri build"`。
- 根 `.gitignore`:加 `src-tauri/target/`、`src-tauri/gen/`。

## 7. CI 出包(.github/workflows/desktop-release.yml)

- 触发:推送 `v*` tag。
- `matrix.platform: [ubuntu-22.04, windows-latest, macos-latest]`(macos 可加 aarch64 target,P3a 先默认)。
- 步骤:checkout → setup-node(20)+ `npm ci` → setup Rust(`dtolnay/rust-toolchain@stable`)→ **ubuntu 装依赖** `libwebkit2gtk-4.1-dev libgtk-3-dev libsoup-3.0-dev librsvg2-dev build-essential file libxdo-dev libssl-dev` → `tauri-apps/tauri-action@v0`(`tagName`/`releaseName`、自动 `npm run build` 经 beforeBuildCommand)→ 产物上传到 GitHub Release。
- `VITE_API_BASE_URL` 经 workflow `env`(占位/后续由 secret 提供)注入构建。
- 仅创建 workflow 文件;**实际触发由用户推 tag**(消耗 CI;P3a 不自动推)。

## 8. 验证(诚实边界)

**本机可验:**
- `npm run build` SPA 成功(`dist/` 生成)。
- `tauri.conf.json` JSON 合法、`Cargo.toml` TOML 合法(`node -e JSON.parse` / 解析校验)。
- 前端接入不破坏既有 **64 测试**(`npm run verify` 绿)。
- workflow YAML 语法合法(`node`/yaml 解析或 `python -c yaml.safe_load`)。

**本机不可验(需 CI 或用户装 webkit2gtk-4.1):**
- `tauri dev` / `tauri build`(Rust 编译链接 webkit)。
- 实际三平台安装包(由 GH Actions 矩阵产出,用户推 `v*` tag 触发)。

实现计划须显式标注「Tauri 编译/出包不在本机执行」,不得伪称已构建。

## 9. 不在范围内(YAGNI / 后续)

P3b:桌面鉴权/SSO、后端对 `tauri://localhost` 的 CORS、CSP 收紧、运行时(非构建时)后端地址配置。P3c:系统托盘、自动更新、深链、真实品牌图标、代码签名/公证。移动端(iOS/Android)。
