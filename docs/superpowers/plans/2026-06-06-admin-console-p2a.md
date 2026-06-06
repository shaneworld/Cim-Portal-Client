# P2a 管理控制台(外壳 + Links/Grants)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/admin` 下建玻璃管理外壳(侧边栏 + 嵌套路由)与链接 CRUD + 每链接访问授权编辑(模态框)。

**Architecture:** 新增 admin API 客户端(镜像后端 DTO)+ reka-ui 无障碍原语(Modal/Select/Switch/ConfirmDialog,仅淡入淡出)+ AdminLayout(侧边导航)+ LinksAdminView(表格)+ LinkFormModal(字段+授权,保存= create/update 后整组 PUT grants)。路由 `/admin` 嵌套子路由。

**Tech Stack:** Vue 3.5 + TS + Tailwind v3 + Pinia + vue-router + vue-i18n + lucide + **reka-ui(新增)** + Vitest/MSW。

**契约/现状:** spec `docs/superpowers/specs/2026-06-06-admin-console-p2a-design.md`。后端(已核对):`/api/admin/links` list/`POST`/`GET,PUT,DELETE /{id}`、`PUT /{id}/grants`;DTO 见下;enums `GET /api/enums/{LINK_CATEGORY|LINK_STATUS|DEPARTMENT|ROLE}`。既有:`@/lib/api/client`(`request`/`ApiError`)、`@/lib/api/enums`(`listEnum`)、`@/lib/api/types`(`EnumValue`/`EnumCategory`)、`@/lib/ui/{Button,Input,GlassCard,StatusDot,Badge}.vue`、`@/lib/ui/AppIcon.vue`(`iconMap` 键集)、`@/stores/toast`(`useToastStore().push`)、`@/lib/i18n/useLocale`(`pick`)、`@/router`(`routes`/`installGuards`,守卫已查 `to.meta.admin`)。**硬约束:既有 28 测试保持绿。** 仓库 `/home/shane/Code/cim-portal/cim-portal-frontend`(在 `master` 上新建 `admin-p2a`)。门禁 `npm run typecheck && npm test`(触集成加 `npm run build`)。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。冒烟需后端 `SPRING_PROFILES_ACTIVE=dev` 在 :8080,登录 ADMIN1(PORTAL_ADMIN)。

---

## 文件结构

```
src/lib/api/admin.ts                         # T2
src/lib/ui/Modal.vue                         # T3
src/lib/ui/Select.vue                        # T4
src/lib/ui/Switch.vue                        # T4
src/lib/ui/ConfirmDialog.vue                 # T5
src/features/admin/AdminLayout.vue           # T6
src/features/admin/links/LinksAdminView.vue  # T7
src/features/admin/links/LinkFormModal.vue   # T8
src/router/index.ts                          # T6(嵌套路由,修改)
src/lib/api/types.ts                         # T2(EnumCategory 扩展,修改)
+ 各自 .spec.ts
```

---

## Task 1: 安装 reka-ui

**Files:** `package.json`(经 npm)

- [ ] **Step 1: 安装**
```bash
cd /home/shane/Code/cim-portal/cim-portal-frontend
npm install reka-ui@^2
```
Expected: `dependencies` 出现 `reka-ui`。
- [ ] **Step 2: 验证可导入**
```bash
node -e "console.log(Object.keys(require('reka-ui')).slice(0,3))" 2>/dev/null || echo "ESM-only, will import in SFC"
```
(reka-ui 为 ESM;若 require 失败属正常,SFC 中 `import { ... } from 'reka-ui'` 即可。)
- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: 新增 reka-ui 依赖(管理控制台无障碍原语)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: admin API 客户端 + 类型

**Files:** Create `src/lib/api/admin.ts`, `src/lib/api/admin.spec.ts`; Modify `src/lib/api/types.ts`

- [ ] **Step 1: 确保 `EnumCategory` 含四类(修改 types.ts)**

读取 `src/lib/api/types.ts` 的 `EnumCategory`;确保为(含)`'LINK_CATEGORY' | 'LINK_STATUS' | 'DEPARTMENT' | 'ROLE'`(若已是更宽的 `string` 或已含,跳过;否则改为包含这四个的联合)。

