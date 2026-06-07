# Tauri/Web 解耦(轻量单仓)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 默认 Web 构建/安装彻底不含 Tauri;桌面集成经 Vite `--mode desktop` 选择性启用。单仓、不挪文件。

**Architecture:** 构建期开关 `import.meta.env.VITE_DESKTOP`(`.env.desktop` 提供,Vite 静态替换)守卫 `main.ts` 的 updater 动态 import → Web 默认构建 DCE 掉整条 `@tauri-apps/*` 子图;`@tauri-apps/*` 运行时包降为 `optionalDependencies`。

**Tech Stack:** Vue 3 + Vite(mode/env)+ Tauri 2(仅桌面 mode)。

**契约/现状(已核对):** spec `docs/superpowers/specs/2026-06-07-decouple-tauri-web-design.md`。`package.json` `dependencies` 含 `@tauri-apps/api`、`plugin-updater`、`plugin-process`、`plugin-dialog`;`devDependencies` 含 `@tauri-apps/cli`;scripts 有 `dev/build/typecheck/test/verify/tauri/tauri:dev/tauri:build`。`src/main.ts` 末行无条件 `import('@/lib/desktop/updater').then((m) => m.maybeCheckForUpdates())`。`src/vite-env.d.ts` 含 `ImportMetaEnv { VITE_API_BASE_URL?: string }`。`tauri.conf.json` `beforeDevCommand: "npm run dev"`、`beforeBuildCommand: "npm run build"`。`.gitignore` 有 `.env`/`.env.*`/`!.env.example`/`*.key`。`updater.ts` 静态 import `@tauri-apps/api/core`;`updater.spec.ts` mock 之。**硬约束:既有 65 测试保持绿;Web 默认产物零 Tauri;桌面产物含 updater;不伪称已编译 Tauri。** 仓库 `/home/shane/Code/cim-portal/cim-portal-client`,分支 `dev`(新建 `decouple-tauri`)。门禁:`npm run verify` + dist 检查。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## 文件结构

```
package.json              # T1(deps→optional + 脚本)
.env.desktop              # T1(新)
.gitignore                # T1(+ !.env.desktop)
src/main.ts               # T2(VITE_DESKTOP 守卫)
src/vite-env.d.ts         # T2(类型)
src-tauri/tauri.conf.json # T2(beforeDev/Build → :desktop)
```

---

## Task 1: package.json 重分类 + 桌面脚本 + .env.desktop

**Files:** Modify `package.json`, `.gitignore`; Create `.env.desktop`

- [ ] **Step 1: Read `package.json`** 确认 `dependencies`/`devDependencies`/`scripts` 精确文本。

- [ ] **Step 2: 移动 4 个 `@tauri-apps` 运行时包到 `optionalDependencies`** — 从 `dependencies` 删除 `@tauri-apps/api`、`@tauri-apps/plugin-updater`、`@tauri-apps/plugin-process`、`@tauri-apps/plugin-dialog`,新增顶层 `"optionalDependencies": { ...这4个,版本不变 }`。`@tauri-apps/cli` 留 `devDependencies` 不动。

- [ ] **Step 3: 加桌面脚本** — `scripts` 增(`dev`/`build`/`verify` 不改):
```json
"dev:desktop": "vite --mode desktop",
"build:desktop": "vue-tsc --noEmit && vite build --mode desktop"
```

- [ ] **Step 4: 创建 `.env.desktop`**
```
VITE_DESKTOP=true
```

- [ ] **Step 5: `.gitignore` 加例外** — 在 `!.env.example` 行后加 `!.env.desktop`。

- [ ] **Step 6: 同步安装(确保 optionalDependencies 落锁文件)** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm install 2>&1 | tail -3`(刷新 `package-lock.json`;optional 包仍本地安装)。确认 `.env.desktop` 被 git 跟踪:`git check-ignore .env.desktop && echo IGNORED || echo TRACKED` → 期望 `TRACKED`。

- [ ] **Step 7: Commit**
```bash
git add package.json package-lock.json .gitignore .env.desktop
git commit -m "build(desktop): @tauri-apps/* 降为 optionalDependencies + dev:desktop/build:desktop(--mode desktop)+ .env.desktop

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: VITE_DESKTOP 守卫 + 类型 + tauri.conf 指向桌面脚本

**Files:** Modify `src/main.ts`, `src/vite-env.d.ts`, `src-tauri/tauri.conf.json`

- [ ] **Step 1: `src/main.ts`** — 将末行
```ts
import('@/lib/desktop/updater').then((m) => m.maybeCheckForUpdates())
```
改为(连同上方注释):
```ts
// 桌面(Tauri,--mode desktop)构建才纳入并运行;Web 默认构建经 DCE 移除整条 Tauri 子图
if (import.meta.env.VITE_DESKTOP === 'true') {
  import('@/lib/desktop/updater').then((m) => m.maybeCheckForUpdates())
}
```

