# P3a Tauri 桌面脚手架 + 跨平台 CI 出包 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 CIM Portal Vue SPA 封装为 Tauri 2 桌面应用脚手架:内嵌构建后的 `dist`、API 基址经 `VITE_API_BASE_URL` 可配置、并提供 GitHub Actions 跨平台(win/mac/linux)出包流水线。

**Architecture:** `src-tauri/`(Tauri 2 标准布局)置于 `cim-portal-client`;Tauri 打包 Vite `dist`,WebView 本地加载;前端 API 客户端经构建时注入的 `VITE_API_BASE_URL` 指向后端。跨平台二进制由 GH Actions 矩阵产出。

**Tech Stack:** Tauri 2 (Rust) + Vue 3 SPA(Vite)+ GitHub Actions(tauri-action)。

**契约/现状(已核对):** spec `docs/superpowers/specs/2026-06-07-p3a-tauri-desktop-scaffold-design.md`。Rust 1.96/cargo 已装;**`webkit2gtk-4.1` 缺失 + 无免密 sudo → 本机不能 `tauri build`/`tauri dev`**(纯 Rust 编译会因缺 webkit pkg-config 失败,**预期且可接受**)。`npm run build` = `vue-tsc --noEmit && vite build`,输出 `dist/`;`vite.config.*` 无 base/outDir 覆盖(默认 base `/`、outDir `dist`)。`src/bootstrap.ts` 现 `configureClient({ baseUrl: '' })`。无 `.env*`。`src/vite-env.d.ts` 存在(Vite 默认 `/// <reference types="vite/client" />`)。仓库远程 `git@github.com:shaneworld/Cim-Portal-Client.git`,主分支 `dev`。**硬约束:既有 64 测试保持绿;不得伪称已执行 Tauri 编译/出包。** 仓库 `/home/shane/Code/cim-portal/cim-portal-client`(在 `dev` 上新建 `p3a-tauri`)。门禁:本机仅 `npm run verify`(typecheck+test+vite build)+ 配置文件语法校验。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## 文件结构

```
src-tauri/tauri.conf.json          # T2
src-tauri/Cargo.toml               # T2
src-tauri/build.rs                 # T2
src-tauri/src/main.rs              # T2
src-tauri/src/lib.rs               # T2
src-tauri/capabilities/default.json# T2
src-tauri/.gitignore               # T2
src-tauri/icons/                   # T2(占位图标)
src/bootstrap.ts                   # T1(改:VITE_API_BASE_URL)
src/vite-env.d.ts                  # T1(补 env 类型)
.env.example                       # T1(新)
package.json                       # T3(改:cli devDep + 脚本)
.gitignore                         # T3(改)
.github/workflows/desktop-release.yml  # T4(新)
```

---

## Task 1: 前端可配置 API 基址(VITE_API_BASE_URL)

**Files:** Modify `src/bootstrap.ts`, `src/vite-env.d.ts`; Create `.env.example`

- [ ] **Step 1: 看现状** — Read `src/bootstrap.ts`(确认 `configureClient({ baseUrl: '', ... })` 行)与 `src/vite-env.d.ts`。

- [ ] **Step 2: 改 `src/bootstrap.ts`** — 将 `baseUrl: ''` 改为 `baseUrl: import.meta.env.VITE_API_BASE_URL ?? ''`(仅改该一处赋值,其余 configureClient 选项不动)。

- [ ] **Step 3: 补 env 类型 `src/vite-env.d.ts`** — 在 `/// <reference types="vite/client" />` 之后追加:
```ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 4: 新建 `.env.example`**
```
# 桌面(Tauri)构建:指向后端 API 基址,例如 https://portal.example.com 或 http://192.168.x.x:8080
# Web 构建:留空 → 走同源相对路径(/api/...)
VITE_API_BASE_URL=
```

- [ ] **Step 5: 验证** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run typecheck && npm test` → typecheck 干净;全量 **64 测试绿**(测试不设该 env → `?? ''` 回退,行为不变)。

- [ ] **Step 6: Commit**
```bash
git add src/bootstrap.ts src/vite-env.d.ts .env.example
git commit -m "feat(desktop): API 基址改用 VITE_API_BASE_URL(桌面构建指向后端,Web 留空同源)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: src-tauri 脚手架(Tauri 2)

**Files:** Create `src-tauri/{tauri.conf.json, Cargo.toml, build.rs, src/main.rs, src/lib.rs, capabilities/default.json, .gitignore}` + `src-tauri/icons/`

> 说明:不依赖联网 CLI 脚手架;按下列内容直接创建(Tauri 2 标准最小骨架)。图标用占位(P3c 换品牌图)。

- [ ] **Step 1: `src-tauri/Cargo.toml`**
```toml
[package]
name = "cim-portal-desktop"
version = "0.1.0"
description = "CIM Portal desktop app"
edition = "2021"
rust-version = "1.77.2"