- [ ] **Step 2: 写失败测试 `src/lib/api/admin.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { listLinks, createLink, updateLink, deleteLink, replaceGrants } from './admin'

const BASE = 'http://localhost:8080'
beforeEach(() => configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }))

describe('admin api', () => {
  it('listLinks GET /api/admin/links', async () => {
    server.use(http.get(`${BASE}/api/admin/links`, () => HttpResponse.json([{ id: 1, code: 'a', nameZh: '甲', nameEn: 'A', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [] }])))
    const r = await listLinks(); expect(r[0].code).toBe('a'); expect(Array.isArray(r[0].grants)).toBe(true)
  })
  it('createLink POST', async () => {
    let body: any
    server.use(http.post(`${BASE}/api/admin/links`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ id: 9, ...body, grants: [] }) }))
    const r = await createLink({ code: 'x', nameZh: '乙', nameEn: 'X', url: 'u', icon: 'book', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 5, openInNewTab: false })
    expect(r.id).toBe(9); expect(body.code).toBe('x')
  })
  it('updateLink PUT /{id} and deleteLink DELETE /{id}', async () => {
    server.use(http.put(`${BASE}/api/admin/links/9`, () => HttpResponse.json({ id: 9, code: 'x', nameZh: '乙', nameEn: 'X', url: 'u', icon: 'book', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 5, openInNewTab: false, grants: [] })))
    server.use(http.delete(`${BASE}/api/admin/links/9`, () => new HttpResponse(null, { status: 204 })))
    expect((await updateLink(9, { code: 'x', nameZh: '乙', nameEn: 'X', url: 'u', icon: 'book', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 5, openInNewTab: false })).id).toBe(9)
    await expect(deleteLink(9)).resolves.toBeUndefined()
  })
  it('replaceGrants PUT /{id}/grants with {grants}', async () => {
    let body: any
    server.use(http.put(`${BASE}/api/admin/links/9/grants`, async ({ request }) => { body = await request.json(); return HttpResponse.json([{ id: 1, linkId: 9, grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }]) }))
    const r = await replaceGrants(9, [{ grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }])
    expect(body.grants[0].grantCode).toBe('FAB1-PROD'); expect(r[0].grantType).toBe('DEPARTMENT')
  })
})
```

- [ ] **Step 3: 运行确认 FAIL** — `npm test -- api/admin` → 模块不存在。

- [ ] **Step 4: 实现 `src/lib/api/admin.ts`**
```ts
import { request } from './client'

export type GrantType = 'DEPARTMENT' | 'ROLE'
export interface GrantResponse { id: number; linkId: number; grantType: GrantType; grantCode: string }
export interface GrantInput { grantType: GrantType; grantCode: string }
export interface AdminLink {
  id: number; code: string; nameZh: string; nameEn: string; url: string; icon: string
  categoryCode: string; statusCode: string; sortOrder: number; openInNewTab: boolean
  grants: GrantResponse[]; createdAt?: string; updatedAt?: string
}
export interface LinkInput {
  code: string; nameZh: string; nameEn: string; url: string; icon: string
  categoryCode: string; statusCode: string; sortOrder: number; openInNewTab: boolean
}

export const listLinks = (categoryCode?: string) =>
  request<AdminLink[]>('GET', `/api/admin/links${categoryCode ? `?categoryCode=${encodeURIComponent(categoryCode)}` : ''}`)
export const createLink = (body: LinkInput) => request<AdminLink>('POST', '/api/admin/links', body)
export const updateLink = (id: number, body: LinkInput) => request<AdminLink>('PUT', `/api/admin/links/${id}`, body)
export const deleteLink = (id: number) => request<void>('DELETE', `/api/admin/links/${id}`)
export const replaceGrants = (id: number, grants: GrantInput[]) =>
  request<GrantResponse[]>('PUT', `/api/admin/links/${id}/grants`, { grants })
```

- [ ] **Step 5: 运行 + typecheck** — `npm test -- api/admin && npm run typecheck` → PASS(4)。

- [ ] **Step 6: Commit**
```bash
git add src/lib/api/admin.ts src/lib/api/admin.spec.ts src/lib/api/types.ts
git commit -m "feat(admin): admin API 客户端(Links CRUD + replaceGrants)+ 类型

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Modal 原语(reka-ui Dialog,仅淡入淡出)

**Files:** Create `src/lib/ui/Modal.vue`, `src/lib/ui/Modal.spec.ts`

- [ ] **Step 1: 写失败测试 `src/lib/ui/Modal.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Modal from './Modal.vue'

