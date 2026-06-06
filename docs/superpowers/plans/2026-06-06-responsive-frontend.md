# 全前端响应式实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让整个玻璃前端在 ~360px → ultrawide 全宽度区间自适应、无横向溢出,修复登录页与 AppHeader 的窄屏破绽。

**Architecture:** 纯响应式 CSS class 调整(Tailwind 断点),不改组件逻辑。修复 LoginView / AccountInactiveView 的 360px 溢出与 AppHeader 的窄屏重排;其余组件验证现有断点。新增一个多宽度溢出校验脚本作为验收。

**Tech Stack:** Vue 3 + Tailwind v3 + Vitest(既有 37 测试保持绿)+ Playwright(playwright-core,多宽度溢出校验)。

**契约/现状:** spec `docs/superpowers/specs/2026-06-06-responsive-frontend-design.md`。决策:rail `<md` 隐藏(不改);内容 `max-w-7xl` 居中(不改);最小 360px 无横向溢出。仓库 `/home/shane/Code/cim-portal/cim-portal-frontend`(在 `master` 上新建 `responsive`)。门禁 `npm run typecheck && npm test`;响应式验收用 Playwright 脚本。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。**后端冒烟需 `SPRING_PROFILES_ACTIVE=dev` 在 :8080**(dev 登录 + home 数据;已 seed 64 条 link 便于看滚动/换行)。

---

## 文件结构

```
src/features/auth/LoginView.vue            # 修 360 溢出(修改)
src/features/auth/AccountInactiveView.vue  # 卡片 w-full(修改)
src/features/dashboard/AppHeader.vue       # 窄屏重排(修改)
src/features/dashboard/HeroPanel.vue       # 验证/小调(可能修改)
src/features/dashboard/GlobalSearch.vue    # 验证(可能不改)
src/features/dashboard/SystemCard.vue      # 验证 min-w-0/truncate(可能不改)
```

无新增单测(响应式为样式);验收用临时 Playwright 脚本(不入库)。

---

## Task 1: LoginView 360px 溢出修复

**Files:** Modify `src/features/auth/LoginView.vue`

当前(关键):外层 `<div class="grid min-h-screen place-items-center p-6">`,卡片 `<GlassCard class="... max-w-md ...">`,身份按钮内有 `工号·部门·角色` 长文本。360px 下 bodyScrollW=388 溢出。

- [ ] **Step 1: 起本地 dev + 基线溢出测量(确认问题存在)**

```bash
cd /home/shane/Code/cim-portal/cim-portal-frontend
fuser -k 5173/tcp 2>/dev/null; sleep 1
npm install --no-save playwright-core >/dev/null 2>&1
nohup npm run dev -- --port 5173 >/tmp/fe.log 2>&1 &
for i in $(seq 1 25); do curl -s -o /dev/null http://localhost:5173 && break; sleep 1; done
```
Write `/tmp/ov.cjs`:
```js
const { chromium } = require('playwright-core')
const W = Number(process.argv[2] || 360), LOGIN = process.argv[3] === 'login'
;(async () => {
  const b = await chromium.launch({ executablePath: '/home/shane/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome' })
  const p = await b.newPage({ viewport: { width: W, height: 760 } })
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  if (!LOGIN) { try { await p.getByRole('button', { name: /OP1/ }).click(); await p.waitForURL('http://localhost:5173/') } catch {} }
  await p.waitForTimeout(700)
  const m = await p.evaluate(() => ({ b: document.body.scrollWidth, w: window.innerWidth }))
  console.log(`W=${W} ${LOGIN?'login':'home'} body=${m.b} win=${m.w} OVERFLOW=${m.b>m.w}`)
  await b.close()
})().catch(e=>{console.error(e.message);process.exit(1)})
```
Run: `NODE_PATH=$(pwd)/node_modules node /tmp/ov.cjs 360 login`
Expected (baseline): `OVERFLOW=true`.

- [ ] **Step 2: 实现修复**