- [ ] **Step 2: `src/vite-env.d.ts`** — 在 `interface ImportMetaEnv {` 内加一行 `readonly VITE_DESKTOP?: string`(与既有 `VITE_API_BASE_URL` 并列)。

- [ ] **Step 3: `src-tauri/tauri.conf.json`** — `"beforeDevCommand": "npm run dev"` → `"npm run dev:desktop"`;`"beforeBuildCommand": "npm run build"` → `"npm run build:desktop"`。

- [ ] **Step 4: typecheck + 测试** — `npm run typecheck && npm test 2>&1 | grep -E 'Tests |error TS' | tail -3` → typecheck 干净;**65 测试绿**(updater.spec 仍 mock isTauri,@tauri-apps/api 为 optional 但本地已装 → 通过)。

- [ ] **Step 5: Commit**
```bash
git add src/main.ts src/vite-env.d.ts src-tauri/tauri.conf.json
git commit -m "feat(desktop): updater 仅在 VITE_DESKTOP 构建纳入;tauri.conf 走 :desktop 脚本(Web 默认零 Tauri)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 验证(Web 零 Tauri / 桌面含 updater / 纯 Web 安装)

**Files:** 无(验证 + 收尾提交如需)

- [ ] **Step 1: Web 默认构建零 Tauri**
```bash
cd /home/shane/Code/cim-portal/cim-portal-client
rm -rf dist && npm run build >/dev/null 2>&1 && echo "web build OK"
echo "--- updater chunk?（应无）---"; ls dist/assets/ | grep -i 'updater' || echo "(no updater chunk — GOOD)"
echo "--- @tauri-apps in dist?（应无）---"; grep -rl '@tauri-apps' dist 2>/dev/null || echo "(none — GOOD)"
echo "--- tauri 字面量?（应无）---"; grep -rl 'tauri' dist/assets/*.js 2>/dev/null || echo "(none — GOOD)"
```
Expected:web build OK;无 updater chunk;dist 无 `@tauri-apps`/`tauri`。

- [ ] **Step 2: 桌面构建含 updater**
```bash
rm -rf dist && npm run build:desktop >/dev/null 2>&1 && echo "desktop build OK"
ls dist/assets/ | grep -i 'updater' && echo "(updater chunk present — GOOD)" || echo "(MISSING updater chunk — BAD)"
```
Expected:出现 `updater*` chunk。

- [ ] **Step 3: 纯 Web 安装可构建(无 Tauri 包)**
```bash
npm ci --omit=optional 2>&1 | tail -2
rm -rf dist && npm run build >/dev/null 2>&1 && echo "web build (no tauri pkgs) OK" || echo "web build FAILED"
ls node_modules/@tauri-apps 2>/dev/null && echo "(tauri pkgs present?)" || echo "(no @tauri-apps installed — confirms web independence)"
npm ci 2>&1 | tail -2   # 复原:装回 optional 包供测试/桌面
```
Expected:`--omit=optional` 后 `npm run build` 成功且 `@tauri-apps` 未安装;复原后 optional 包回来。

- [ ] **Step 4: 全量门禁** — `npm run verify 2>&1 | grep -E 'Tests |✓ built' | tail -2` → 65 测试绿、build OK(默认 Web,零 Tauri)。

- [ ] **Step 5: 汇报** — 明确:`npm run dev`/`build`/`npm ci --omit=optional` 完全无 Tauri;桌面经 `npm run tauri:dev`/`tauri:build`(内部 `--mode desktop`)纳入 updater。Tauri 本机仍不编译(边界不变)。

---

## 自检清单(Self-Review)

**规格覆盖(spec §4/§5/§7):** deps→optional + `:desktop` 脚本 + `.env.desktop` + gitignore 例外 → T1;`main.ts` 守卫 + 类型 + `tauri.conf` 指向 → T2;Web 零 Tauri / 桌面含 updater / 纯 Web 安装 / 全量 → T3。

**占位符扫描:** 无 TBD;改动以精确文本/命令给出。`.env.desktop` 跟踪由 T1 Step6 `git check-ignore` 断言。

**类型/命名一致性:** `VITE_DESKTOP`(`.env.desktop` ↔ `main.ts` 守卫 ↔ `vite-env.d.ts` 类型);`dev:desktop`/`build:desktop`(package.json ↔ `tauri.conf` beforeDev/Build);optionalDependencies 4 包与 spec 一致。**硬约束**(65 测试绿、Web 产物零 Tauri、桌面含 updater)在 T2/T3 复验。
