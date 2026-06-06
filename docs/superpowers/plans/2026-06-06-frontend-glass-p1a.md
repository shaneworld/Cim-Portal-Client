# 玻璃拟态前端重建 — P1a 基础(脚手架 + 登录 + 落地)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭好 Vue 玻璃拟态前端的基础,交付一个**可登录、登录后落地**的可运行应用(脚手架 + 设计系统 + API/鉴权/i18n/主题/stores/路由 + 玻璃原语 + 登录页 + 落地占位)。

**Architecture:** 全新 Vue 3 + TS + Vite 项目。Tailwind v3 + 玻璃拟态令牌(`.glass` 配方 + 渐变背景)。类型化 API 客户端 + 可插拔 AuthProvider(devAuth 现用 / oidc stub)。Pinia stores(auth/labels/toast)、vue-i18n、useTheme、路由守卫(鉴权 + 标签注水)。一组玻璃 UI 原语。落地为占位(P1b 覆盖为完整仪表盘)。

**Tech Stack:** Vue 3.5 + TypeScript(strict) + Vite 6 + Tailwind v3 + Pinia + vue-router + vue-i18n 10 + lucide-vue-next + Vitest + MSW。无重型图表/组件依赖。

**契约:** 设计见 `docs/superpowers/specs/2026-06-06-frontend-glass-rebuild-design.md`。后端 `../cim-portal-server/docs/api/api-reference.md`。开发后端在 `:8080`(`SPRING_PROFILES_ACTIVE=dev`,`JAVA_HOME=~/.local/share/mise/installs/java/temurin-21`)。dev 登录:`POST /dev/token` 选身份。

**仓库:** `/home/shane/Code/cim-portal/cim-portal-frontend`(已 `git init`,分支 `master`,含 docs)。命令在此运行。提交追加:
`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

**通用门禁:** `npm run typecheck && npm test`;脚手架/集成任务另跑 `npm run build`。

---

## 文件结构(P1a)

```
package.json · vite.config.ts · tsconfig.json · tsconfig.node.json · tailwind.config.js · postcss.config.js · index.html
src/
├── main.ts · App.vue · bootstrap.ts
├── assets/index.css                 # Tailwind + 玻璃令牌(明/暗)+ 动效
├── env.ts                           # 运行时配置(authMode/baseUrl)
├── lib/api/{client.ts,types.ts,portal.ts,i18n.ts,enums.ts}
├── lib/auth/{AuthProvider.ts,devAuth.ts,oidcAuth.ts,index.ts}
├── lib/i18n/{index.ts,useLocale.ts}
├── lib/theme/useTheme.ts
├── lib/ui/{GlassCard,Button,Input,Badge,StatusDot,Skeleton,Toaster}.vue (+ index.ts where useful)
├── stores/{auth.ts,labels.ts,toast.ts}
├── router/index.ts
├── features/auth/{LoginView.vue,AccountInactiveView.vue}
├── features/dashboard/HomeView.vue   # 占位(P1b 覆盖)
└── test/{setup.ts,msw.ts}
```

---

## Task 1: 脚手架 + 玻璃设计令牌

**Files:** Create the project config + entry + design tokens + test setup.

- [ ] **Step 1: `package.json`**
```json
{
  "name": "cim-portal-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run",
    "verify": "vue-tsc --noEmit && vitest run && vite build"
  },
  "dependencies": {
    "vue": "^3.5.13", "vue-router": "^4.5.0", "pinia": "^2.3.0",
    "vue-i18n": "^10.0.5", "lucide-vue-next": "^0.460.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.1", "vite": "^6.0.7", "vue-tsc": "^2.2.0",
    "typescript": "^5.7.3", "vitest": "^2.1.8", "jsdom": "^25.0.1",
    "@vue/test-utils": "^2.4.6", "msw": "^2.7.0",
    "tailwindcss": "^3.4.17", "postcss": "^8.4.49", "autoprefixer": "^10.4.20"
  }
}
```

- [ ] **Step 2: config files**

`vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.spec.ts'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true }, '/dev': { target: 'http://localhost:8080', changeOrigin: true } } },
})
```
`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext", "module": "ESNext", "moduleResolution": "Bundler",
    "strict": true, "jsx": "preserve", "lib": ["ESNext","DOM","DOM.Iterable"],
    "types": ["vitest/globals"], "skipLibCheck": true, "noEmit": true,
    "paths": { "@/*": ["./src/*"] }, "verbatimModuleSyntax": true
  },
  "include": ["src/**/*.ts","src/**/*.vue","src/**/*.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```
`tsconfig.node.json`:
```json
{ "compilerOptions": { "composite": true, "module": "ESNext", "moduleResolution": "Bundler", "skipLibCheck": true, "strict": true }, "include": ["vite.config.ts"] }
```
`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: { extend: { colors: {
    background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))',
    border: 'hsl(var(--border))', input: 'hsl(var(--input))', ring: 'hsl(var(--ring))',
    primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
    muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
  } } },
  plugins: [],
}
```
`postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```
`index.html`:
```html
<!doctype html>
<html lang="zh"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>CIM 门户</title></head>
<body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>
```

- [ ] **Step 3: `src/assets/index.css` — 玻璃令牌**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 11%; --foreground: 222 47% 11%;
    --primary: 243 75% 59%; --primary-foreground: 0 0% 100%;
    --muted: 215 20% 96%; --muted-foreground: 215 16% 47%;
    --border: 214 32% 88%; --input: 214 32% 88%; --ring: 243 75% 59%;
    --ink: 222 47% 17%; --ink-2: 215 19% 35%; --ink-3: 215 16% 60%;
    --accent: #4f46e5; --accent-2: #2563eb;
    --go: 142 71% 38%; --caution: 32 95% 44%; --stop: 0 72% 51%;
    --glass-bg: rgba(255,255,255,.55); --glass-strong: rgba(255,255,255,.72);
    --glass-bd: rgba(255,255,255,.75); --glass-sh: 0 10px 34px -12px rgba(30,41,80,.20);
    --r: 18px;
  }
  .dark {
    --foreground: 213 31% 91%; --muted: 217 33% 16%; --muted-foreground: 215 20% 65%;
    --border: 217 33% 22%; --input: 217 33% 22%;
    --ink: 213 31% 91%; --ink-2: 215 20% 72%; --ink-3: 215 16% 55%;
    --glass-bg: rgba(255,255,255,.06); --glass-strong: rgba(255,255,255,.10);
    --glass-bd: rgba(255,255,255,.14); --glass-sh: 0 14px 40px -14px rgba(0,0,0,.6);
  }
  body { color: hsl(var(--ink)); min-height: 100vh;
    background:
      radial-gradient(42% 50% at 8% 4%, rgba(99,102,241,.42), transparent 60%),
      radial-gradient(40% 45% at 96% 8%, rgba(34,211,238,.34), transparent 60%),
      radial-gradient(50% 55% at 70% 100%, rgba(168,85,247,.30), transparent 60%),
      linear-gradient(160deg, #eaf0fb, #eef2f8);
    background-attachment: fixed; }
  .dark body {
    background:
      radial-gradient(42% 50% at 8% 4%, rgba(79,70,229,.30), transparent 60%),
      radial-gradient(40% 45% at 96% 8%, rgba(8,145,178,.24), transparent 60%),
      radial-gradient(50% 55% at 70% 100%, rgba(124,58,237,.22), transparent 60%),
      linear-gradient(160deg, #0b1020, #0a0f1e);
    background-attachment: fixed; }
}

@layer components {
  .glass { background: var(--glass-bg); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px);
    border: 1px solid var(--glass-bd); box-shadow: var(--glass-sh); border-radius: var(--r); }
  .glass-strong { background: var(--glass-strong); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px);
    border: 1px solid var(--glass-bd); }
  .text-ink-2 { color: hsl(var(--ink-2)); } .text-ink-3 { color: hsl(var(--ink-3)); }
  .bg-brand { background-image: linear-gradient(135deg, var(--accent), var(--accent-2)); }
  .animate-fade-up { animation: fade-up .4s cubic-bezier(.2,.7,.2,1) both; }
  .anim-fade[data-state="open"] { animation: fade-in .16s ease; }
  .anim-fade[data-state="closed"] { animation: fade-out .16s ease; }
}

