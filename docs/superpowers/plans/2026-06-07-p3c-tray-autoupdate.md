# P3c 系统托盘 + 自动更新 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Tauri 桌面应用加系统托盘(图标 + 显示/退出菜单 + 左键切换窗口)与自动更新(updater/process/dialog 插件,GitHub Releases `latest.json` 渠道,签名校验,启动时检查)。

**Architecture:** 扩展 `src-tauri`(Cargo `tray-icon` feature + 三插件、`lib.rs` 托盘构建 + 注册插件、`tauri.conf.json` updater 配置、capabilities 权限)+ 一个 `isTauri()` 守卫的前端 `updater.ts`(`main.ts` 挂载后调用)+ CI(appindicator 依赖 + 签名 secret env)。Web 构建/测试经守卫不受影响。

**Tech Stack:** Tauri 2(Rust)+ Vue 3/Vite + GitHub Actions(tauri-action)。

**契约/现状(已核对):** spec `docs/superpowers/specs/2026-06-07-p3c-tray-autoupdate-design.md`。`src-tauri/Cargo.toml`:`tauri={version="2",features=[]}`+`tauri-plugin-opener`+serde;`lib.rs` 仅 opener;`capabilities/default.json` 权限 `["core:default","opener:default"]`;`tauri.conf.json` 无 `plugins` 段(末为 `bundle`)。`package.json` 仅 `@tauri-apps/cli`(devDep)。CI `.github/workflows/desktop-release.yml`:ubuntu 装 `libwebkit2gtk-4.1-dev …`,tauri-action step env 有 GITHUB_TOKEN/VITE_API_BASE_URL。`src/main.ts` 创建 app 并挂载。`isTauri` 由 `@tauri-apps/api/core` 提供(`@tauri-apps/api` 是各 plugin JS 包的依赖,装插件后即可 import)。**本机不能 `tauri build/dev`(缺 webkit2gtk-4.1+libayatana-appindicator+无 sudo)——预期。`@tauri-apps/cli` 可 `npx tauri signer generate`。硬约束:既有 64 前端测试保持绿;不得伪称已编译/运行 Tauri。** 仓库 `/home/shane/Code/cim-portal/cim-portal-client`(在 `dev` 上新建 `p3c-tray-update`)。门禁:本机 `npm run verify` + 配置语法校验。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## 文件结构

```
src-tauri/Cargo.toml                  # T1
src-tauri/src/lib.rs                  # T1
src-tauri/tauri.conf.json             # T2(updater + pubkey)
src-tauri/capabilities/default.json   # T2
package.json                          # T3(+3 plugin JS 包)
src/lib/desktop/updater.ts            # T3
src/lib/desktop/updater.spec.ts       # T3
src/main.ts                           # T3
.github/workflows/desktop-release.yml # T4
.gitignore                            # T4(*.key)
src-tauri/README.md                   # T5
```

---

## Task 1: 托盘 + 插件注册(Rust)

**Files:** Modify `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`

- [ ] **Step 1: `Cargo.toml`** — `tauri = { version = "2", features = [] }` 改为 `features = ["tray-icon"]`;`[dependencies]` 追加:
```toml
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
tauri-plugin-dialog = "2"
```

- [ ] **Step 2: 重写 `src-tauri/src/lib.rs`**
```rust
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: 语法核对(本机不编译 Tauri)** — 人工核对括号/分号/导入闭合;`node -e "process.exit(0)"` 占位。**注:不跑 `cargo build`(缺 webkit2gtk-4.1/appindicator)——属预期。** TOML 合法性:`node -e "const fs=require('fs');const t=fs.readFileSync('src-tauri/Cargo.toml','utf8');if(!t.includes('tray-icon')||!t.includes('tauri-plugin-updater'))process.exit(1);console.log('Cargo OK')"`。

- [ ] **Step 4: Commit**
```bash
cd /home/shane/Code/cim-portal/cim-portal-client
git add src-tauri/Cargo.toml src-tauri/src/lib.rs
git commit -m "feat(desktop): 系统托盘(图标+显示/退出菜单+左键切换)+ 注册 updater/process/dialog 插件

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 生成签名密钥 + updater 配置 + 权限

**Files:** Modify `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`

- [ ] **Step 1: 生成签名密钥(私钥留仓库外)**
```bash
cd /home/shane/Code/cim-portal/cim-portal-client
mkdir -p "$HOME/.tauri"
# 无密码生成;-f 覆盖;打印公钥
npx tauri signer generate -w "$HOME/.tauri/cim-portal-updater.key" -p "" -f 2>&1 | tee /tmp/signer.out
echo "=== PUBLIC KEY ==="; cat "$HOME/.tauri/cim-portal-updater.key.pub"
```
记下 `*.pub` 内容(单行 base64,minisign 公钥)。若 `-p ""` 不被接受,改交互留空或用 `--password ""`;关键是产出 `.key`(私钥,仓库外)+ `.key.pub`(公钥)。

