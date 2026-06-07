# P3c 系统托盘 + 自动更新 设计

**日期:** 2026-06-07
**状态:** 设计已确认(用户 "go"),进入实现计划
**背景:** 续 P3a(脚手架/CI)、P3b(CORS)。本期为 Tauri 桌面应用加**系统托盘**(图标 + 菜单)与**自动更新**(`tauri-plugin-updater`,GitHub Releases `latest.json` 渠道,签名校验,启动时检查)。仓库 `cim-portal-client`(分支 `dev`),src-tauri 内。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 范围 | 托盘 + 自动更新一并完成(一个 P3c)。 |
| 更新渠道 | **GitHub Releases `latest.json`**:`https://github.com/shaneworld/Cim-Portal-Client/releases/latest/download/latest.json`。**前提:仓库需 public**(私有仓库 release 资源需鉴权,届时改内部 host)。 |
| 签名密钥 | 生成密钥对;**仅公钥提交**进 conf;私钥写仓库外(gitignore),用户加为 GH secret `TAURI_SIGNING_PRIVATE_KEY`。 |
| 托盘关闭行为 | 关闭窗口=默认退出(不劫持为隐藏到托盘);托盘菜单提供 显示/退出 + 左键点击切换窗口。 |

## 2. 现状(已核对)

- `src-tauri/Cargo.toml`:`tauri = {version="2",features=[]}` + `tauri-plugin-opener`;`lib.rs` 仅注册 opener;`capabilities/default.json` 权限 `core:default`+`opener:default`。
- `tauri.conf.json`:无 `plugins` 段。`package.json` 仅 `@tauri-apps/cli`(无 plugin JS 包)。
- CI `.github/workflows/desktop-release.yml`:`tauri-apps/tauri-action@v0`,ubuntu 装 webkit/gtk/soup/rsvg 等;env 有 `GITHUB_TOKEN`、`VITE_API_BASE_URL`;`releaseDraft: true`。
- **本机不能编译/运行 Tauri**(缺 `webkit2gtk-4.1`、`libayatana-appindicator`、无免密 sudo)。`@tauri-apps/cli` 可用(`npx tauri signer generate`)。

## 3. 组件与文件

```
src-tauri/Cargo.toml                 # +tray-icon feature, +updater/process/dialog 插件
src-tauri/src/lib.rs                 # 注册插件 + 托盘构建
src-tauri/tauri.conf.json            # +plugins.updater(endpoints+pubkey)
src-tauri/capabilities/default.json  # +updater/process/dialog 权限
src/lib/desktop/updater.ts           # 新:maybeCheckForUpdates()(isTauri 守卫)
src/lib/desktop/updater.spec.ts      # 新:非 Tauri 环境 no-op 测试
src/main.ts                          # 改:挂载后调用 maybeCheckForUpdates()
package.json                         # +@tauri-apps/plugin-{updater,process,dialog}
.github/workflows/desktop-release.yml# 改:+appindicator 依赖 + 签名 secret env
src-tauri/.gitignore / 根 .gitignore # 忽略 *.key(私钥不入库)
src-tauri/README.md                  # 托盘/更新说明 + 用户操作项
```

## 4. 托盘(Rust)

- `Cargo.toml`:`tauri = { version = "2", features = ["tray-icon"] }`。
- `lib.rs`(`run()` 内,`.setup(|app| { ... })`):
```rust
use tauri::{menu::{Menu, MenuItem}, tray::TrayIconBuilder, Manager};
// setup:
let show = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
let menu = Menu::with_items(app, &[&show, &quit])?;
let _tray = TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .show_menu_on_left_click(false)
    .on_menu_event(|app, e| match e.id.as_ref() {
        "show" => { if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); } }
        "quit" => app.exit(0),
        _ => {}
    })
    .on_tray_icon_event(|tray, event| {
        if let tauri::tray::TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, button_state: tauri::tray::MouseButtonState::Up, .. } = event {
            let app = tray.app_handle();
            if let Some(w) = app.get_webview_window("main") {
                if w.is_visible().unwrap_or(false) { let _ = w.hide(); } else { let _ = w.show(); let _ = w.set_focus(); }
            }
        }
    })
    .build(app)?;
```
（最终以 Tauri 2 当前 API 名为准;实现时若签名微调,保持语义:图标=默认窗口图标、菜单 显示/退出、左键切换窗口。）
- CI ubuntu 依赖追加 `libayatana-appindicator3-dev`。