@keyframes fade-up { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
@keyframes fade-in { from { opacity:0; } to { opacity:1; } }
@keyframes fade-out { to { opacity:0; } }
@keyframes shimmer { 100% { transform: translateX(100%); } }
@keyframes pulse-dot { 0%{box-shadow:0 0 0 0 rgba(22,163,74,.45)} 70%{box-shadow:0 0 0 7px rgba(22,163,74,0)} 100%{box-shadow:0 0 0 0 rgba(22,163,74,0)} }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration:.001ms !important; transition-duration:.001ms !important; }
}
```

- [ ] **Step 4: entry + env + test setup**

`src/env.ts`:
```ts
export const env = { authMode: (import.meta.env.VITE_AUTH_MODE ?? 'dev') as 'dev' | 'oidc', baseUrl: '' }
```
`src/main.ts`:
```ts
import { createApp } from 'vue'
import './assets/index.css'
import App from './App.vue'
import { bootstrap } from './bootstrap'

const app = createApp(App)
bootstrap(app)
app.mount('#app')
```
`src/App.vue`:
```vue
<script setup lang="ts">
import Toaster from '@/lib/ui/Toaster.vue'
</script>
<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in"><component :is="Component" /></Transition>
  </RouterView>
  <Toaster />
</template>
<style>
.page-enter-active,.page-leave-active{transition:opacity .18s ease}
.page-enter-from,.page-leave-to{opacity:0}
</style>
```
`src/bootstrap.ts` (will grow; minimal now — pinia + router + i18n added in their tasks):
```ts
import type { App } from 'vue'
import { createPinia } from 'pinia'

export function bootstrap(app: App) {
  app.use(createPinia())
}
```
`src/test/msw.ts`:
```ts
import { setupServer } from 'msw/node'
export const server = setupServer()
```
`src/test/setup.ts`:
```ts
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw'

function makeLocalStorage() {
  const store: Record<string, string> = {}
  return { getItem: (k: string) => (k in store ? store[k] : null), setItem: (k: string, v: string) => { store[k] = String(v) },
    removeItem: (k: string) => { delete store[k] }, clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    get length() { return Object.keys(store).length }, key: (n: number) => Object.keys(store)[n] ?? null }
}
Object.defineProperty(globalThis, 'localStorage', { value: makeLocalStorage(), configurable: true, writable: true })
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false } })) as unknown as typeof window.matchMedia
}
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => { server.resetHandlers(); localStorage.clear() })
afterAll(() => server.close())
```
`src/lib/ui/Toaster.vue` (stub now; real in Task 9 — create a no-op so App compiles):
```vue
<script setup lang="ts"></script>
<template><div></div></template>
```
`src/features/dashboard/HomeView.vue` (stub; real placeholder in Task 11):
```vue
<script setup lang="ts"></script>
<template><div>home</div></template>
```

- [ ] **Step 5: smoke test `src/smoke.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
describe('smoke', () => { it('runs', () => { expect(1 + 1).toBe(2) }) })
```

- [ ] **Step 6: install + verify**
```bash
cd /home/shane/Code/cim-portal/cim-portal-frontend
npm install
npm run typecheck && npm test && npm run build
```
Expected: install OK; typecheck clean; smoke test passes; `vite build` succeeds (Tailwind compiles glass tokens). If `verbatimModuleSyntax` flags type-only imports later, use `import type`.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "chore: 脚手架 Vue+TS+Vite+Tailwind + 玻璃拟态设计令牌 + 测试基建

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: API 客户端 + 类型

**Files:** Create `src/lib/api/types.ts`, `src/lib/api/client.ts`, `src/lib/api/client.spec.ts`

- [ ] **Step 1: `src/lib/api/types.ts`**
```ts
export type Locale = 'zh' | 'en'
export type EnumCategory = 'DEPARTMENT' | 'ROLE' | 'LINK_CATEGORY' | 'LINK_STATUS'

