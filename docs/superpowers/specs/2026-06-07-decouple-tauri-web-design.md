# Tauri 与 Web 前端解耦(轻量,单仓)设计

**日期:** 2026-06-07
**状态:** 设计已确认,进入实现计划
**背景:** 桌面集成(P3a–c)使 `cim-portal-client` 同时含 Web 与 Tauri。Web 已可独立运行(`npm run dev`/`build` 不触 Tauri,updater 经 `isTauri()` 守卫 no-op,产物仅一个 2.7KB 惰性 `updater` chunk)。本期让**默认 Web 构建/安装彻底不含 Tauri**,桌面集成改为**按 Vite mode 选择性启用**。单仓、不挪文件。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 解耦层级 | **轻量,单仓**:Web 默认 100% 无 Tauri;桌面构建经 `--mode desktop` 选择性纳入。 |

## 2. 现状(已核对)

- `package.json` scripts:`dev/build/typecheck/test/verify` + `tauri/tauri:dev/tauri:build`。Tauri deps(均 `dependencies`/`devDependencies`):`@tauri-apps/api`、`plugin-updater`、`plugin-process`、`plugin-dialog`、`cli`(devDep)。
- 静态 Tauri import 仅 `src/lib/desktop/updater.ts`(`@tauri-apps/api/core` 的 `isTauri`;插件为动态 import)。`src/main.ts` 动态 `import('@/lib/desktop/updater')` 并调用 `maybeCheckForUpdates()`(无条件)。
- `npm run build` 产物 `dist` 含 `updater-*.js`(2.7KB 惰性 chunk);主包无 `tauri` 字面量。即:Web 运行时不加载,但 chunk 仍被 emit。
- `tauri.conf.json`:`beforeDevCommand: npm run dev`、`beforeBuildCommand: npm run build`。
- `.gitignore`:忽略 `.env`、`.env.*`,例外 `!.env.example`;另有 `*.key`。

## 3. 方案

构建期开关 `import.meta.env.VITE_DESKTOP`(Vite 按 mode 静态替换)→ Web 默认构建里 `main.ts` 的 updater 动态 import 被死代码消除,`updater.ts` → `@tauri-apps/*` 整条子图不进 Web 产物;`@tauri-apps/*` 运行时包降为 `optionalDependencies`(纯 Web 安装可 `--omit=optional` 跳过)。

## 4. 组件与文件

```
package.json            # deps→optionalDependencies;+ dev:desktop / build:desktop 脚本
.env.desktop            # 新(提交):VITE_DESKTOP=true
.gitignore              # + 例外 !.env.desktop
src/main.ts             # updater 动态 import 包到 VITE_DESKTOP 守卫内
src/vite-env.d.ts       # + VITE_DESKTOP?: string
src-tauri/tauri.conf.json # beforeDev/Build → :desktop 脚本
```
`src/lib/desktop/updater.ts`、`updater.spec.ts` 不改。

## 5. 细节

**package.json**
- 从 `dependencies` 移除并加入 `optionalDependencies`:`@tauri-apps/api`、`@tauri-apps/plugin-updater`、`@tauri-apps/plugin-process`、`@tauri-apps/plugin-dialog`(版本不变)。`@tauri-apps/cli` 留 `devDependencies`。
- scripts 增:
  ```json
  "dev:desktop": "vite --mode desktop",
  "build:desktop": "vue-tsc --noEmit && vite build --mode desktop"
  ```
  `dev`/`build`/`verify` 不变(纯 Web)。

**.env.desktop**(提交,非密钥)
```
VITE_DESKTOP=true
```

**.gitignore** — 在 `!.env.example` 后加 `!.env.desktop`(否则被 `.env.*` 规则忽略)。

**src/main.ts** — 现 `import('@/lib/desktop/updater').then((m) => m.maybeCheckForUpdates())` 改为:
```ts
if (import.meta.env.VITE_DESKTOP === 'true') {
  import('@/lib/desktop/updater').then((m) => m.maybeCheckForUpdates())
}
```
Web mode(未设)→ `import.meta.env.VITE_DESKTOP` 被替换为 `undefined` → `undefined === 'true'` 折叠为 `false` → esbuild DCE 移除该动态 import 及其子图。desktop mode → `"true"` → 保留。

**src/vite-env.d.ts** — `ImportMetaEnv` 加 `readonly VITE_DESKTOP?: string`。

**tauri.conf.json** — `beforeDevCommand: "npm run dev:desktop"`、`beforeBuildCommand: "npm run build:desktop"`(桌面 dev/build 时开启 flag)。

## 6. 数据流

- Web:`npm run dev`/`build`(默认 mode)→ `VITE_DESKTOP` 未定义 → updater 不导入、不打包 → 产物零 Tauri;`npm ci --omit=optional` 可不装 `@tauri-apps/*` 仍能 `npm run build`。
- 桌面:`npm run tauri:dev`/`tauri:build` → 经 `:desktop` 脚本(`--mode desktop`,读 `.env.desktop`)→ `VITE_DESKTOP=true` → updater 纳入并运行(`isTauri()` 为真时检查更新)。

## 7. 验证(本机可验)

- **Web 构建零 Tauri**:`npm run build` 后 `dist/assets/` 无 `updater*` chunk;`grep -rl '@tauri-apps' dist` 与 `tauri` 字面量均无。
- **桌面构建含 updater**:`npm run build:desktop` 后 `dist` 出现 `updater*` chunk(含 `@tauri-apps` 动态 chunk)。
- **纯 Web 安装可行**:`npm ci --omit=optional` 后 `npm run build` 成功(不依赖 `@tauri-apps/*`)→ 再 `npm ci` 复原(供测试/桌面)。
- 既有 **65 测试**保持绿(`updater.spec` mock `isTauri`,`@tauri-apps/api` 为 optional 仍本地安装 → 通过)。`npm run typecheck` 干净。

**不可验(不变边界):** `tauri build`/`tauri dev`(缺 webkit2gtk-4.1/appindicator/无 sudo)。

## 8. 不在范围内(YAGNI)

结构性拆分(独立 desktop 包/仓);移动 `src-tauri`;改 updater 逻辑;CI 拆分(CI 桌面构建经 tauri-action,其 beforeBuildCommand 已走 `:desktop`,无需额外改——`tauri.conf` 已指向 `build:desktop`)。