- [ ] **Step 2: `tauri.conf.json` 加 `plugins.updater`** — 在顶层(与 `bundle` 同级)加,`pubkey` 填 Step 1 的公钥内容:
```json
  "plugins": {
    "updater": {
      "endpoints": ["https://github.com/shaneworld/Cim-Portal-Client/releases/latest/download/latest.json"],
      "pubkey": "<粘贴 .key.pub 单行内容>"
    }
  }
```
（注意 JSON 逗号:`bundle` 块后加逗号再加 `plugins`。)

- [ ] **Step 3: `capabilities/default.json` 加权限** — `permissions` 数组改为:
```json
  "permissions": ["core:default", "opener:default", "updater:default", "dialog:default", "process:default"]
```

- [ ] **Step 4: 校验** — `node -e "const c=require('./src-tauri/tauri.conf.json'); if(!c.plugins.updater.pubkey||c.plugins.updater.pubkey.includes('粘贴')||c.plugins.updater.pubkey.startsWith('<'))process.exit(1); JSON.parse(require('fs').readFileSync('src-tauri/capabilities/default.json','utf8')); console.log('conf+caps OK; pubkey len', c.plugins.updater.pubkey.length)"` → 公钥已填(非占位)、JSON 合法。

- [ ] **Step 5: Commit(只提交公钥,私钥不入库)**
```bash
git add src-tauri/tauri.conf.json src-tauri/capabilities/default.json
git commit -m "feat(desktop): updater 配置(GitHub Releases latest.json + 公钥)+ updater/dialog/process 权限

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 前端 updater 模块 + JS 插件包 + main 接入

**Files:** Modify `package.json`; Create `src/lib/desktop/updater.ts`, `src/lib/desktop/updater.spec.ts`; Modify `src/main.ts`

- [ ] **Step 1: 装 JS 插件包** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm install @tauri-apps/plugin-updater @tauri-apps/plugin-process @tauri-apps/plugin-dialog @tauri-apps/api`（dependencies;`@tauri-apps/api` 提供 `isTauri`）。

- [ ] **Step 2: 失败测试 `src/lib/desktop/updater.spec.ts`**
```ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => false }))

describe('maybeCheckForUpdates', () => {
  it('非 Tauri 环境直接返回,不抛错', async () => {
    const { maybeCheckForUpdates } = await import('./updater')
    await expect(maybeCheckForUpdates()).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 3: 运行确认 FAIL** — `npm test -- updater` → FAIL(模块未建)。

- [ ] **Step 4: 实现 `src/lib/desktop/updater.ts`**
```ts
import { isTauri } from '@tauri-apps/api/core'

/** Tauri 桌面端:启动时检查更新;web/test 环境为 no-op。 */
export async function maybeCheckForUpdates(): Promise<void> {
  if (!isTauri()) return
  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()
    if (!update) return
    const { ask } = await import('@tauri-apps/plugin-dialog')
    const yes = await ask(`发现新版本 ${update.version},是否现在更新?`, { title: '更新可用', kind: 'info' })
    if (!yes) return
    await update.downloadAndInstall()
    const { relaunch } = await import('@tauri-apps/plugin-process')
    await relaunch()
  } catch (e) {
    console.warn('[updater] 检查更新失败', e)
  }
}
```

- [ ] **Step 5: `src/main.ts` 接入** — 在 app 挂载之后追加(不阻塞、失败静默):
```ts
import('@/lib/desktop/updater').then((m) => m.maybeCheckForUpdates())
```
（放在 `app.mount(...)` 之后;Read main.ts 后按其实际结构插入。）

- [ ] **Step 6: 运行 + typecheck** — `npm test -- updater && npm run typecheck` → updater 测试绿;typecheck 干净(新 JS 包带类型)。

- [ ] **Step 7: Commit**
```bash
git add package.json package-lock.json src/lib/desktop/updater.ts src/lib/desktop/updater.spec.ts src/main.ts
git commit -m "feat(desktop): 启动时自动检查更新(isTauri 守卫,确认→下载→重启)+ updater/process/dialog JS 插件

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: CI(appindicator 依赖 + 签名 secret)+ gitignore 私钥

**Files:** Modify `.github/workflows/desktop-release.yml`, `.gitignore`

- [ ] **Step 1: Read** `.github/workflows/desktop-release.yml`(确认 ubuntu apt 安装行与 tauri-action step 的 `env:` 块)。