export interface MeResponse { employeeId: string; displayNameZh: string; displayNameEn: string; departmentCode: string; roleCode: string; isAdmin: boolean }
export interface HomeLink { id: number; code: string; nameZh: string; nameEn: string; url: string; icon: string; statusCode: string; openInNewTab: boolean }
export interface HomeCategory { categoryCode: string; categoryLabelZh: string; categoryLabelEn: string; links: HomeLink[] }
export interface HomeResponse { categories: HomeCategory[] }
export interface EnumValue { id: number; category: EnumCategory; code: string; labelZh: string; labelEn: string; sortOrder: number; active: boolean }
export interface LabelEntry { zh: string; en: string; type: string }
export type LabelMap = Record<string, LabelEntry>
export interface ApiFieldError { field: string; message: string }
export interface ApiErrorBody { timestamp: string; status: number; error: string; code: string; message: string; path: string; fieldErrors?: ApiFieldError[] | null }
```

- [ ] **Step 2: failing test `src/lib/api/client.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { request, configureClient, ApiError } from './client'

const BASE = 'http://localhost:8080'
beforeEach(() => configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }))

describe('api client', () => {
  it('sends auth + locale headers and returns json', async () => {
    server.use(http.get(`${BASE}/api/ping`, ({ request }) => {
      expect(request.headers.get('Authorization')).toBe('Bearer t')
      expect(request.headers.get('Accept-Language')).toBe('zh')
      return HttpResponse.json({ ok: true })
    }))
    expect(await request<{ ok: boolean }>('GET', '/api/ping')).toEqual({ ok: true })
  })
  it('throws ApiError with code on non-2xx', async () => {
    server.use(http.get(`${BASE}/api/x`, () => HttpResponse.json({ timestamp: '', status: 409, error: 'Conflict', code: 'DUPLICATE_CODE', message: 'dup', path: '/x', fieldErrors: [{ field: 'code', message: 'taken' }] }, { status: 409 })))
    const e = await request('GET', '/api/x').catch((err) => err)
    expect(e).toBeInstanceOf(ApiError)
    expect(e.code).toBe('DUPLICATE_CODE'); expect(e.fieldErrors[0].field).toBe('code')
  })
  it('returns undefined on 204', async () => {
    server.use(http.delete(`${BASE}/api/x`, () => new HttpResponse(null, { status: 204 })))
    expect(await request('DELETE', '/api/x')).toBeUndefined()
  })
})
```

- [ ] **Step 3: run, confirm FAIL** — `npm test -- api/client` → FAIL.

- [ ] **Step 4: `src/lib/api/client.ts`**
```ts
import type { ApiErrorBody, ApiFieldError } from './types'