`LoginView.vue` 模板根容器:`p-6` → `p-4 sm:p-6`。卡片 class:`max-w-md` → `w-full max-w-md`。身份按钮:确保盛放姓名/部门/角色的容器 `min-w-0`,长文本块加 `break-words`(或角色行 `truncate`)。例如身份按钮行结构应为:
```vue
<button class="flex w-full items-center gap-3 ..." ...>
  <span class="grid size-10 shrink-0 place-items-center rounded-xl ...">…icon…</span>
  <span class="min-w-0 flex-1 text-left">
    <span class="block truncate font-semibold">{{ id }} · {{ nameZh }}</span>
    <span class="block truncate text-xs text-ink-3">{{ dept }} · {{ role }}</span>
  </span>
  <ChevronRight class="size-4 shrink-0 text-ink-3" />
</button>
```
关键:盛文本的中间 `span` 必须 `min-w-0`(否则 flex 子项不收缩 → 撑破),长行 `truncate`。**读取现有 LoginView.vue 后,在其既有结构上施加 `w-full max-w-md`(卡片)、`p-4 sm:p-6`(容器)、`min-w-0`(文本容器)、`truncate`(长文本)这几处,不改变逻辑/DEV_IDENTITIES 渲染。**

- [ ] **Step 3: 复测 360 无溢出**

Run: `NODE_PATH=$(pwd)/node_modules node /tmp/ov.cjs 360 login`
Expected: `OVERFLOW=false`。

- [ ] **Step 4: typecheck + 全量单测**

Run: `npm run typecheck && npm test`
Expected: typecheck 干净;37 passed。

- [ ] **Step 5: Commit**
```bash
git add src/features/auth/LoginView.vue
git commit -m "fix(responsive): 登录页 360px 横向溢出(卡片 w-full + 文本 min-w-0/truncate)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: AccountInactiveView 卡片自适应

**Files:** Modify `src/features/auth/AccountInactiveView.vue`

当前:`<div class="grid min-h-screen place-items-center p-6"><GlassCard class="max-w-md p-10 text-center ...">`。

- [ ] **Step 1: 实现**

容器 `p-6` → `p-4 sm:p-6`;卡片 `max-w-md` → `w-full max-w-md`;`p-10` → `p-8 sm:p-10`(窄屏内边距收一点)。其余不变。

- [ ] **Step 2: 360 无溢出校验**

该页无 dev 登录路由守卫?直接访问 `/account-inactive`。用脚本:
```bash
NODE_PATH=$(pwd)/node_modules node -e "
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/home/shane/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'});
const p=await b.newPage({viewport:{width:360,height:760}});
await p.goto('http://localhost:5173/account-inactive',{waitUntil:'networkidle'});await p.waitForTimeout(500);
const m=await p.evaluate(()=>({b:document.body.scrollWidth,w:window.innerWidth}));
console.log('account-inactive 360 body='+m.b+' win='+m.w+' OVERFLOW='+(m.b>m.w));await b.close();})();
"
```
Expected: `OVERFLOW=false`。(若该路由重定向到 /login,记录即可,卡片样式修复仍有效。)

- [ ] **Step 3: typecheck + 单测**

Run: `npm run typecheck && npm test` → 干净;37 passed。

- [ ] **Step 4: Commit**
```bash
git add src/features/auth/AccountInactiveView.vue
git commit -m "fix(responsive): account-inactive 卡片 w-full + 窄屏内边距

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: AppHeader 窄屏重排

**Files:** Modify `src/features/dashboard/AppHeader.vue`

当前模板:
```vue
<GlassCard class="flex items-center justify-between p-3 sm:p-4">
  <div class="flex items-center gap-2.5">
    <span class="grid size-8 place-items-center rounded-lg bg-brand font-extrabold text-white shadow-lg shadow-indigo-500/25">C</span>
    <b class="text-lg">CIM 门户</b>
  </div>
  <nav class="flex items-center gap-1.5">
    <RouterLink v-if="auth.isAdmin" to="/admin" class="mr-1 inline-flex h-9 items-center rounded-xl bg-brand px-3 text-sm font-semibold text-white">管理</RouterLink>
    <span class="px-1 text-sm text-ink-2">{{ name }} · {{ auth.currentUser?.employeeId }}</span>
    <Button variant="ghost" size="sm" class="gap-1.5" @click="toggleLocale"><Languages class="size-4" /> {{ locale === 'zh' ? 'EN' : '中' }}</Button>
    <Button variant="ghost" size="icon" @click="cycleTheme"><component :is="ThemeIcon" class="size-4" /></Button>
    <Button variant="ghost" size="icon" @click="logout"><LogOut class="size-4" /></Button>
  </nav>
</GlassCard>
```