describe('Modal', () => {
  it('open 时渲染标题与内容到 body;关闭时不渲染', async () => {
    const w = mount(Modal, { props: { open: true, title: '编辑' }, slots: { default: () => h('p', '内容X') }, attachTo: document.body })
    expect(document.body.textContent).toContain('编辑')
    expect(document.body.textContent).toContain('内容X')
    await w.setProps({ open: false })
    expect(document.body.textContent).not.toContain('内容X')
    w.unmount()
  })
  it('内容无缩放/位移弹出类(仅淡入)', () => {
    mount(Modal, { props: { open: true, title: 't' }, attachTo: document.body })
    const content = document.querySelector('[data-testid="modal-content"]')!
    expect(content.className).not.toMatch(/scale|translate-y|slide/)
    document.body.innerHTML = ''
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- ui/Modal` → FAIL。

- [ ] **Step 3: 实现 `src/lib/ui/Modal.vue`**
```vue
<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()
</script>
<template>
  <DialogRoot :open="props.open" @update:open="(v) => emit('update:open', v)">
    <DialogPortal>
      <DialogOverlay class="anim-fade fixed inset-0 z-40 bg-black/40" data-testid="modal-overlay" />
      <DialogContent
        data-testid="modal-content"
        class="anim-fade glass-strong fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border p-5 shadow-2xl max-h-[85vh] overflow-y-auto focus:outline-none"
      >
        <DialogTitle v-if="title" class="mb-4 text-lg font-bold">{{ title }}</DialogTitle>
        <slot />
        <div v-if="$slots.footer" class="mt-5 flex justify-end gap-2"><slot name="footer" /></div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```
注:`-translate-x-1/2 -translate-y-1/2` 仅用于居中(静态),`.anim-fade` 只做 opacity 过渡——不做缩放/滑入,符合「仅淡入淡出」。测试断言中排除的是动画类(scale/slide/translate-y 作为动画),此处 translate 为定位;若测试因 `-translate-y-1/2` 命中 `translate-y` 正则,改用居中容器法:外层 `DialogContent` 加 `class="... grid place-items-center inset-0"` 包裹一个 `glass-strong` 子卡而非用 translate。**实现时优先用「外层 fixed inset-0 grid place-items-center」+ 内层卡片**以避免 translate:
```
<DialogContent class="fixed inset-0 z-50 grid place-items-center p-4 focus:outline-none">
  <div data-testid="modal-content" class="anim-fade glass-strong w-full max-w-lg rounded-2xl border border-border p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
    ...title/slot/footer...
  </div>
</DialogContent>
```
采用后一种(无 translate),`data-testid="modal-content"` 放内层卡片。

- [ ] **Step 4: 运行 + typecheck** — `npm test -- ui/Modal && npm run typecheck` → PASS(2)。若 jsdom 下 Portal teleport 到 body,测试已用 `document.body` 断言,OK。

- [ ] **Step 5: Commit**
```bash
git add src/lib/ui/Modal.vue src/lib/ui/Modal.spec.ts
git commit -m "feat(ui): Modal(reka-ui Dialog,玻璃 + 仅淡入淡出)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Select + Switch 原语

**Files:** Create `src/lib/ui/Select.vue`, `src/lib/ui/Switch.vue`, `src/lib/ui/Select.spec.ts`

- [ ] **Step 1: 写失败测试 `src/lib/ui/Select.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from './Select.vue'
import Switch from './Switch.vue'

describe('Select', () => {
  it('渲染当前选中项的 label;无值显示 placeholder', () => {
    const w = mount(Select, { props: { modelValue: 'MES', options: [{ value: 'MES', label: '制造' }, { value: 'QA', label: '质量' }], placeholder: '选择' }, attachTo: document.body })
    expect(w.text()).toContain('制造')
    w.unmount()
  })
})
describe('Switch', () => {
  it('点击切换 emit update:modelValue', async () => {
    const w = mount(Switch, { props: { modelValue: false } })
    await w.find('button').trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([true])
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- ui/Select` → FAIL。

- [ ] **Step 3: 实现**

`src/lib/ui/Select.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { SelectRoot, SelectTrigger, SelectValue, SelectPortal, SelectContent, SelectViewport, SelectItem, SelectItemText } from 'reka-ui'
import { ChevronDown, Check } from 'lucide-vue-next'
const props = defineProps<{ modelValue: string; options: { value: string; label: string }[]; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const current = computed(() => props.options.find((o) => o.value === props.modelValue)?.label)
</script>
<template>
  <SelectRoot :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v as string)">
    <SelectTrigger class="flex h-10 w-full items-center justify-between rounded-xl border border-input glass-strong px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <SelectValue :placeholder="placeholder ?? '请选择'">{{ current ?? placeholder ?? '请选择' }}</SelectValue>
      <ChevronDown class="size-4 text-ink-3" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="anim-fade glass-strong z-50 overflow-hidden rounded-xl border border-border p-1 shadow-xl" position="popper" :side-offset="6">
        <SelectViewport>
          <SelectItem v-for="o in options" :key="o.value" :value="o.value"
            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-[hsl(var(--primary)/0.12)]">
            <SelectItemText>{{ o.label }}</SelectItemText>
            <Check class="size-3.5 text-[hsl(var(--primary))] opacity-0 data-[state=checked]:opacity-100" />
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```
`src/lib/ui/Switch.vue`:
```vue
<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>
<template>
  <SwitchRoot :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', !!v)"
    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition data-[state=checked]:bg-brand data-[state=unchecked]:bg-[hsl(var(--muted))]">
    <SwitchThumb class="block size-5 translate-x-0.5 rounded-full bg-white shadow transition data-[state=checked]:translate-x-[22px]" />
  </SwitchRoot>
</template>
```

- [ ] **Step 4: 运行 + typecheck** — `npm test -- ui/Select && npm run typecheck` → PASS(2)。（Switch 测试在同文件。）

- [ ] **Step 5: Commit**
```bash
git add src/lib/ui/Select.vue src/lib/ui/Switch.vue src/lib/ui/Select.spec.ts
git commit -m "feat(ui): Select + Switch(reka-ui)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: ConfirmDialog

**Files:** Create `src/lib/ui/ConfirmDialog.vue`, `src/lib/ui/ConfirmDialog.spec.ts`

- [ ] **Step 1: 写失败测试 `src/lib/ui/ConfirmDialog.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from './ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  it('open 显示消息;确认/取消 emit', async () => {
    const w = mount(ConfirmDialog, { props: { open: true, title: '删除?', message: '确认删除链接' }, attachTo: document.body })
    expect(document.body.textContent).toContain('确认删除链接')
    const btns = [...document.querySelectorAll('button')]
    const confirm = btns.find((b) => /确认|删除/.test(b.textContent || ''))!
    confirm.click()
    expect(w.emitted('confirm')).toBeTruthy()
    w.unmount(); document.body.innerHTML = ''
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- ui/ConfirmDialog` → FAIL。

- [ ] **Step 3: 实现 `src/lib/ui/ConfirmDialog.vue`**
```vue
<script setup lang="ts">
import Modal from './Modal.vue'
import Button from './Button.vue'
const props = defineProps<{ open: boolean; title?: string; message: string }>()
const emit = defineEmits<{ confirm: []; cancel: []; 'update:open': [boolean] }>()
</script>
<template>
  <Modal :open="open" :title="title ?? '确认'" @update:open="(v) => { if (!v) emit('cancel'); emit('update:open', v) }">
    <p class="text-sm text-ink-2">{{ message }}</p>
    <template #footer>
      <Button variant="ghost" @click="emit('cancel'); emit('update:open', false)">取消</Button>
      <Button class="bg-rose-600 text-white shadow" @click="emit('confirm')">删除</Button>
    </template>
  </Modal>
</template>
```

- [ ] **Step 4: 运行 + typecheck** — `npm test -- ui/ConfirmDialog && npm run typecheck` → PASS。

- [ ] **Step 5: Commit**
```bash
git add src/lib/ui/ConfirmDialog.vue src/lib/ui/ConfirmDialog.spec.ts
git commit -m "feat(ui): ConfirmDialog(基于 Modal)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: AdminLayout + 嵌套路由

**Files:** Create `src/features/admin/AdminLayout.vue`, `src/features/admin/AdminLayout.spec.ts`; Modify `src/router/index.ts`

- [ ] **Step 1: 写失败测试 `src/features/admin/AdminLayout.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { i18n } from '@/lib/i18n'
import AdminLayout from './AdminLayout.vue'

describe('AdminLayout', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh' })
  it('渲染导航(链接)+ 返回门户', () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }, { path: '/admin/links', component: { template: '<div>LINKS</div>' } }] })
    const w = mount(AdminLayout, { global: { plugins: [router, i18n] } })
    expect(w.text()).toContain('链接')
    expect(w.text()).toMatch(/返回门户|门户/)
    expect(w.findAll('a').length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- AdminLayout` → FAIL。

- [ ] **Step 3: 实现 `src/features/admin/AdminLayout.vue`**
```vue
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ChevronLeft, Link2, ListChecks, Tags, Users } from 'lucide-vue-next'
import GlassCard from '@/lib/ui/GlassCard.vue'
const nav = [
  { to: '/admin/links', label: '链接', icon: Link2, enabled: true },
  { to: '/admin/enums', label: '枚举', icon: ListChecks, enabled: false },
  { to: '/admin/labels', label: '标签', icon: Tags, enabled: false },
  { to: '/admin/users', label: '用户', icon: Users, enabled: false },
]
</script>
<template>
  <div class="min-h-screen p-4 sm:p-6">
    <div class="mx-auto flex max-w-[1600px] flex-col gap-4 md:flex-row">
      <GlassCard class="shrink-0 p-3 md:w-56">
        <RouterLink to="/" class="mb-3 flex items-center gap-1.5 px-2 text-sm text-ink-2 hover:text-[hsl(var(--ink))]"><ChevronLeft class="size-4" /> 返回门户</RouterLink>
        <nav class="flex gap-1 md:flex-col">
          <template v-for="n in nav" :key="n.to">
            <RouterLink v-if="n.enabled" :to="n.to" class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-2 transition hover:bg-[hsl(var(--primary)/0.1)]" active-class="bg-brand text-white">
              <component :is="n.icon" class="size-4" /> {{ n.label }}
            </RouterLink>
            <span v-else class="flex cursor-not-allowed items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-3/50">
              <component :is="n.icon" class="size-4" /> {{ n.label }}<span class="ml-auto hidden text-[10px] md:inline">即将上线</span>
            </span>
          </template>
        </nav>
      </GlassCard>
      <main class="min-w-0 flex-1"><RouterView /></main>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 路由(修改 `src/router/index.ts`)**

把现有 `{ path: '/admin', ... component: HomeView, meta: { admin: true } }` 改为嵌套:
```ts
{
  path: '/admin',
  component: () => import('@/features/admin/AdminLayout.vue'),
  meta: { admin: true },
  children: [
    { path: '', redirect: '/admin/links' },
    { path: 'links', name: 'admin-links', component: () => import('@/features/admin/links/LinksAdminView.vue') },
  ],
},
```
(删除原 `/admin` → HomeView 占位行。守卫 `to.meta.admin`:Vue Router 合并 matched 记录的 meta,父 `meta.admin` 进入子路由 `to.meta`,守卫照常拦截。)

- [ ] **Step 5: 运行 + typecheck + 全量**

注意 LinksAdminView 在 T7 才建;本步若 `npm run build`/路由解析报缺失,先用占位:`children` 暂只放 `{ path: '', redirect: '/admin/links' }` 与 `{ path: 'links', component: () => import('@/features/admin/links/LinksAdminView.vue') }`——LinksAdminView 文件在 T7 创建前,**仅跑 `npm test -- AdminLayout && npm run typecheck`(不跑 build)**;build 留到 T7 之后。
Run: `npm test -- AdminLayout && npm run typecheck && npm test`
Expected: AdminLayout 1/1;typecheck 干净(动态 import 不报缺失);全量绿。

- [ ] **Step 6: Commit**
```bash
git add src/features/admin/AdminLayout.vue src/features/admin/AdminLayout.spec.ts src/router/index.ts
git commit -m "feat(admin): AdminLayout 侧边导航 + /admin 嵌套路由

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: LinksAdminView(列表 + 删除)

**Files:** Create `src/features/admin/links/LinksAdminView.vue`, `src/features/admin/links/LinksAdminView.spec.ts`

- [ ] **Step 1: 写失败测试 `src/features/admin/links/LinksAdminView.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import LinksAdminView from './LinksAdminView.vue'

const BASE = 'http://localhost:8080'
const LINKS = [
  { id: 1, code: 'mes-wip', nameZh: '在制品管理', nameEn: 'WIP', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [{ id: 7, linkId: 1, grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }] },
]
beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
  server.use(http.get(`${BASE}/api/admin/links`, () => HttpResponse.json(LINKS)))
})
describe('LinksAdminView', () => {
  it('渲染链接行(名称/分类/状态/授权数)', async () => {
    const w = mount(LinksAdminView, { global: { plugins: [i18n] } }); await flushPromises()
    expect(w.text()).toContain('在制品管理'); expect(w.text()).toContain('MES'); expect(w.text()).toContain('1')   // 1 grant
  })
  it('删除走确认 → 调 DELETE', async () => {
    let deleted = false
    server.use(http.delete(`${BASE}/api/admin/links/1`, () => { deleted = true; return new HttpResponse(null, { status: 204 }) }))
    const w = mount(LinksAdminView, { global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    await w.get('[data-testid="del-1"]').trigger('click')        // 打开确认
    await flushPromises()
    const confirm = [...document.querySelectorAll('button')].find((b) => /删除/.test(b.textContent || ''))!
    confirm.click(); await flushPromises()
    expect(deleted).toBe(true)
    w.unmount(); document.body.innerHTML = ''
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- LinksAdminView` → FAIL。

- [ ] **Step 3: 实现 `src/features/admin/links/LinksAdminView.vue`**
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, AlertTriangle, RotateCw } from 'lucide-vue-next'
import { listLinks, deleteLink, type AdminLink } from '@/lib/api/admin'
import { useLocale } from '@/lib/i18n/useLocale'
import { useToastStore } from '@/stores/toast'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Button from '@/lib/ui/Button.vue'
import StatusDot from '@/lib/ui/StatusDot.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import ConfirmDialog from '@/lib/ui/ConfirmDialog.vue'
import LinkFormModal from './LinkFormModal.vue'

const { pick } = useLocale()
const toast = useToastStore()
const links = ref<AdminLink[]>([]); const loading = ref(true); const error = ref(false)
const formOpen = ref(false); const editing = ref<AdminLink | null>(null)
const confirmOpen = ref(false); const pendingDelete = ref<AdminLink | null>(null)

async function load() { loading.value = true; error.value = false; try { links.value = await listLinks() } catch { error.value = true } finally { loading.value = false } }
function openCreate() { editing.value = null; formOpen.value = true }
function openEdit(l: AdminLink) { editing.value = l; formOpen.value = true }
function askDelete(l: AdminLink) { pendingDelete.value = l; confirmOpen.value = true }
async function doDelete() {
  if (!pendingDelete.value) return
  try { await deleteLink(pendingDelete.value.id); toast.push({ kind: 'success', text: '已删除' }); await load() }
  catch { toast.push({ kind: 'error', text: '删除失败' }) }
  finally { confirmOpen.value = false; pendingDelete.value = null }
}
onMounted(load)
</script>
<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-bold">链接管理</h1>
      <Button @click="openCreate"><Plus class="size-4" /> 新建链接</Button>
    </div>
    <div v-if="loading" class="space-y-2"><Skeleton v-for="n in 6" :key="n" /></div>
    <GlassCard v-else-if="error" class="p-8 text-center">
      <AlertTriangle class="mx-auto size-9 text-rose-500" /><p class="mt-2 text-rose-500">加载失败</p>
      <Button class="mx-auto mt-3" @click="load"><RotateCw class="size-4" /> 重试</Button>
    </GlassCard>
    <GlassCard v-else class="divide-y divide-border/60 p-0">
      <div v-for="l in links" :key="l.id" class="flex items-center gap-3 p-3.5">
        <span class="min-w-0 flex-1">
          <span class="block truncate font-semibold">{{ pick(l, 'name') }}</span>
          <span class="block truncate text-xs text-ink-3">{{ l.code }}</span>
        </span>
        <span class="hidden w-24 shrink-0 text-xs text-ink-2 sm:block">{{ l.categoryCode }}</span>
        <span class="hidden w-24 shrink-0 items-center gap-1.5 text-xs text-ink-2 sm:flex"><StatusDot :status="l.statusCode" /> {{ l.statusCode }}</span>
        <span class="w-16 shrink-0 text-center text-xs text-ink-3">{{ l.grants.length }} 授权</span>
        <span class="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" :data-testid="`edit-${l.id}`" @click="openEdit(l)"><Pencil class="size-4" /></Button>
          <Button variant="ghost" size="icon" :data-testid="`del-${l.id}`" @click="askDelete(l)"><Trash2 class="size-4 text-rose-500" /></Button>
        </span>
      </div>
      <div v-if="!links.length" class="p-8 text-center text-ink-3">暂无链接</div>
    </GlassCard>

    <LinkFormModal v-model:open="formOpen" :link="editing" @saved="load" />
    <ConfirmDialog v-model:open="confirmOpen" title="删除链接" :message="`确认删除「${pendingDelete ? pick(pendingDelete, 'name') : ''}」?`" @confirm="doDelete" @cancel="confirmOpen = false" />
  </div>
</template>
```
注:`pick(l,'name')` 读 `nameZh/nameEn`。`useToastStore().push({kind,text})`——**实现前读 `src/stores/toast.ts` 确认 push 签名/字段名**(若为 `{type,message}` 等,按实际调整本文件全部 toast 调用)。

- [ ] **Step 4: 运行 + typecheck** — `npm test -- LinksAdminView && npm run typecheck` → PASS(2)。（依赖 T8 的 LinkFormModal;若 T8 未完成,先建 LinkFormModal 占位再回填——本计划 T8 紧随,故按顺序 T7 测试可能需 T8 存在。**执行顺序:先建 T8 的 LinkFormModal 文件骨架(下一个 Task),或在 T7 用最小占位 LinkFormModal**。推荐:先做 T8 再回到 T7 跑测试;或 T7 先放一个最小 `LinkFormModal.vue`(仅 `<Modal>` 空壳)占位,T8 完整实现。)

- [ ] **Step 5: Commit**
```bash
git add src/features/admin/links/LinksAdminView.vue src/features/admin/links/LinksAdminView.spec.ts
git commit -m "feat(admin): LinksAdminView 列表 + 删除确认

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: LinkFormModal(字段 + 授权编辑 + 保存)

**Files:** Create `src/features/admin/links/LinkFormModal.vue`, `src/features/admin/links/LinkFormModal.spec.ts`

- [ ] **Step 1: 写失败测试 `src/features/admin/links/LinkFormModal.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import LinkFormModal from './LinkFormModal.vue'

const BASE = 'http://localhost:8080'
beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
  for (const c of ['LINK_CATEGORY','LINK_STATUS','DEPARTMENT','ROLE'])
    server.use(http.get(`${BASE}/api/enums/${c}`, () => HttpResponse.json([{ id: 1, category: c, code: c === 'LINK_STATUS' ? 'ACTIVE' : c === 'LINK_CATEGORY' ? 'MES' : c === 'DEPARTMENT' ? 'FAB1-PROD' : 'OPERATOR', labelZh: '项', labelEn: 'x', sortOrder: 1, active: true }])))
})
describe('LinkFormModal', () => {
  it('create: 保存调 POST link 再 PUT grants', async () => {
    let created = false, grantsPut = false
    server.use(http.post(`${BASE}/api/admin/links`, async () => { created = true; return HttpResponse.json({ id: 50, code: 'n', nameZh: 'n', nameEn: 'n', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [] }) }))
    server.use(http.put(`${BASE}/api/admin/links/50/grants`, () => { grantsPut = true; return HttpResponse.json([]) }))
    const w = mount(LinkFormModal, { props: { open: true, link: null }, global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    // 填必填(直接设 input;实现需有 name=code 等可定位输入)
    await w.find('[data-testid="f-code"]').setValue('n')
    await w.find('[data-testid="f-nameZh"]').setValue('名')
    await w.find('[data-testid="f-nameEn"]').setValue('N')
    await w.find('[data-testid="f-url"]').setValue('https://x')
    const save = [...document.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    save.click(); await flushPromises()
    expect(created).toBe(true); expect(grantsPut).toBe(true)
    w.unmount(); document.body.innerHTML = ''
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- LinkFormModal` → FAIL。

- [ ] **Step 3: 实现 `src/features/admin/links/LinkFormModal.vue`**

要点(完整实现):
- import `Modal,Input,Button,Select,Switch,AppIcon`;`listEnum`;`createLink,updateLink,replaceGrants,type AdminLink,LinkInput,GrantInput,GrantType`;`ApiError`;`useToastStore`。
- props `{ open:boolean; link:AdminLink|null }`,emit `{ 'update:open':[boolean]; saved:[] }`。
- `form` reactive:`code/nameZh/nameEn/url/icon/categoryCode/statusCode/sortOrder/openInNewTab`;`grants: GrantInput[]`;`fieldErrors: Record<string,string>`。
- `watch(() => props.open)`:打开时,若 `link` 用其值填充(grants 映射 `{grantType,grantCode}`),否则重置默认(icon 默认 `'factory'`,sortOrder `100`,openInNewTab `true`,grants `[]`);并 `loadEnums()`(并行 `listEnum('LINK_CATEGORY'|'LINK_STATUS'|'DEPARTMENT'|'ROLE')` → 存为 `{value:code,label:pick(labelZh/En)}[]`)。
- icon 选项 = iconMap 已知键集(硬编码数组:factory,line-chart,gauge,wrench,boxes,file-text,trending-up,activity,package,book,archive)映射 `{value,label:value}`;旁 `<AppIcon :name="form.icon" />` 预览。
- 字段输入加 `data-testid`:`f-code`(Input,edit 时 `:disabled`)、`f-nameZh`、`f-nameEn`、`f-url`、`f-sortOrder`(number);分类/状态用 `Select`;openInNewTab 用 `Switch`。
- 授权区:`form.grants` 每行:`Select`(grantType:[{value:'DEPARTMENT',label:'部门'},{value:'ROLE',label:'角色'}])+ `Select`(grantCode:按该行 grantType 取 dept/role 选项)+ 删除按钮;「+ 添加授权」push `{grantType:'DEPARTMENT',grantCode:''}`。
- `save()`:基本必填校验(code/nameZh/nameEn/url/categoryCode/statusCode 非空,icon 非空);构造 `LinkInput`;`try { const saved = props.link ? await updateLink(props.link.id, input) : await createLink(input); await replaceGrants(saved.id, form.grants.filter(g=>g.grantCode)); toast.push success; emit('saved'); emit('update:open', false) } catch(e){ if (e instanceof ApiError && e.fieldErrors) map 到 fieldErrors; else toast error }`。
- footer:取消(emit update:open false)/保存。
- 全部包在 `<Modal :open="open" :title="link?'编辑链接':'新建链接'" @update:open="...">`。

(此为实现说明;实现者据此写出完整 SFC。toast.push 签名以 `src/stores/toast.ts` 实际为准。)

- [ ] **Step 4: 运行 + typecheck + 全量 + build**
```bash
npm test -- LinkFormModal && npm test -- LinksAdminView && npm run typecheck && npm test && npm run build
```
Expected: LinkFormModal/LinksAdminView 绿;全量绿(既有 28 + 新增);build OK。

- [ ] **Step 5: Commit**
```bash
git add src/features/admin/links/LinkFormModal.vue src/features/admin/links/LinkFormModal.spec.ts
git commit -m "feat(admin): LinkFormModal 链接表单 + 授权编辑(保存 create/update + replaceGrants)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 全量验证 + 运行冒烟

- [ ] **Step 1: 全量门禁** — `npm run verify` → typecheck 干净;全测绿;build 成功。
- [ ] **Step 2: 运行冒烟(后端 dev :8080)** — `npm run dev`;登录 **ADMIN1**(PORTAL_ADMIN)→ 顶栏「管理」入 `/admin` → 重定向 `/admin/links`;侧栏链接 active、枚举/标签/用户置灰;列表显示现有链接 + 授权数;新建链接(填字段 + 加一条 DEPARTMENT/FAB1-PROD 授权)保存 → 列表刷新、toast;编辑改名 + 改授权保存生效;删除走确认。模态**淡入淡出、居中、不从角落弹**。切窄屏侧栏变顶部 nav。停止:`fuser -k 5173/tcp`。
- [ ] **Step 3: Commit(若小修)** — 无改动跳过。

---

## 自检清单(Self-Review)

**规格覆盖(spec):** admin 客户端(§4)→T2;reka-ui 原语 Modal/Select/Switch/ConfirmDialog(§5)→T3/T4/T5;AdminLayout 侧栏+嵌套路由(§6/§9)→T6;LinksAdminView 表格+删除(§7)→T7;LinkFormModal 字段+授权+保存路径(§8)→T8;reka-ui 依赖(§1)→T1;测试(§10)→各 Task + T9;EnumCategory 扩展(§3)→T2。

**占位符扫描:** T8 给的是"实现要点"而非整段代码——这是有意的(SFC 较大),但每个字段/行为/端点/data-testid 均已点名,无 TBD。T7/T8 互依:已注明执行顺序(先建 T8 的 Modal 文件或 T7 占位)。toast.push 签名两处标注"以 store 实际为准"。

**类型/命名一致性:** `AdminLink`/`LinkInput`/`GrantInput`/`GrantResponse`/`GrantType`、`listLinks/createLink/updateLink/deleteLink/replaceGrants`、`Modal`(`open`/`update:open`/`title`/`footer`)、`Select`(`modelValue`/`options{value,label}`/`update:modelValue`)、`Switch`(`modelValue`)、`ConfirmDialog`(`open`/`message`/`confirm`/`cancel`)、路由 `admin-links`、`data-testid`(`edit-/del-/f-*`)跨 T2–T8 一致。**硬约束**(28 测试、守卫 admin)在 T6/T9 复测。