export class ApiError extends Error {
  status: number; code: string; fieldErrors: ApiFieldError[]
  constructor(body: ApiErrorBody) { super(body.message); this.name = 'ApiError'; this.status = body.status; this.code = body.code; this.fieldErrors = body.fieldErrors ?? [] }
}
interface ClientConfig { baseUrl: string; getToken: () => string | null; getLocale: () => string; onUnauthorized: () => void }
let config: ClientConfig = { baseUrl: '', getToken: () => null, getLocale: () => 'zh', onUnauthorized: () => {} }
export function configureClient(c: Partial<ClientConfig>) { config = { ...config, ...c } }

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Accept-Language': config.getLocale() }
  const token = config.getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(config.baseUrl + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  if (res.status === 401) config.onUnauthorized()
  if (!res.ok) {
    let parsed: ApiErrorBody
    try { parsed = (await res.json()) as ApiErrorBody } catch { parsed = { timestamp: '', status: res.status, error: res.statusText, code: 'INTERNAL_ERROR', message: res.statusText, path } }
    throw new ApiError(parsed)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
```

- [ ] **Step 5: run + typecheck** — `npm test -- api/client && npm run typecheck` → PASS (3).

- [ ] **Step 6: Commit**
```bash
git add src/lib/api/types.ts src/lib/api/client.ts src/lib/api/client.spec.ts
git commit -m "feat(api): 类型化 fetch 客户端(ApiError/headers/204)+ DTO 类型

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: portal / i18n / enums API 模块

**Files:** Create `src/lib/api/{portal.ts,i18n.ts,enums.ts}`, `src/lib/api/portal.spec.ts`

- [ ] **Step 1: failing test `src/lib/api/portal.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from './client'
import { getHome, getMe } from './portal'
import { getLabels } from './i18n'
import { listEnum } from './enums'

const BASE = 'http://localhost:8080'
beforeEach(() => configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }))

describe('portal api', () => {
  it('getHome / getMe / getLabels / listEnum hit the right paths', async () => {
    server.use(
      http.get(`${BASE}/api/portal/home`, () => HttpResponse.json({ categories: [] })),
      http.get(`${BASE}/api/portal/me`, () => HttpResponse.json({ employeeId: 'OP1', displayNameZh: '欧', displayNameEn: 'O', departmentCode: 'FAB1-PROD', roleCode: 'OPERATOR', isAdmin: false })),
      http.get(`${BASE}/api/i18n/labels`, () => HttpResponse.json({ 'nav.admin': { zh: '管理', en: 'Admin', type: 'UI_TEXT' } })),
      http.get(`${BASE}/api/enums/DEPARTMENT`, () => HttpResponse.json([{ id: 1, category: 'DEPARTMENT', code: 'IT', labelZh: '信息', labelEn: 'IT', sortOrder: 1, active: true }])),
    )
    expect((await getHome()).categories).toEqual([])
    expect((await getMe()).employeeId).toBe('OP1')
    expect((await getLabels())['nav.admin'].zh).toBe('管理')
    expect((await listEnum('DEPARTMENT'))[0].code).toBe('IT')
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- api/portal` → FAIL.

- [ ] **Step 3: implement modules**

`src/lib/api/portal.ts`:
```ts
import { request } from './client'
import type { HomeResponse, MeResponse } from './types'
export const getHome = () => request<HomeResponse>('GET', '/api/portal/home')
export const getMe = () => request<MeResponse>('GET', '/api/portal/me')
```
`src/lib/api/i18n.ts`:
```ts
import { request } from './client'
import type { LabelMap } from './types'
export const getLabels = () => request<LabelMap>('GET', '/api/i18n/labels')
```
`src/lib/api/enums.ts`:
```ts
import { request } from './client'
import type { EnumCategory, EnumValue } from './types'
export const listEnum = (category: EnumCategory) => request<EnumValue[]>('GET', `/api/enums/${category}`)
```

- [ ] **Step 4: run + typecheck** — `npm test -- api/portal && npm run typecheck` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/api/portal.ts src/lib/api/i18n.ts src/lib/api/enums.ts src/lib/api/portal.spec.ts
git commit -m "feat(api): portal/i18n/enums 模块

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 鉴权 Provider(devAuth + oidc stub)

**Files:** Create `src/lib/auth/{AuthProvider.ts,devAuth.ts,oidcAuth.ts,index.ts}`, `src/lib/auth/devAuth.spec.ts`

- [ ] **Step 1: failing test `src/lib/auth/devAuth.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { DEV_IDENTITIES, createDevAuth } from './devAuth'

const BASE = 'http://localhost:8080'
beforeEach(() => configureClient({ baseUrl: BASE, getToken: () => null, getLocale: () => 'zh', onUnauthorized: () => {} }))

describe('devAuth', () => {
  it('lists dev identities including ADMIN1', () => {
    expect(DEV_IDENTITIES.some((i) => i.employeeId === 'ADMIN1')).toBe(true)
  })
  it('login posts the employeeId to /dev/token and returns the token', async () => {
    server.use(http.post(`${BASE}/dev/token`, async ({ request }) => {
      expect((await request.json() as any).employeeId).toBe('OP1')
      return HttpResponse.json({ token: 'jwt-op1' })
    }))
    expect(await createDevAuth().login('OP1')).toBe('jwt-op1')
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- devAuth` → FAIL.

- [ ] **Step 3: implement**

`src/lib/auth/AuthProvider.ts`:
```ts
export interface AuthProvider { login(employeeId?: string): Promise<string> }
export interface DevIdentity { employeeId: string; nameZh: string; nameEn: string; hint: string }
```
`src/lib/auth/devAuth.ts`:
```ts
import { request } from '@/lib/api/client'
import type { AuthProvider, DevIdentity } from './AuthProvider'

export const DEV_IDENTITIES: DevIdentity[] = [
  { employeeId: 'ADMIN1', nameZh: '亚当管理', nameEn: 'Adam', hint: 'IT · PORTAL_ADMIN' },
  { employeeId: 'OP1', nameZh: '欧阳操作', nameEn: 'Oliver', hint: 'FAB1-PROD · OPERATOR' },
  { employeeId: 'ENG1', nameZh: '伊森工程', nameEn: 'Ethan', hint: 'FAB1-PROD · PROCESS_ENGINEER' },
  { employeeId: 'QA1', nameZh: '乔安质量', nameEn: 'Joan', hint: 'QA · QA_ENGINEER' },
  { employeeId: 'OP2', nameZh: '欧阳二厂', nameEn: 'Oscar', hint: 'FAB2-PROD · OPERATOR' },
  { employeeId: 'LEAD1', nameZh: '李班长', nameEn: 'Leo', hint: 'FAB1-PROD · SHIFT_LEAD' },
  { employeeId: 'MNT1', nameZh: '孟技师', nameEn: 'Max', hint: 'MAINT · MAINTENANCE_TECH' },
  { employeeId: 'LOG1', nameZh: '卢物流', nameEn: 'Luke', hint: 'LOGISTICS · OPERATOR' },
  { employeeId: 'OFF1', nameZh: '周离职', nameEn: 'Olivia', hint: 'QA · (已停用)' },
]
export function createDevAuth(): AuthProvider {
  return { async login(employeeId?: string) {
    const r = await request<{ token: string }>('POST', '/dev/token', { employeeId })
    return r.token
  } }
}
```
`src/lib/auth/oidcAuth.ts`:
```ts
import type { AuthProvider } from './AuthProvider'
/** Stub for uat/prod — wired in a later phase. */
export function createOidcAuth(): AuthProvider {
  return { async login() { throw new Error('OIDC 登录尚未在本期实现') } }
}
```
`src/lib/auth/index.ts`:
```ts
import { env } from '@/env'
import { createDevAuth } from './devAuth'
import { createOidcAuth } from './oidcAuth'
import type { AuthProvider } from './AuthProvider'
export type { AuthProvider, DevIdentity } from './AuthProvider'
export { DEV_IDENTITIES } from './devAuth'
export function createAuthProvider(): AuthProvider { return env.authMode === 'oidc' ? createOidcAuth() : createDevAuth() }
```

- [ ] **Step 4: run + typecheck** — `npm test -- devAuth && npm run typecheck` → PASS (2).

- [ ] **Step 5: Commit**
```bash
git add src/lib/auth
git commit -m "feat(auth): 可插拔 AuthProvider(devAuth + oidc stub)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: i18n + useLocale

**Files:** Create `src/lib/i18n/{index.ts,useLocale.ts}`, `src/lib/i18n/useLocale.spec.ts`

- [ ] **Step 1: failing test `src/lib/i18n/useLocale.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { i18n } from './index'
import { pick } from './useLocale'

describe('useLocale.pick', () => {
  it('picks zh/en by current locale', () => {
    i18n.global.locale.value = 'zh'
    expect(pick({ nameZh: '在制品', nameEn: 'WIP' }, 'name')).toBe('在制品')
    i18n.global.locale.value = 'en'
    expect(pick({ nameZh: '在制品', nameEn: 'WIP' }, 'name')).toBe('WIP')
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- useLocale` → FAIL.

- [ ] **Step 3: implement**

`src/lib/i18n/index.ts`:
```ts
import { createI18n } from 'vue-i18n'
export const i18n = createI18n({ legacy: false, locale: 'zh', fallbackLocale: 'zh', messages: { zh: {}, en: {} } })
```
`src/lib/i18n/useLocale.ts`:
```ts
import { useI18n } from 'vue-i18n'
import { i18n } from './index'

/** Pick the localized field, e.g. pick(link,'name') → nameZh|nameEn by locale. */
export function pick<T extends Record<string, any>>(obj: T, key: string): string {
  const loc = i18n.global.locale.value
  const suffix = loc === 'en' ? 'En' : 'Zh'
  return obj[`${key}${suffix}`] ?? ''
}
export function useLocale() {
  const { locale } = useI18n({ useScope: 'global' })
  return { locale, pick }
}
```

- [ ] **Step 4: run + typecheck** — `npm test -- useLocale && npm run typecheck` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/i18n
git commit -m "feat(i18n): vue-i18n 单例 + pick() 双语取值

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 主题 useTheme

**Files:** Create `src/lib/theme/useTheme.ts`, `src/lib/theme/useTheme.spec.ts`

- [ ] **Step 1: failing test `src/lib/theme/useTheme.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme } from './useTheme'

describe('useTheme', () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.classList.remove('dark') })
  it('defaults to system and applies; setMode persists + toggles dark class', () => {
    const { mode, setMode } = useTheme()
    expect(['light', 'dark', 'system']).toContain(mode.value)
    setMode('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('cimp.theme')).toBe('dark')
    setMode('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- useTheme` → FAIL.

- [ ] **Step 3: `src/lib/theme/useTheme.ts`**
```ts
import { ref } from 'vue'
export type ThemeMode = 'light' | 'dark' | 'system'
const KEY = 'cimp.theme'
const mode = ref<ThemeMode>((localStorage.getItem(KEY) as ThemeMode | null) ?? 'system')

function systemDark() { return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches }
function apply() {
  const dark = mode.value === 'dark' || (mode.value === 'system' && systemDark())
  document.documentElement.classList.toggle('dark', dark)
}
export function useTheme() {
  function setMode(m: ThemeMode) { mode.value = m; localStorage.setItem(KEY, m); apply() }
  function init() { mode.value = (localStorage.getItem(KEY) as ThemeMode | null) ?? 'system'; apply() }
  return { mode, setMode, init }
}
```

- [ ] **Step 4: run + typecheck** — `npm test -- useTheme && npm run typecheck` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/theme
git commit -m "feat(theme): useTheme(light/dark/system,持久化,.dark class)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: stores(toast / labels / auth)

**Files:** Create `src/stores/{toast.ts,labels.ts,auth.ts}`, `src/stores/auth.spec.ts`

- [ ] **Step 1: `src/stores/toast.ts`**
```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
export type ToastType = 'success' | 'error'
export interface Toast { id: number; type: ToastType; message: string }
export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let seq = 0
  function dismiss(id: number) { toasts.value = toasts.value.filter((t) => t.id !== id) }
  function push(t: { type: ToastType; message: string }) { const id = ++seq; toasts.value.push({ id, ...t }); setTimeout(() => dismiss(id), 3500); return id }
  return { toasts, push, dismiss }
})
```

- [ ] **Step 2: `src/stores/labels.ts`**
```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLabels } from '@/lib/api/i18n'
import { i18n } from '@/lib/i18n'
import type { LabelMap, Locale } from '@/lib/api/types'
export const useLabelsStore = defineStore('labels', () => {
  const loaded = ref(false)
  async function hydrate() {
    const map: LabelMap = await getLabels()
    const zh: Record<string, string> = {}, en: Record<string, string> = {}
    for (const [k, v] of Object.entries(map)) { zh[k] = v.zh; en[k] = v.en }
    i18n.global.setLocaleMessage('zh', zh); i18n.global.setLocaleMessage('en', en)
    loaded.value = true
  }
  function setLocale(l: Locale) { i18n.global.locale.value = l; localStorage.setItem('cimp.locale', l) }
  function initLocale() { const l = localStorage.getItem('cimp.locale') as Locale | null; if (l) i18n.global.locale.value = l }
  return { loaded, hydrate, setLocale, initLocale }
})
```

- [ ] **Step 3: failing test `src/stores/auth.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { useAuthStore } from './auth'

const BASE = 'http://localhost:8080'
describe('auth store', () => {
  beforeEach(() => { setActivePinia(createPinia()); localStorage.clear(); configureClient({ baseUrl: BASE, getToken: () => null, getLocale: () => 'zh', onUnauthorized: () => {} }) })
  it('login stores token + hydrates user; isAdmin reflects me', async () => {
    server.use(
      http.post(`${BASE}/dev/token`, () => HttpResponse.json({ token: 'jwt-admin' })),
      http.get(`${BASE}/api/portal/me`, () => HttpResponse.json({ employeeId: 'ADMIN1', displayNameZh: '亚当', displayNameEn: 'Adam', departmentCode: 'IT', roleCode: 'PORTAL_ADMIN', isAdmin: true })),
    )
    const a = useAuthStore()
    await a.login('ADMIN1')
    expect(a.token).toBe('jwt-admin')
    expect(a.currentUser?.employeeId).toBe('ADMIN1')
    expect(a.isAdmin).toBe(true)
    expect(localStorage.getItem('cimp.token')).toBe('jwt-admin')
  })
})
```

- [ ] **Step 4: run, confirm FAIL** — `npm test -- stores/auth` → FAIL.

- [ ] **Step 5: `src/stores/auth.ts`**
```ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getMe } from '@/lib/api/portal'
import { createAuthProvider } from '@/lib/auth'
import type { MeResponse } from '@/lib/api/types'

const KEY = 'cimp.token'
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(KEY))
  const currentUser = ref<MeResponse | null>(null)
  const provider = createAuthProvider()
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => currentUser.value?.isAdmin === true)

  function setToken(t: string | null) { token.value = t; if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY) }
  async function hydrateUser() { currentUser.value = await getMe() }
  async function login(employeeId?: string) { setToken(await provider.login(employeeId)); await hydrateUser() }
  function clear() { setToken(null); currentUser.value = null }
  function logout() { clear() }
  return { token, currentUser, isAuthenticated, isAdmin, setToken, hydrateUser, login, clear, logout }
})
```

- [ ] **Step 6: run + typecheck** — `npm test -- stores/auth && npm run typecheck` → PASS.

- [ ] **Step 7: Commit**
```bash
git add src/stores
git commit -m "feat(stores): toast / labels / auth(Pinia)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: 路由 + 守卫

**Files:** Create `src/router/index.ts`, `src/router/index.spec.ts`; Modify `src/bootstrap.ts`

- [ ] **Step 1: failing test `src/router/index.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes, installGuards } from './index'
import { useAuthStore } from '@/stores/auth'

describe('router guards', () => {
  beforeEach(() => { setActivePinia(createPinia()); localStorage.clear() })
  it('redirects unauthenticated users to /login', async () => {
    const r = createRouter({ history: createMemoryHistory(), routes }); installGuards(r)
    await r.push('/'); await r.isReady()
    expect(r.currentRoute.value.path).toBe('/login')
  })
  it('blocks /admin for non-admins', async () => {
    const r = createRouter({ history: createMemoryHistory(), routes }); installGuards(r)
    const a = useAuthStore(); a.setToken('t'); a.currentUser = { employeeId: 'OP1', displayNameZh: '', displayNameEn: '', departmentCode: '', roleCode: '', isAdmin: false } as any
    await r.push('/admin'); await r.isReady()
    expect(r.currentRoute.value.path).toBe('/')
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- router` → FAIL.

- [ ] **Step 3: `src/router/index.ts`**
```ts
import { createRouter, createWebHistory, type Router, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLabelsStore } from '@/stores/labels'

export const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/features/auth/LoginView.vue'), meta: { public: true } },
  { path: '/account-inactive', name: 'account-inactive', component: () => import('@/features/auth/AccountInactiveView.vue'), meta: { public: true } },
  { path: '/', name: 'home', component: () => import('@/features/dashboard/HomeView.vue') },
  { path: '/admin', name: 'admin', component: () => import('@/features/dashboard/HomeView.vue'), meta: { admin: true } },
]

export function installGuards(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    if (to.meta.public) return true
    if (!auth.isAuthenticated) return { path: '/login' }
    if (!auth.currentUser) { try { await auth.hydrateUser() } catch { auth.clear(); return { path: '/login' } } }
    const labels = useLabelsStore()
    if (!labels.loaded) { try { await labels.hydrate() } catch { /* non-fatal */ } }
    if (to.meta.admin && !auth.isAdmin) return { path: '/' }
    return true
  })
}
export function createAppRouter() { const r = createRouter({ history: createWebHistory(), routes }); installGuards(r); return r }
```

- [ ] **Step 4: wire bootstrap — overwrite `src/bootstrap.ts`**
```ts
import type { App } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import { createAppRouter } from '@/router'
import { configureClient } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import { useLabelsStore } from '@/stores/labels'
import { useTheme } from '@/lib/theme/useTheme'

export function bootstrap(app: App) {
  app.use(createPinia())
  app.use(i18n)
  configureClient({ baseUrl: '', getToken: () => useAuthStore().token, getLocale: () => i18n.global.locale.value,
    onUnauthorized: () => { useAuthStore().clear() } })
  useTheme().init(); useLabelsStore().initLocale()
  app.use(createAppRouter())
}
```

- [ ] **Step 5: run + typecheck** — `npm test -- router && npm run typecheck` → PASS (2).

- [ ] **Step 6: Commit**
```bash
git add src/router/index.ts src/router/index.spec.ts src/bootstrap.ts
git commit -m "feat(router): 路由 + 守卫(requireAuth/requireAdmin + 标签注水)+ bootstrap 装配

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 玻璃 UI 原语

**Files:** Create `src/lib/ui/{GlassCard,Button,Input,Badge,StatusDot,Skeleton,Toaster}.vue`; overwrite the Task 1 Toaster stub; Create `src/lib/ui/ui.spec.ts`

- [ ] **Step 1: failing test `src/lib/ui/ui.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import GlassCard from './GlassCard.vue'
import Button from './Button.vue'
import Input from './Input.vue'
import StatusDot from './StatusDot.vue'
import Toaster from './Toaster.vue'
import { useToastStore } from '@/stores/toast'

describe('ui primitives', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('GlassCard renders slot with .glass', () => {
    const w = mount(GlassCard, { slots: { default: '内容' } })
    expect(w.text()).toContain('内容'); expect(w.classes()).toContain('glass')
  })
  it('Button emits click', async () => { const w = mount(Button, { slots: { default: 'OK' } }); await w.trigger('click'); expect(w.emitted('click')).toBeTruthy() })
  it('Input binds v-model', async () => { const w = mount(Input, { props: { modelValue: '' } }); await w.get('input').setValue('x'); expect(w.emitted('update:modelValue')?.[0]).toEqual(['x']) })
  it('StatusDot maps statusCode to a color class', () => {
    expect(mount(StatusDot, { props: { status: 'ACTIVE' } }).html()).toMatch(/go|142/i)
  })
  it('Toaster renders pushed toasts', async () => {
    const w = mount(Toaster); useToastStore().push({ type: 'success', message: '已保存' })
    await w.vm.$nextTick(); expect(w.text()).toContain('已保存')
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- ui/ui` → FAIL.

- [ ] **Step 3: implement primitives**

`src/lib/ui/GlassCard.vue`:
```vue
<script setup lang="ts"></script>
<template><div class="glass"><slot /></div></template>
```
`src/lib/ui/Button.vue`:
```vue
<script setup lang="ts">
defineProps<{ variant?: 'primary' | 'ghost' | 'outline'; type?: 'button' | 'submit' }>()
const emit = defineEmits<{ click: [MouseEvent] }>()
</script>
<template>
  <button :type="type ?? 'button'"
    class="inline-flex items-center justify-center gap-2 rounded-xl px-4 h-10 text-sm font-semibold transition active:scale-[.98] disabled:opacity-50"
    :class="{
      'bg-brand text-white shadow-lg shadow-indigo-500/25': (variant ?? 'primary') === 'primary',
      'glass-strong rounded-xl text-ink-2 hover:text-[hsl(var(--ink))]': variant === 'ghost',
      'border border-border bg-transparent text-ink-2': variant === 'outline',
    }"
    @click="emit('click', $event)"><slot /></button>
</template>
```
`src/lib/ui/Input.vue`:
```vue
<script setup lang="ts">
defineProps<{ modelValue?: string; placeholder?: string; type?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>
<template>
  <input :type="type ?? 'text'" :value="modelValue" :placeholder="placeholder"
    class="h-10 w-full rounded-xl border border-input glass-strong px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
</template>
```
`src/lib/ui/Badge.vue`:
```vue
<script setup lang="ts">
defineProps<{ tone?: 'go' | 'caution' | 'stop' | 'muted' }>()
</script>
<template>
  <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
    :class="{
      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300': (tone ?? 'muted') === 'go',
      'bg-amber-500/15 text-amber-600 dark:text-amber-300': tone === 'caution',
      'bg-rose-500/15 text-rose-600 dark:text-rose-300': tone === 'stop',
      'bg-slate-500/15 text-ink-2': (tone ?? 'muted') === 'muted',
    }"><slot /></span>
</template>
```
`src/lib/ui/StatusDot.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ status: string }>()
const color = computed(() => props.status === 'ACTIVE' ? 'hsl(var(--go))' : props.status === 'MAINTENANCE' ? 'hsl(var(--caution))' : props.status === 'DEPRECATED' ? 'hsl(var(--stop))' : 'hsl(var(--ink-3))')
</script>
<template><span class="inline-block size-2 rounded-full" :style="{ background: color }" :title="status"></span></template>
```
`src/lib/ui/Skeleton.vue`:
```vue
<script setup lang="ts"></script>
<template><div class="glass relative h-16 overflow-hidden rounded-xl"><div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent" style="animation: shimmer 1.5s infinite"></div></div></template>
```
`src/lib/ui/Toaster.vue` (overwrite the stub):
```vue
<script setup lang="ts">
import { CheckCircle2, AlertCircle, X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()
</script>
<template>
  <div class="pointer-events-none fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
    <TransitionGroup name="page">
      <div v-for="t in toast.toasts" :key="t.id" class="glass pointer-events-auto flex items-start gap-2 rounded-xl p-3 text-sm">
        <CheckCircle2 v-if="t.type === 'success'" class="mt-0.5 size-4 shrink-0 text-emerald-500" />
        <AlertCircle v-else class="mt-0.5 size-4 shrink-0 text-rose-500" />
        <span class="min-w-0 flex-1">{{ t.message }}</span>
        <button class="text-ink-3 hover:text-[hsl(var(--ink))]" @click="toast.dismiss(t.id)"><X class="size-4" /></button>
      </div>
    </TransitionGroup>
  </div>
</template>
```

- [ ] **Step 4: run + typecheck + full suite** — `npm test -- ui/ui && npm run typecheck && npm test` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/ui
git commit -m "feat(ui): 玻璃原语 GlassCard/Button/Input/Badge/StatusDot/Skeleton/Toaster

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: LoginView + AccountInactiveView

**Files:** Create `src/features/auth/{LoginView.vue,AccountInactiveView.vue}`, `src/features/auth/LoginView.spec.ts`

- [ ] **Step 1: failing test `src/features/auth/LoginView.spec.ts`**
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '@/router'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth'
import LoginView from './LoginView.vue'

describe('LoginView', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh' })
  it('lists dev identities and logs in on click', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const auth = useAuthStore()
    const spy = vi.spyOn(auth, 'login').mockResolvedValue(undefined as any)
    const w = mount(LoginView, { global: { plugins: [router, i18n] } })
    expect(w.text()).toContain('ADMIN1')
    const btn = w.findAll('button').find((b) => b.text().includes('ADMIN1'))!
    await btn.trigger('click'); await flushPromises()
    expect(spy).toHaveBeenCalledWith('ADMIN1')
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- LoginView` → FAIL.

- [ ] **Step 3: `src/features/auth/LoginView.vue`**
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { UserRound, ChevronRight, ShieldCheck } from 'lucide-vue-next'
import { DEV_IDENTITIES } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/lib/api/client'
import GlassCard from '@/lib/ui/GlassCard.vue'

const router = useRouter()
const auth = useAuthStore()
const busy = ref<string | null>(null)
const error = ref('')

async function pick(employeeId: string) {
  busy.value = employeeId; error.value = ''
  try { await auth.login(employeeId); router.push('/') }
  catch (e) {
    if (e instanceof ApiError && (e.code === 'USER_INACTIVE' || e.code === 'USER_NOT_PROVISIONED')) router.push('/account-inactive')
    else { error.value = e instanceof Error ? e.message : '登录失败'; auth.clear() }
  } finally { busy.value = null }
}
</script>
<template>
  <div class="grid min-h-screen place-items-center p-6">
    <GlassCard class="w-full max-w-md p-7 animate-fade-up">
      <div class="mb-6 flex items-center gap-3">
        <span class="grid size-11 place-items-center rounded-xl bg-brand text-xl font-extrabold text-white shadow-lg shadow-indigo-500/25">C</span>
        <div><h1 class="text-2xl font-bold leading-none">CIM 门户</h1><p class="mt-1 text-sm text-ink-2">选择身份进入</p></div>
      </div>
      <div class="space-y-2">
        <button v-for="id in DEV_IDENTITIES" :key="id.employeeId"
          class="group flex w-full items-center gap-3 rounded-xl glass-strong p-3 text-left transition hover:-translate-y-0.5 disabled:opacity-50"
          :disabled="busy !== null" @click="pick(id.employeeId)">
          <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-white"><UserRound class="size-4" /></span>
          <span class="min-w-0 flex-1">
            <span class="block font-medium">{{ id.employeeId }} · {{ id.nameZh }}</span>
            <span class="block truncate text-xs text-ink-3">{{ id.hint }}</span>
          </span>
          <ChevronRight class="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
      <p v-if="error" class="mt-4 text-sm text-rose-500">{{ error }}</p>
      <p class="mt-5 flex items-center gap-1.5 text-xs text-ink-3"><ShieldCheck class="size-3.5" /> SSO 安全登录 · 仅授权人员</p>
    </GlassCard>
  </div>
</template>
```
`src/features/auth/AccountInactiveView.vue`:
```vue
<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'
import GlassCard from '@/lib/ui/GlassCard.vue'
</script>
<template>
  <div class="grid min-h-screen place-items-center p-6">
    <GlassCard class="max-w-md p-10 text-center animate-fade-up">
      <ShieldAlert class="mx-auto size-12 text-amber-500" />
      <h1 class="mt-3 text-xl font-semibold">账号无法访问门户</h1>
      <p class="mt-2 text-ink-2">您的账号已停用或未在系统中配置,请联系管理员。</p>
    </GlassCard>
  </div>
</template>
```

- [ ] **Step 4: run + typecheck + full suite** — `npm test -- LoginView && npm run typecheck && npm test` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/auth
git commit -m "feat(auth): LoginView(玻璃身份徽章)+ AccountInactiveView

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: 落地占位 HomeView(可登录后落地)

**Files:** Overwrite `src/features/dashboard/HomeView.vue`; Create `src/features/dashboard/HomeView.spec.ts`

- [ ] **Step 1: failing test `src/features/dashboard/HomeView.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import HomeView from './HomeView.vue'

const BASE = 'http://localhost:8080'
describe('HomeView (placeholder)', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
    configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }) })
  it('greets the signed-in user and shows a placeholder', async () => {
    const auth = useAuthStore()
    auth.currentUser = { employeeId: 'OP1', displayNameZh: '欧阳操作', displayNameEn: 'Oliver', departmentCode: 'FAB1-PROD', roleCode: 'OPERATOR', isAdmin: false } as any
    server.use(http.get(`${BASE}/api/portal/home`, () => HttpResponse.json({ categories: [] })))
    const w = mount(HomeView, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(w.text()).toContain('欧阳操作')
    expect(w.text()).toContain('仪表盘')
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- HomeView` → FAIL.

- [ ] **Step 3: overwrite `src/features/dashboard/HomeView.vue`**
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { LogOut, LayoutDashboard } from 'lucide-vue-next'
import type { HomeCategory } from '@/lib/api/types'
import { getHome } from '@/lib/api/portal'
import { useAuthStore } from '@/stores/auth'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Button from '@/lib/ui/Button.vue'

const { locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const auth = useAuthStore()
const categories = ref<HomeCategory[]>([])
const name = computed(() => (locale.value === 'zh' ? auth.currentUser?.displayNameZh : auth.currentUser?.displayNameEn) ?? '')
const total = computed(() => categories.value.reduce((n, c) => n + c.links.length, 0))
function logout() { auth.logout(); router.push('/login') }
onMounted(async () => { try { categories.value = (await getHome()).categories } catch { /* placeholder */ } })
</script>
<template>
  <div class="min-h-screen p-4 sm:p-6">
    <div class="mx-auto max-w-7xl space-y-4">
      <GlassCard class="flex items-center justify-between p-4">
        <div class="flex items-center gap-2.5">
          <span class="grid size-8 place-items-center rounded-lg bg-brand font-extrabold text-white">C</span>
          <b class="text-lg">CIM 门户</b>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-ink-2">{{ name }} · {{ auth.currentUser?.employeeId }}</span>
          <Button variant="ghost" @click="logout"><LogOut class="size-4" /></Button>
        </div>
      </GlassCard>

      <GlassCard class="p-8 text-center animate-fade-up">
        <LayoutDashboard class="mx-auto size-10 text-[hsl(var(--primary))]" />
        <h1 class="mt-3 text-xl font-bold">仪表盘 · 你好,{{ name }}</h1>
        <p class="mt-2 text-ink-2">已接入 {{ total }} 个可访问系统。完整玻璃仪表盘(实时数据可视化、领域高亮、系统网格)将于 P1b 上线。</p>
      </GlassCard>
    </div>
  </div>
</template>
```

- [ ] **Step 4: run + typecheck + full suite + build** — `npm test -- HomeView && npm run typecheck && npm test && npm run build` → PASS;构建成功。

- [ ] **Step 5: Commit**
```bash
git add src/features/dashboard/HomeView.vue src/features/dashboard/HomeView.spec.ts
git commit -m "feat(dashboard): 落地占位 HomeView(玻璃顶栏 + 问候 + 系统计数)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: 全量验证 + 运行冒烟

- [ ] **Step 1: 全量门禁** — `cd /home/shane/Code/cim-portal/cim-portal-frontend && npm run verify` → typecheck 干净;全部单测绿;构建成功。

- [ ] **Step 2: 运行冒烟(需后端 :8080)**

启动后端(`cd ../cim-portal-server/backend && JAVA_HOME=/home/shane/.local/share/mise/installs/java/temurin-21 SPRING_PROFILES_ACTIVE=dev java -jar target/portal.jar &`),前端 `npm run dev`(:5173,代理 /api+/dev → :8080)。访问 → 重定向 `/login`;点 OP1 → `/dev/token` 登录 → 落地玻璃页显示问候 + 系统计数;切 ADMIN1 可见后续 `/admin`;玻璃/渐变背景与磨砂卡片正常,明/暗主题。停止:`fuser -k 5173/tcp; fuser -k 8080/tcp`。

- [ ] **Step 3: Commit(若有小修)** — `git add -A && git commit -m "chore: P1a 验证"`(无改动可跳过)。

---

## 自检清单(Self-Review)

**规格覆盖(对照 spec):** §2 栈 → Task 1;§3 契约/客户端/portal/i18n/enums → Task 2–3;鉴权可插拔 → Task 4;i18n/pick → Task 5;主题 → Task 6;stores → Task 7;路由守卫 + 标签注水 → Task 8;§4 玻璃令牌 → Task 1,玻璃原语 → Task 9;§5.1 登录 + account-inactive → Task 10;§5.2 仪表盘(本期占位,完整版 P1b)→ Task 11。访问控制由后端 home 决定,前端忠实渲染(Task 11 拉取 home)。Hero 数据可视化/领域高亮/系统网格/安全条/搜索 → **P1b**(本计划交付可登录落地)。

**占位符扫描:** 无 TODO/TBD;每步含完整代码。Task 1 的 Toaster/HomeView 为「先 stub 后覆盖」(Task 9/11 覆盖)—— 有意的装配顺序,非缺失。

**类型/钩子一致性:** `request`/`ApiError`/`configureClient`、`getHome/getMe/getLabels/listEnum`、`AuthProvider.login`/`DEV_IDENTITIES`、`i18n`/`pick`/`useLocale`、`useTheme{mode,setMode,init}`、`useToastStore{toasts,push,dismiss}`、`useLabelsStore{hydrate,setLocale,initLocale,loaded}`、`useAuthStore{token,currentUser,isAuthenticated,isAdmin,login,clear,logout,hydrateUser,setToken}`、`routes/installGuards/createAppRouter`、玻璃原语 props、`LoginView`/`HomeView` 钩子(`ADMIN1`、`仪表盘`、姓名)在任务间一致。
