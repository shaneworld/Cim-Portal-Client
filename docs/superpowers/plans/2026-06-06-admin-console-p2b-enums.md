# P2b 枚举管理 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/admin/enums` 提供 4 类枚举(部门/角色/链接分类/链接状态)的 CRUD,启用侧栏「枚举」项,复用 P2a 外壳与原语。

**Architecture:** 扩展 `lib/api/admin.ts`(enum CRUD)+ tabs 式 `EnumsAdminView` + `EnumFormModal`(复用 Modal/Input/Switch/Button/ConfirmDialog)+ `/admin/enums` 子路由。

**Tech Stack:** Vue 3.5 + TS + Tailwind + Pinia + vue-router + vue-i18n + reka-ui + Vitest/MSW。

**契约/现状:** spec `docs/superpowers/specs/2026-06-06-admin-console-p2b-enums-design.md`。后端(已核对):`/api/admin/enums/{category}` list/`POST`、`PUT,DELETE /{category}/{id}`;`EnumValueRequest{code,labelZh,labelEn,sortOrder,active}`;`{category}`∈`DEPARTMENT|ROLE|LINK_CATEGORY|LINK_STATUS`。既有:`@/lib/api/client`(`request`/`ApiError`)、`@/lib/api/types`(`EnumValue{id,category,code,labelZh,labelEn,sortOrder,active}`、`EnumCategory`)、`@/lib/ui/{Modal,Input,Switch,Button,GlassCard,Badge,ConfirmDialog}.vue`(ConfirmDialog 支持 `confirmLabel`/`tone`)、`@/stores/toast`(`push({type:'success'|'error',message})`)、`@/lib/i18n/useLocale`(`pick`)、`@/router`(`routes`)、`AdminLayout`(nav 数组,枚举项现 `enabled:false`)。**硬约束:既有 44 测试保持绿。** 仓库 `/home/shane/Code/cim-portal/cim-portal-client`(在 `dev` 上新建 `p2b-enums`)。门禁 `npm run typecheck && npm test`(触集成加 `npm run build`)。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。冒烟:后端 `SPRING_PROFILES_ACTIVE=dev` 在 :8080,登录 ADMIN1。

---

## 文件结构

```
src/lib/api/admin.ts                          # T1 扩展
src/features/admin/enums/EnumFormModal.vue    # T2
src/features/admin/enums/EnumsAdminView.vue   # T3
src/router/index.ts                           # T4(加子路由)
src/features/admin/AdminLayout.vue            # T4(枚举 enabled)
+ admin.spec.ts(扩展)/ EnumFormModal.spec.ts / EnumsAdminView.spec.ts
```

---

## Task 1: admin.ts 扩展 enum CRUD

**Files:** Modify `src/lib/api/admin.ts`; Modify `src/lib/api/admin.spec.ts`

- [ ] **Step 1: 追加失败测试到 `src/lib/api/admin.spec.ts`(现有 describe 内新增)**
```ts
import { listEnumValues, createEnumValue, updateEnumValue, deleteEnumValue } from './admin'
// ... 在现有 describe('admin api', ...) 内追加:
  it('enum CRUD 命中 /api/admin/enums/{category}[/id]', async () => {
    server.use(http.get(`${BASE}/api/admin/enums/DEPARTMENT`, () => HttpResponse.json([{ id: 1, category: 'DEPARTMENT', code: 'IT', labelZh: '信息', labelEn: 'IT', sortOrder: 10, active: true }])))
    let postBody: any, putBody: any, del = false
    server.use(http.post(`${BASE}/api/admin/enums/ROLE`, async ({ request }) => { postBody = await request.json(); return HttpResponse.json({ id: 5, category: 'ROLE', ...postBody }) }))
    server.use(http.put(`${BASE}/api/admin/enums/ROLE/5`, async ({ request }) => { putBody = await request.json(); return HttpResponse.json({ id: 5, category: 'ROLE', ...putBody }) }))
    server.use(http.delete(`${BASE}/api/admin/enums/ROLE/5`, () => { del = true; return new HttpResponse(null, { status: 204 }) }))
    expect((await listEnumValues('DEPARTMENT'))[0].code).toBe('IT')
    const c = await createEnumValue('ROLE', { code: 'OP', labelZh: '操作', labelEn: 'Op', sortOrder: 10, active: true })
    expect(c.id).toBe(5); expect(postBody.code).toBe('OP')
    await updateEnumValue('ROLE', 5, { code: 'OP', labelZh: '操作员', labelEn: 'Operator', sortOrder: 10, active: false })
    expect(putBody.active).toBe(false)
    await deleteEnumValue('ROLE', 5); expect(del).toBe(true)
  })
```
(若文件顶部已 import 一批 admin 符号,把上述新符号并入同一 import 行。)