## 5. 自动更新

- `Cargo.toml` `[dependencies]` 追加:`tauri-plugin-updater = "2"`、`tauri-plugin-process = "2"`、`tauri-plugin-dialog = "2"`。
- `lib.rs` 链:`.plugin(tauri_plugin_updater::Builder::new().build()).plugin(tauri_plugin_process::init()).plugin(tauri_plugin_dialog::init())`(opener 之外)。
- `tauri.conf.json` 加:
```json
"plugins": {
  "updater": {
    "endpoints": ["https://github.com/shaneworld/Cim-Portal-Client/releases/latest/download/latest.json"],
    "pubkey": "<GENERATED_MINISIGN_PUBKEY>"
  }
}
```
- `capabilities/default.json` 权限追加:`"updater:default"`, `"core:default"` 已有,`"dialog:default"`,`"process:default"`(`process:default` 含 relaunch;若不含则 `process:allow-restart`)。
- JS 包:`@tauri-apps/plugin-updater`、`@tauri-apps/plugin-process`、`@tauri-apps/plugin-dialog`(dependencies)。
- `src/lib/desktop/updater.ts`:
```ts
import { isTauri } from '@tauri-apps/api/core'

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
（动态 `import` 仅在 Tauri 内触发,避免 web/test 加载插件运行时;`isTauri()` 守卫。）
- `src/main.ts`:挂载后 `import('@/lib/desktop/updater').then(m => m.maybeCheckForUpdates())`(不阻塞启动,失败静默)。

## 6. CI 改动(desktop-release.yml)

- ubuntu 依赖步骤追加 `libayatana-appindicator3-dev`。
- `tauri-apps/tauri-action` 步骤 `env` 追加:
  ```yaml
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
  ```
  (有 updater 配置 + 签名密钥时,tauri-action 自动签名并生成/上传 `latest.json`。)

## 7. 签名密钥处理

- 实现时 `npx tauri signer generate -w <仓库外路径,如 ~/.tauri/cim-portal-updater.key>`(无密码)→ 打印公钥。
- 公钥写入 `tauri.conf.json` `plugins.updater.pubkey`(可提交)。
- **私钥文件留仓库外,绝不提交**;`.gitignore` 加 `*.key` 兜底。
- 用户操作:把私钥内容加为 GH secret `TAURI_SIGNING_PRIVATE_KEY`(若设了密码再加 `_PASSWORD`)。用户可自行重新生成以掌控密钥来源。

## 8. 测试 / 验证(诚实边界)

**本机可验:**
- `updater.spec.ts`:mock `@tauri-apps/api/core` 的 `isTauri` 返回 false → `maybeCheckForUpdates()` 直接返回,不动态 import 插件、不抛错。
- `tauri.conf.json`/`capabilities` JSON 合法、`Cargo.toml` TOML 合法、workflow YAML 合法、pubkey 非占位。
- `npm run verify`:既有 **64 测试 + 新 updater 测试**绿,`vite build` OK。

**本机不可验(CI / 装好依赖的机器):**
- `tauri build`/`tauri dev`(缺 webkit + appindicator)。
- 托盘渲染/菜单/点击行为;真实更新检查→下载→签名校验→重启。

实现计划须显式标注「Tauri 编译/托盘/更新行为不在本机执行」。

## 9. 用户操作项(非代码)

1. **仓库须 public**,否则 `releases/latest/download/latest.json` 取不到(改内部 host)。
2. 把生成的**私钥**加为 GH secret `TAURI_SIGNING_PRIVATE_KEY`。
3. 更新仅从**已发布(非草稿)** release 下发——发布 CI 生成的草稿 release。
4. 装本机依赖试运行:`sudo pacman -S webkit2gtk-4.1 libayatana-appindicator` 后 `npm run tauri:dev`。

## 10. 不在范围内(YAGNI / 后续)

OS 级代码签名/公证(Windows Authenticode / macOS notarization);增量/差分更新;更新进度条 UI;托盘消息通知;hide-to-tray 关闭行为;内部 host 更新渠道(若仓库私有再做)。