- [ ] **Step 1: 实现 — 防换行 + 窄屏隐藏姓名**

施加以下改动(保留逻辑/事件不变):
- 品牌容器加 `shrink-0`;`<b class="text-lg">` 加 `whitespace-nowrap`(避免「CIM 门户」换行)。
- 姓名行 `<span class="px-1 text-sm text-ink-2">…</span>` → 加 `hidden truncate sm:inline max-w-[40vw]`(手机隐藏;sm+ 显示且超长截断,避免长姓名撑破)。
- `<nav>` 加 `min-w-0`(允许收缩),保持 `gap-1.5`。
最终模板:
```vue
<GlassCard class="flex items-center justify-between gap-2 p-3 sm:p-4">
  <div class="flex shrink-0 items-center gap-2.5">
    <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-brand font-extrabold text-white shadow-lg shadow-indigo-500/25">C</span>
    <b class="whitespace-nowrap text-lg">CIM 门户</b>
  </div>
  <nav class="flex min-w-0 items-center gap-1.5">
    <RouterLink v-if="auth.isAdmin" to="/admin" class="mr-1 inline-flex h-9 shrink-0 items-center rounded-xl bg-brand px-3 text-sm font-semibold text-white">管理</RouterLink>
    <span class="hidden max-w-[40vw] truncate px-1 text-sm text-ink-2 sm:inline">{{ name }} · {{ auth.currentUser?.employeeId }}</span>
    <Button variant="ghost" size="sm" class="shrink-0 gap-1.5" @click="toggleLocale"><Languages class="size-4" /> {{ locale === 'zh' ? 'EN' : '中' }}</Button>
    <Button variant="ghost" size="icon" class="shrink-0" @click="cycleTheme"><component :is="ThemeIcon" class="size-4" /></Button>
    <Button variant="ghost" size="icon" class="shrink-0" @click="logout"><LogOut class="size-4" /></Button>
  </nav>
</GlassCard>
```

- [ ] **Step 2: typecheck + 全量单测(AppHeader.spec 断言 `管理` + 姓名)**

注意:`AppHeader.spec` 断言文本含 `亚当`(姓名)。姓名 span 用 `hidden sm:inline` — jsdom 不应用 CSS,`w.text()` 仍包含该文本(`hidden` 是 CSS class,不影响 DOM 文本)。故测试仍通过。
Run: `npm run typecheck && npm test` → 干净;37 passed。

- [ ] **Step 3: 360 home 无溢出 + 截图确认 header**

Run: `NODE_PATH=$(pwd)/node_modules node /tmp/ov.cjs 360`(home)
Expected: `OVERFLOW=false`。
截图确认品牌不换行、控件不溢出:
```bash
NODE_PATH=$(pwd)/node_modules node -e "
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/home/shane/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'});
const p=await b.newPage({viewport:{width:360,height:760}});
await p.goto('http://localhost:5173/',{waitUntil:'networkidle'});
try{await p.getByRole('button',{name:/OP1/}).click();await p.waitForURL('http://localhost:5173/')}catch{}
await p.waitForTimeout(800);await p.screenshot({path:'/tmp/hdr360.png',clip:{x:0,y:0,width:360,height:90}});await b.close();})();
"
```
人工查看 `/tmp/hdr360.png`:品牌单行、姓名隐藏、三个控件 + 管理 pill 齐整。