- [ ] **Step 2: ubuntu 依赖追加 appindicator** — 在 `apt-get install -y` 列表末尾(ubuntu 步骤)加 `libayatana-appindicator3-dev`(与其它 `\` 续行风格一致)。

- [ ] **Step 3: tauri-action step env 追加签名 secret** — 在该 step 现有 `env:`(GITHUB_TOKEN/VITE_API_BASE_URL)下追加:
```yaml
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

- [ ] **Step 4: `.gitignore` 兜底** — 追加 `*.key`(防私钥误入库;私钥本就在仓库外,双保险)。

- [ ] **Step 5: YAML 校验** — `npm install --no-save js-yaml >/dev/null 2>&1; node -e "const j=require('js-yaml');const d=j.load(require('fs').readFileSync('.github/workflows/desktop-release.yml','utf8'));const s=JSON.stringify(d);if(!s.includes('appindicator')||!s.includes('TAURI_SIGNING_PRIVATE_KEY'))process.exit(1);console.log('YAML OK')"`。

- [ ] **Step 6: Commit**
```bash
git add .github/workflows/desktop-release.yml .gitignore
git commit -m "ci(desktop): 安装 appindicator(托盘)+ 传入 TAURI_SIGNING_PRIVATE_KEY(签名/latest.json)+ gitignore *.key

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 验证 + README + 边界/操作项汇报

**Files:** Modify `src-tauri/README.md`

- [ ] **Step 1: 全量门禁(本机可验)** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → typecheck 干净、**既有 64 + updater 共 65 测试绿**、`vite build` OK。
- [ ] **Step 2: 配置完整性** — 确认:`Cargo.toml` 有 `tray-icon` + 三插件;`tauri.conf.json` `plugins.updater.endpoints/pubkey`(公钥非占位);`capabilities` 含 updater/dialog/process;workflow 含 appindicator + 签名 secret;`*.key` 已被 gitignore 且 `git status` 无 `.key`/`.pub` 入库(私钥在仓库外)。
- [ ] **Step 3: README 追加「托盘 + 自动更新」段** — 含:托盘 显示/退出 + 左键切换;更新走 GitHub Releases `latest.json`,启动检查→确认→下载→重启;**用户操作项**:① 仓库须 public(否则改内部 host);② 私钥(`~/.tauri/cim-portal-updater.key`)加为 GH secret `TAURI_SIGNING_PRIVATE_KEY`;③ 更新仅从已发布(非草稿)release 下发;④ 本机试运行需 `sudo pacman -S webkit2gtk-4.1 libayatana-appindicator`。
- [ ] **Step 4: Commit**
```bash
git add src-tauri/README.md
git commit -m "docs(desktop): 托盘 + 自动更新说明与用户操作项(public 仓库/签名 secret/发布 release)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
- [ ] **Step 5: 边界汇报** — 明确:托盘 + 自动更新代码/配置/CI 已就绪并过本机可验项;**Tauri 编译、托盘渲染、真实更新流程未在本机执行**(缺 webkit2gtk-4.1/libayatana-appindicator/无 sudo);需用户装依赖本地试运行,或推 `v*` tag 经 CI 出签名包 + `latest.json`(并发布草稿 release、配置 secret、确保仓库 public)。

---

## 自检清单(Self-Review)

**规格覆盖(spec §4–§9):** 托盘 + 插件注册 → T1;签名密钥 + updater 配置 + 权限 → T2;前端 updater + JS 包 + main 接入 + 测试 → T3;CI appindicator + 签名 secret + gitignore 私钥 → T4;验证 + README + 用户操作项 + 边界汇报 → T5。诚实边界(本机不编译 Tauri)→ T1/T3/T5 标注。

**占位符扫描:** 无 TBD;代码/JSON/YAML/命令完整。pubkey 由 T2 实生成填入(T2 Step4 断言非占位)。lib.rs 标注「以 Tauri 2 当前 API 名为准,保持语义」(API 名可能微调,本机不可编译验证 → 语义固定 + CI 兜底)。

**类型/命名一致性:** `maybeCheckForUpdates`(updater.ts 定义 ↔ main.ts 调用 ↔ spec 测试);Cargo 插件 `tauri-plugin-{updater,process,dialog}` ↔ lib.rs `tauri_plugin_*::{Builder::new().build()/init()}`;capabilities `updater:default`/`dialog:default`/`process:default`;CI secret `TAURI_SIGNING_PRIVATE_KEY` ↔ tauri-action;endpoint URL ↔ spec。**硬约束**(64→65 测试绿、私钥不入库、不伪称已编译 Tauri)在 T3/T5 复核。