- [ ] **Step 2: 运行确认 FAIL** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm test -- api/admin` → FAIL(函数未定义)。

- [ ] **Step 3: 在 `src/lib/api/admin.ts` 末尾追加 enum 客户端**
```ts
import type { EnumValue, EnumCategory } from './types'   // 合并到文件顶部既有 import(若无则新增此行)

export interface EnumValueInput { code: string; labelZh: string; labelEn: string; sortOrder: number; active: boolean }

export const listEnumValues = (category: EnumCategory) =>
  request<EnumValue[]>('GET', `/api/admin/enums/${category}`)
export const createEnumValue = (category: EnumCategory, body: EnumValueInput) =>
  request<EnumValue>('POST', `/api/admin/enums/${category}`, body)
export const updateEnumValue = (category: EnumCategory, id: number, body: EnumValueInput) =>
  request<EnumValue>('PUT', `/api/admin/enums/${category}/${id}`, body)
export const deleteEnumValue = (category: EnumCategory, id: number) =>
  request<void>('DELETE', `/api/admin/enums/${category}/${id}`)
```
注:`admin.ts` 顶部已 `import { request } from './client'`;仅需确保 `import type { EnumValue, EnumCategory } from './types'` 存在(没有就加)。

- [ ] **Step 4: 运行 + typecheck** — `npm test -- api/admin && npm run typecheck` → PASS;typecheck 干净。

- [ ] **Step 5: Commit**
```bash
git add src/lib/api/admin.ts src/lib/api/admin.spec.ts
git commit -m "feat(admin): admin.ts 扩展 enum CRUD(listEnumValues/create/update/delete)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: EnumFormModal

**Files:** Create `src/features/admin/enums/EnumFormModal.vue`, `src/features/admin/enums/EnumFormModal.spec.ts`

- [ ] **Step 1: 失败测试 `src/features/admin/enums/EnumFormModal.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import EnumFormModal from './EnumFormModal.vue'

const BASE = 'http://localhost:8080'
beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }) })

describe('EnumFormModal', () => {
  it('create: 保存调 POST /api/admin/enums/{category}', async () => {
    let body: any
    server.use(http.post(`${BASE}/api/admin/enums/DEPARTMENT`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ id: 9, category: 'DEPARTMENT', ...body }) }))
    const w = mount(EnumFormModal, { props: { open: true, category: 'DEPARTMENT', value: null }, global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    const set = (id: string, v: string) => { const el = document.body.querySelector(`[data-testid="${id}"]`) as HTMLInputElement; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }
    set('e-code', 'MAINT'); set('e-zh', '维修'); set('e-en', 'Maint')
    await flushPromises()
    const save = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    save.click(); await flushPromises()
    expect(body.code).toBe('MAINT'); expect(body.labelZh).toBe('维修')
    w.unmount(); document.body.innerHTML = ''
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- EnumFormModal` → FAIL。