- [ ] **Step 4: Commit**
```bash
git add src/features/dashboard/AppHeader.vue
git commit -m "fix(responsive): AppHeader 窄屏(品牌不换行 + 手机隐藏姓名 + 控件 shrink-0)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: HeroPanel / GlobalSearch / SystemCard 防溢出验证与微调

**Files:** Possibly modify `src/features/dashboard/HeroPanel.vue`, `GlobalSearch.vue`, `SystemCard.vue`

- [ ] **Step 1: 读取三个组件,核对防溢出基线**

确认:
- `GlobalSearch` 外层为 `flex items-center gap-2`,输入容器 `w-full max-w-md`(否则输入不收缩),搜索按钮 `shrink-0`。若输入容器无 `max-w-md`/`w-full` 导致 360 溢出,补上。
- `SystemCard` 名称为 `truncate` 且其文本容器 `min-w-0`(防长名撑破卡片);若缺 `min-w-0`,补上。
- `HeroPanel` 统计磁贴 `grid-cols-3 gap-3`,数字 `text-3xl`;360px 下每格约 (360-内边距)/3 ≈ 90px,`text-3xl`(30px)两位/三位数字不溢出。如三位数(如 `100`)在 360 溢出,数字改 `text-2xl sm:text-3xl`。

- [ ] **Step 2: 360/414 home 溢出校验**

Run:
```bash
NODE_PATH=$(pwd)/node_modules node /tmp/ov.cjs 360
NODE_PATH=$(pwd)/node_modules node /tmp/ov.cjs 414
```
Expected: 两者 `OVERFLOW=false`。若 false 且组件无需改,本任务仅验证、可能无 diff。

- [ ] **Step 3: typecheck + 单测**

Run: `npm run typecheck && npm test` → 干净;37 passed。

- [ ] **Step 4: Commit(若有改动;无改动则跳过)**
```bash
git add -A
git commit -m "fix(responsive): Hero/搜索/卡片 防窄屏溢出(min-w-0/truncate/字号)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 多宽度验收 + 截图

- [ ] **Step 1: 全量门禁** — `npm run typecheck && npm test` → 干净;37 passed。

- [ ] **Step 2: 多宽度溢出矩阵(无横向滚动)**

确保 dev 在 :5173、后端 dev 在 :8080。逐宽度跑(登录后 home):
```bash
for W in 360 414 768 1024 1280 1920; do NODE_PATH=$(pwd)/node_modules node /tmp/ov.cjs $W; done
NODE_PATH=$(pwd)/node_modules node /tmp/ov.cjs 360 login
```
Expected: 所有行 `OVERFLOW=false`。

- [ ] **Step 3: 各宽度截图人工确认**

```bash
NODE_PATH=$(pwd)/node_modules node -e "
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/home/shane/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'});
for(const W of [360,768,1280,1920]){const p=await b.newPage({viewport:{width:W,height:860}});
await p.goto('http://localhost:5173/',{waitUntil:'networkidle'});
try{await p.getByRole('button',{name:/OP1/}).click();await p.waitForURL('http://localhost:5173/')}catch{}
await p.waitForTimeout(900);await p.screenshot({path:'/tmp/resp-'+W+'.png'});await p.close();}
await b.close();console.log('shots done');})();
"
```
人工查看 `/tmp/resp-{360,768,1280,1920}.png`:无溢出、无遮挡破绽、网格列数随宽度 1/2/3/4、rail 仅 md+ 出现且右对齐、登录与 home 在 360 完整。

- [ ] **Step 4: 清理临时文件**
```bash
fuser -k 5173/tcp 2>/dev/null; rm -f /tmp/ov.cjs /tmp/resp-*.png /tmp/hdr360.png /tmp/fe.log
```

- [ ] **Step 5: Commit(若步骤中有小修)** — 无改动可跳过。

---

## 自检清单(Self-Review)

**规格覆盖(spec §2/§3/§4):** 登录 360 溢出 → Task 1;account-inactive 卡片 → Task 2;AppHeader 窄屏(品牌不换行 + 隐藏姓名 + shrink-0)→ Task 3;Hero/搜索/卡片防溢出 → Task 4;rail `<md` 隐藏、max-w-7xl cap、SupportBar 不变 → 不动(决策);全局无横向溢出 + 多宽度验收 → Task 5(+各任务内 360 校验)。

**占位符扫描:** 无 TODO/TBD;每处给出具体 class 改动与校验命令。Task 4 明确「若无需改则仅验证」。

**类型/命名一致性:** 不改 TS 逻辑/props,仅模板 class;`AppHeader.spec` 文本断言(`亚当`/`管理`)在 `hidden sm:inline` 下仍通过(jsdom 不渲染 CSS)→ Task 3 Step 2 已说明。**硬约束**(37 测试、rail/cap/footer 不变)在每个 Task 复测 + Task 5 终验。