[lib]
name = "cim_portal_desktop_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 2: `src-tauri/build.rs`**
```rust
fn main() {
    tauri_build::build()
}
```

- [ ] **Step 3: `src-tauri/src/main.rs`**
```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    cim_portal_desktop_lib::run()
}
```

- [ ] **Step 4: `src-tauri/src/lib.rs`**
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 5: `src-tauri/tauri.conf.json`**
```json
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
    "windows": [
      {
        "title": "CIM 门户",
        "width": 1280,
        "height": 832,
        "minWidth": 960,
        "minHeight": 600,
        "center": true,
        "resizable": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 6: `src-tauri/capabilities/default.json`**
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": ["core:default", "opener:default"]
}
```

- [ ] **Step 7: `src-tauri/.gitignore`**
```
/target
/gen/schemas
```

- [ ] **Step 8: 占位图标 `src-tauri/icons/`** — 生成一个 1024×1024 纯色占位 PNG 再切多尺寸;若 `magick`/`convert` 可用:
```bash
cd /home/shane/Code/cim-portal/cim-portal-client/src-tauri/icons
# 若有 ImageMagick:
magick -size 1024x1024 xc:'#4f46e5' -gravity center -pointsize 560 -fill white -annotate 0 'C' icon-src.png 2>/dev/null \
  && for s in 32 128; do magick icon-src.png -resize ${s}x${s} ${s}x${s}.png; done \
  && magick icon-src.png -resize 256x256 128x128@2x.png \
  && magick icon-src.png -resize 256x256 icon.png \
  && magick icon-src.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico \
  && magick icon-src.png -resize 512x512 icon.icns 2>/dev/null || echo "ICNS 可能需 png2icns;CI 阶段不依赖本机图标"
```
若无 ImageMagick 或某尺寸失败:创建占位说明文件并在 conf 注释提示——**但 `bundle.icon` 列出的文件须存在**;退路:用 `@tauri-apps/cli` 的 `npx tauri icon <png>`(T3 装 CLI 后)生成全套,放回 `icons/`。本步**至少**保证 `icons/` 内有 conf 引用的 5 个文件(占位即可),否则后续 `tauri build` 在 CI 失败。
（实现者:优先 `magick`;不可用则在 T3 装好 CLI 后用 `npx tauri icon` 生成;务必让 5 个引用文件存在。）

- [ ] **Step 9: 语法校验** — 配置可解析:
```bash
cd /home/shane/Code/cim-portal/cim-portal-client
node -e "JSON.parse(require('fs').readFileSync('src-tauri/tauri.conf.json','utf8')); JSON.parse(require('fs').readFileSync('src-tauri/capabilities/default.json','utf8')); console.log('JSON OK')"
ls -1 src-tauri/icons/
```
Expected: `JSON OK`;`icons/` 含 32x32.png/128x128.png/128x128@2x.png/icon.icns/icon.ico。
**注:不在本机执行 `cargo build`/`tauri build`(缺 webkit2gtk-4.1)——属预期。**

- [ ] **Step 10: Commit**
```bash
git add src-tauri
git commit -m "feat(desktop): src-tauri 脚手架(Tauri 2:conf/Cargo/main/lib/capabilities/占位图标)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Tauri CLI + npm 脚本 + 根 .gitignore

**Files:** Modify `package.json`, `.gitignore`

- [ ] **Step 1: 装 CLI(devDep)** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm install -D @tauri-apps/cli@^2`（写入 package.json devDependencies）。

- [ ] **Step 2: 加 npm 脚本** — `package.json` 的 `scripts` 增:
```json
"tauri": "tauri",
"tauri:dev": "tauri dev",
"tauri:build": "tauri build"
```
（保留既有 dev/build/test/verify 等不动。）

- [ ] **Step 3: 根 `.gitignore`** — 追加(若未含):
```
# Tauri
src-tauri/target/
src-tauri/gen/
```

- [ ] **Step 4:（若 T2 图标为占位/缺失)用 CLI 补全图标** — 若 `src-tauri/icons` 缺 conf 引用文件且本机有一张源 PNG:`npx tauri icon src-tauri/icons/icon-src.png`（生成全套到 `src-tauri/icons/`)。无源图则跳过(占位已在 T2 保证)。

- [ ] **Step 5: 校验** — `npm run tauri -- --help 2>&1 | head -3`(确认 CLI 可调用,输出 tauri 用法);`npm run typecheck && npm test`(脚本变更不影响 → 64 绿)。
**注:不执行 `npm run tauri:build`(本机缺 webkit2gtk-4.1)。**