- [ ] **Step 3: 实现 `src/features/admin/enums/EnumFormModal.vue`**
```vue
<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import Modal from '@/lib/ui/Modal.vue'
import Input from '@/lib/ui/Input.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'
import { createEnumValue, updateEnumValue, type EnumValueInput } from '@/lib/api/admin'
import type { EnumValue, EnumCategory } from '@/lib/api/types'
import { ApiError } from '@/lib/api/client'
import { useToastStore } from '@/stores/toast'

const props = defineProps<{ open: boolean; category: EnumCategory; value: EnumValue | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()
const toast = useToastStore()
const form = reactive<EnumValueInput>({ code: '', labelZh: '', labelEn: '', sortOrder: 100, active: true })
const fieldErrors = ref<Record<string, string>>({})
const saving = ref(false)

watch(() => props.open, (o) => {
  if (!o) return
  fieldErrors.value = {}
  if (props.value) Object.assign(form, { code: props.value.code, labelZh: props.value.labelZh, labelEn: props.value.labelEn, sortOrder: props.value.sortOrder, active: props.value.active })
  else Object.assign(form, { code: '', labelZh: '', labelEn: '', sortOrder: 100, active: true })
}, { immediate: true })

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.code.trim()) e.code = '必填'
  if (!form.labelZh.trim()) e.labelZh = '必填'
  if (!form.labelEn.trim()) e.labelEn = '必填'
  fieldErrors.value = e
  return Object.keys(e).length === 0
}
async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const input: EnumValueInput = { ...form, sortOrder: Number(form.sortOrder) }
    if (props.value) await updateEnumValue(props.category, props.value.id, input)
    else await createEnumValue(props.category, input)
    toast.push({ type: 'success', message: props.value ? '已更新' : '已创建' })
    emit('saved'); emit('update:open', false)
  } catch (err) {
    if (err instanceof ApiError && err.fieldErrors) { const e: Record<string, string> = {}; err.fieldErrors.forEach((fe) => { e[fe.field] = fe.message }); fieldErrors.value = e }
    else toast.push({ type: 'error', message: '保存失败' })
  } finally { saving.value = false }
}
</script>
<template>
  <Modal :open="open" :title="value ? '编辑枚举值' : '新建枚举值'" @update:open="(v) => emit('update:open', v)">
    <div class="space-y-3">
      <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">代码 Code</span>
        <Input data-testid="e-code" :model-value="form.code" :disabled="!!value" placeholder="如 MES" @update:model-value="(v) => form.code = v" />
        <span v-if="fieldErrors.code" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.code }}</span></label>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">中文名</span>
          <Input data-testid="e-zh" :model-value="form.labelZh" @update:model-value="(v) => form.labelZh = v" />
          <span v-if="fieldErrors.labelZh" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelZh }}</span></label>
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">英文名</span>
          <Input data-testid="e-en" :model-value="form.labelEn" @update:model-value="(v) => form.labelEn = v" />
          <span v-if="fieldErrors.labelEn" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelEn }}</span></label>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">排序 Sort</span>
          <Input data-testid="e-sort" type="number" :model-value="String(form.sortOrder)" @update:model-value="(v) => form.sortOrder = Number(v)" /></label>
        <label class="flex items-end gap-2 pb-1"><Switch :model-value="form.active" @update:model-value="(v) => form.active = v" /> <span class="text-sm text-ink-2">启用</span></label>
      </div>
    </div>
    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">取消</Button>
      <Button :disabled="saving" @click="save">保存</Button>
    </template>
  </Modal>
</template>
```

- [ ] **Step 4: 运行 + typecheck** — `npm test -- EnumFormModal && npm run typecheck` → PASS。

- [ ] **Step 5: Commit**
```bash
git add src/features/admin/enums/EnumFormModal.vue src/features/admin/enums/EnumFormModal.spec.ts
git commit -m "feat(admin): EnumFormModal(枚举值表单:code/中英名/排序/启用)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: EnumsAdminView(tabs + 表 + 删除)

**Files:** Create `src/features/admin/enums/EnumsAdminView.vue`, `src/features/admin/enums/EnumsAdminView.spec.ts`

- [ ] **Step 1: 失败测试 `src/features/admin/enums/EnumsAdminView.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import EnumsAdminView from './EnumsAdminView.vue'