- [ ] **Step 6: Commit**
```bash
git add package.json package-lock.json .gitignore
git commit -m "build(desktop): @tauri-apps/cli + tauri/tauri:dev/tauri:build 脚本 + gitignore target

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: GitHub Actions 跨平台出包流水线

**Files:** Create `.github/workflows/desktop-release.yml`

- [ ] **Step 1: 创建 `.github/workflows/desktop-release.yml`**
```yaml
name: desktop-release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: ubuntu-22.04
          - platform: windows-latest
          - platform: macos-latest
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev libsoup-3.0-dev librsvg2-dev build-essential file libxdo-dev libssl-dev

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install frontend deps
        run: npm ci

      - uses: dtolnay/rust-toolchain@stable

      - uses: swatinem/rust-cache@v2
        with:
          workspaces: src-tauri -> target

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'CIM Portal ${{ github.ref_name }}'
          releaseDraft: true
          prerelease: false
```
注:`vars.VITE_API_BASE_URL`(仓库 variable,未设则空 → 同源,需在 GitHub 仓库 Variables 配置后端基址);`releaseDraft: true` 出草稿 release 供确认;`workflow_dispatch` 便于手动跑。

- [ ] **Step 2: YAML 语法校验**
```bash
cd /home/shane/Code/cim-portal/cim-portal-client
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/desktop-release.yml')); print('YAML OK')"
```
Expected: `YAML OK`。
**注:不在本机/不自动触发 CI(出包消耗 Actions;由用户推 `v*` tag 或手动 dispatch 触发)。**

- [ ] **Step 3: Commit**
```bash
git add .github/workflows/desktop-release.yml
git commit -m "ci(desktop): tauri-action 跨平台出包(ubuntu/windows/macos,v* tag 触发,草稿 release)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 整合验证 + 文档/收尾

- [ ] **Step 1: 全量门禁(本机可验部分)** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → typecheck 干净、**64 测试绿**、`vite build` 出 `dist/` OK。
- [ ] **Step 2: 配置完整性复核** — 确认:`src-tauri/tauri.conf.json` `frontendDist` 指 `../dist`、`bundle.icon` 列出文件均存在于 `src-tauri/icons/`;`package.json` 含 `tauri*` 脚本与 `@tauri-apps/cli` devDep;根 `.gitignore` 含 `src-tauri/target/`;workflow 存在且 YAML 合法。
- [ ] **Step 3: README/说明(可选,轻量)** — 在 spec 或一行 `src-tauri/README.md` 记录:本机构建需 `sudo pacman -S webkit2gtk-4.1` 后 `npm run tauri:dev`;跨平台包推 `v*` tag 由 CI 出。
- [ ] **Step 4: 汇报边界** — 明确告知用户:脚手架 + CI 已就绪并通过本机可验项;**Tauri 实际编译/三平台安装包未在本机执行**(缺 webkit2gtk-4.1/无 sudo),需用户 `sudo pacman -S webkit2gtk-4.1` 本地试运行,或推 `v*` tag 触发 CI 出包。
- [ ] **Step 5: Commit(若有 README/小修)**
```bash
git add -A && git commit -m "docs(desktop): src-tauri 构建/出包说明

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 自检清单(Self-Review)

**规格覆盖(spec §3–§8):** 前端 VITE_API_BASE_URL + 类型 + .env.example → T1;src-tauri 全套(conf/Cargo/main/lib/build/capabilities/icons/.gitignore)→ T2;CLI devDep + 脚本 + 根 gitignore → T3;CI 出包 workflow → T4;本机可验门禁 + 边界汇报 → T5。诚实边界(本机不编译 Tauri)→ T2/T3/T4/T5 显式标注。

**占位符扫描:** 无 TBD;每文件给出完整内容。图标步骤给出 ImageMagick 命令 + CLI `npx tauri icon` 退路,并要求 conf 引用的 5 文件务必存在(否则 CI `tauri build` 失败)。

**类型/命名一致性:** Cargo `[lib] name="cim_portal_desktop_lib"` ↔ `main.rs` 调 `cim_portal_desktop_lib::run()`;`tauri.conf.json` `frontendDist=../dist` ↔ vite 默认 `dist`;`identifier=com.cimportal.portal`;`VITE_API_BASE_URL`(bootstrap/类型/.env.example/CI env)一致;npm `tauri*` 脚本 ↔ `@tauri-apps/cli`。**硬约束**(64 测试、不伪称已编译 Tauri)在 T1/T5 复测与汇报。