const BASE = 'http://localhost:8080'
beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
  server.use(http.get(`${BASE}/api/admin/enums/DEPARTMENT`, () => HttpResponse.json([{ id: 1, category: 'DEPARTMENT', code: 'IT', labelZh: '信息技术', labelEn: 'IT', sortOrder: 10, active: true }])))
  server.use(http.get(`${BASE}/api/admin/enums/ROLE`, () => HttpResponse.json([{ id: 2, category: 'ROLE', code: 'OPERATOR', labelZh: '操作员', labelEn: 'Operator', sortOrder: 10, active: true }])))
})
describe('EnumsAdminView', () => {
  it('默认载入部门;切到角色 tab 载入角色', async () => {
    const w = mount(EnumsAdminView, { global: { plugins: [i18n] } }); await flushPromises()
    expect(w.text()).toContain('信息技术'); expect(w.text()).toContain('IT')
    const roleTab = [...w.findAll('button')].find((b) => b.text().includes('角色'))!
    await roleTab.trigger('click'); await flushPromises()
    expect(w.text()).toContain('操作员')
  })
  it('删除走确认 → DELETE', async () => {
    let del = false
    server.use(http.delete(`${BASE}/api/admin/enums/DEPARTMENT/1`, () => { del = true; return new HttpResponse(null, { status: 204 }) }))
    const w = mount(EnumsAdminView, { global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    await w.get('[data-testid="enum-del-1"]').trigger('click'); await flushPromises()
    const confirm = [...document.body.querySelectorAll('button')].find((b) => /删除/.test(b.textContent || ''))!
    confirm.click(); await flushPromises()
    expect(del).toBe(true)
    w.unmount(); document.body.innerHTML = ''
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- EnumsAdminView` → FAIL。

- [ ] **Step 3: 实现 `src/features/admin/enums/EnumsAdminView.vue`**
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, AlertTriangle, RotateCw } from 'lucide-vue-next'
import { listEnumValues, deleteEnumValue } from '@/lib/api/admin'
import type { EnumValue, EnumCategory } from '@/lib/api/types'
import { useToastStore } from '@/stores/toast'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Button from '@/lib/ui/Button.vue'
import Badge from '@/lib/ui/Badge.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import ConfirmDialog from '@/lib/ui/ConfirmDialog.vue'
import EnumFormModal from './EnumFormModal.vue'

const CATEGORIES: { code: EnumCategory; label: string }[] = [
  { code: 'DEPARTMENT', label: '部门' }, { code: 'ROLE', label: '角色' },
  { code: 'LINK_CATEGORY', label: '链接分类' }, { code: 'LINK_STATUS', label: '链接状态' },
]
const toast = useToastStore()
const active = ref<EnumCategory>('DEPARTMENT')
const values = ref<EnumValue[]>([]); const loading = ref(true); const error = ref(false)
const formOpen = ref(false); const editing = ref<EnumValue | null>(null)
const confirmOpen = ref(false); const pending = ref<EnumValue | null>(null)

async function load() { loading.value = true; error.value = false; try { values.value = await listEnumValues(active.value) } catch { error.value = true } finally { loading.value = false } }
function switchTo(c: EnumCategory) { if (c !== active.value) { active.value = c; load() } }
function openCreate() { editing.value = null; formOpen.value = true }
function openEdit(v: EnumValue) { editing.value = v; formOpen.value = true }
function askDelete(v: EnumValue) { pending.value = v; confirmOpen.value = true }
async function doDelete() {
  if (!pending.value) return
  try { await deleteEnumValue(active.value, pending.value.id); toast.push({ type: 'success', message: '已删除' }); await load() }
  catch { toast.push({ type: 'error', message: '删除失败' }) }
  finally { confirmOpen.value = false; pending.value = null }
}
onMounted(load)
</script>
<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-bold">枚举管理</h1>
      <Button @click="openCreate"><Plus class="size-4" /> 新建</Button>
    </div>
    <div class="flex flex-wrap gap-1.5">
      <button v-for="c in CATEGORIES" :key="c.code" type="button"
        class="rounded-xl px-3 py-1.5 text-sm font-medium transition"
        :class="active === c.code ? 'bg-brand text-white shadow' : 'glass-strong text-ink-2 hover:text-[hsl(var(--ink))]'"
        @click="switchTo(c.code)">{{ c.label }}</button>
    </div>
    <div v-if="loading" class="space-y-2"><Skeleton v-for="n in 5" :key="n" /></div>
    <GlassCard v-else-if="error" class="p-8 text-center">
      <AlertTriangle class="mx-auto size-9 text-rose-500" /><p class="mt-2 text-rose-500">加载失败</p>
      <Button class="mx-auto mt-3" @click="load"><RotateCw class="size-4" /> 重试</Button>
    </GlassCard>
    <GlassCard v-else class="divide-y divide-border/60 p-0">
      <div v-for="v in values" :key="v.id" class="flex items-center gap-3 p-3.5">
        <span class="w-32 shrink-0 truncate font-mono text-xs text-ink-2">{{ v.code }}</span>
        <span class="min-w-0 flex-1 truncate text-sm">{{ v.labelZh }} <span class="text-ink-3">/ {{ v.labelEn }}</span></span>
        <span class="hidden w-12 shrink-0 text-center text-xs text-ink-3 sm:block">{{ v.sortOrder }}</span>
        <Badge>{{ v.active ? '启用' : '停用' }}</Badge>
        <span class="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" :data-testid="`enum-edit-${v.id}`" @click="openEdit(v)"><Pencil class="size-4" /></Button>
          <Button variant="ghost" size="icon" :data-testid="`enum-del-${v.id}`" @click="askDelete(v)"><Trash2 class="size-4 text-rose-500" /></Button>
        </span>
      </div>
      <div v-if="!values.length" class="p-8 text-center text-ink-3">该分类暂无枚举值</div>
    </GlassCard>

    <EnumFormModal v-model:open="formOpen" :category="active" :value="editing" @saved="load" />
    <ConfirmDialog v-model:open="confirmOpen" title="删除枚举值"
      :message="`确认删除「${pending?.code}」?删除可能影响仍在使用该 code 的链接/授权。`"
      @confirm="doDelete" @cancel="confirmOpen = false" />
  </div>
</template>
```
注:`Badge` 组件已存在(P1a);若其 props/用法不同(读 `src/lib/ui/Badge.vue` 确认),按实际微调(仅文案徽章)。`toast.push` 用 `{type,message}`。

- [ ] **Step 4: 运行 + typecheck** — `npm test -- EnumsAdminView && npm run typecheck` → PASS(2)。

- [ ] **Step 5: Commit**
```bash
git add src/features/admin/enums/EnumsAdminView.vue src/features/admin/enums/EnumsAdminView.spec.ts
git commit -m "feat(admin): EnumsAdminView(分类 tabs + 值表 + 警示删除)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 路由 + 侧栏启用「枚举」

**Files:** Modify `src/router/index.ts`, `src/features/admin/AdminLayout.vue`

- [ ] **Step 1: 路由** — `src/router/index.ts` 的 `/admin` `children` 内、`links` 项之后加:
```ts
      { path: 'enums', name: 'admin-enums', component: () => import('@/features/admin/enums/EnumsAdminView.vue') },
```

- [ ] **Step 2: 侧栏** — `src/features/admin/AdminLayout.vue` 的 `nav` 数组中枚举项改为 `enabled: true`:
```ts
  { to: '/admin/enums', label: '枚举', icon: ListChecks, enabled: true },
```
(其余 `用户` 仍 `enabled:false`。)

- [ ] **Step 3: typecheck + 全量 + build**
```bash
npm run typecheck && npm test && npm run build
```
Expected: typecheck 干净;全量绿(既有 44 + 本计划新增);build OK(动态 import 解析到 EnumsAdminView)。

- [ ] **Step 4: Commit**
```bash
git add src/router/index.ts src/features/admin/AdminLayout.vue
git commit -m "feat(admin): /admin/enums 路由 + 启用侧栏「枚举」

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 全量验证 + 运行冒烟

- [ ] **Step 1: 全量门禁** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → 干净/全绿/build OK。
- [ ] **Step 2: 运行冒烟(后端 dev :8080)** — `npm run dev`;登录 ADMIN1 → `/admin` 侧栏「枚举」可点 → `/admin/enums`:默认部门 tab 显示 IT/质量/一厂生产 等;切「链接分类」显示 MES/QUALITY/MAINTENANCE/LOGISTICS/REPORTS;新建一个枚举值(如 LINK_STATUS 加 `DEPRECATED`,若不存在)保存 → 刷新 + toast;编辑改中文名生效;删除走警示确认。模态不透明、下拉/通知不透明(沿用既有)。停止:`fuser -k 5173/tcp`。
- [ ] **Step 3: Commit(若小修)** — 无改动跳过。

---

## 自检清单(Self-Review)

**规格覆盖(spec §4/§5/§6/§7/§8):** enum 客户端 → T1;EnumFormModal(字段+保存+fieldErrors)→ T2;EnumsAdminView(tabs+表+删除警示)→ T3;路由 + 侧栏启用 → T4;测试三处 + 既有保持绿 → T1/T2/T3 + T5。删除警示语 → T3 ConfirmDialog message。tabs 切换载入 → T3 `switchTo`。

**占位符扫描:** 无 TBD;每步含完整代码/命令。Badge 用法标注「按 `Badge.vue` 实际微调」(仅文案徽章,低风险)。admin.ts import 合并标注。

**类型/命名一致性:** `EnumValueInput`、`listEnumValues/createEnumValue/updateEnumValue/deleteEnumValue`(category 段 + /id)、`EnumValue`/`EnumCategory`(复用 types)、`EnumFormModal`(`open`/`category`/`value`/`update:open`/`saved`)、`EnumsAdminView`(`active`/`switchTo`/`data-testid=enum-edit-/enum-del-`)、路由 `admin-enums`、ConfirmDialog(`confirmLabel` 默认「删除」/danger)跨 T1–T4 一致。**硬约束**(44 测试、reka-ui 原语行为)在 T4/T5 复测。
