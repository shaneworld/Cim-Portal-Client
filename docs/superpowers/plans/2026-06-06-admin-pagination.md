# 管理控制台分页 实现计划(Links + Enums,客户端,每页 10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 LinksAdminView 与 EnumsAdminView 加客户端分页(每页 10),复用 `usePagination` 组合式 + `Pagination` 组件;无后端改动。

**Architecture:** `usePagination(items, size)`(切片 + 越界回夹 + reset)+ `Pagination.vue`(prev/页码/next,单页隐藏)+ 两 View 渲染 `paged` 并挂 `<Pagination>`(枚举切 tab 调 `reset()`)。

**Tech Stack:** Vue 3.5 + TS + Tailwind + Vitest/VTU。

**契约/现状:** spec `docs/superpowers/specs/2026-06-06-admin-pagination-design.md`。后端 list 返回全量(不改)。既有:`LinksAdminView`(`links: ref<AdminLink[]>`、`load()`、表格 `v-for="l in links"`、空态 `!links.length`、其后有 `<LinkFormModal>`/`<ConfirmDialog>`);`EnumsAdminView`(`values: ref<EnumValue[]>`、`active`、`load()`、`switchTo(c)`、`v-for="v in values"`、空态 `!values.length`);`@/lib/ui/Button.vue`。**硬约束:既有 48 测试保持绿。** 仓库 `/home/shane/Code/cim-portal/cim-portal-client`(在 `dev` 上新建 `pagination`)。门禁 `npm run typecheck && npm test`(触集成加 `npm run build`)。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## 文件结构

```
src/lib/composables/usePagination.ts     # T1
src/lib/ui/Pagination.vue                 # T2
src/features/admin/links/LinksAdminView.vue   # T3(改)
src/features/admin/enums/EnumsAdminView.vue   # T4(改)
+ usePagination.spec.ts / Pagination.spec.ts / 扩展两 View spec
```

---

## Task 1: usePagination 组合式

**Files:** Create `src/lib/composables/usePagination.ts`, `src/lib/composables/usePagination.spec.ts`

- [ ] **Step 1: 失败测试 `src/lib/composables/usePagination.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('切片 + totalPages', () => {
    const items = ref(Array.from({ length: 20 }, (_, i) => i + 1))
    const { page, paged, total, totalPages } = usePagination(items, 10)
    expect(total.value).toBe(20); expect(totalPages.value).toBe(2)
    expect(paged.value).toEqual([1,2,3,4,5,6,7,8,9,10])
    page.value = 2
    expect(paged.value).toEqual([11,12,13,14,15,16,17,18,19,20])
  })
  it('列表缩短后当前页越界回夹', async () => {
    const items = ref(Array.from({ length: 20 }, (_, i) => i + 1))
    const { page, totalPages } = usePagination(items, 10)
    page.value = 2
    items.value = [1, 2, 3]            // 现在只 1 页
    await nextTick()
    expect(totalPages.value).toBe(1); expect(page.value).toBe(1)
  })
  it('reset 回第 1 页', () => {
    const items = ref(Array.from({ length: 30 }, (_, i) => i))
    const { page, reset } = usePagination(items, 10)
    page.value = 3; reset(); expect(page.value).toBe(1)
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm test -- usePagination` → FAIL。

- [ ] **Step 3: 实现 `src/lib/composables/usePagination.ts`**
```ts
import { ref, computed, watch, type Ref } from 'vue'

export function usePagination<T>(items: Ref<T[]>, pageSize = 10) {
  const page = ref(1)
  const total = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
  const paged = computed(() => items.value.slice((page.value - 1) * pageSize, page.value * pageSize))
  watch(items, () => { if (page.value > totalPages.value) page.value = totalPages.value })
  function reset() { page.value = 1 }
  return { page, paged, total, totalPages, pageSize, reset }
}
```

- [ ] **Step 4: 运行 + typecheck** — `npm test -- usePagination && npm run typecheck` → PASS(3)。

- [ ] **Step 5: Commit**
```bash
git add src/lib/composables/usePagination.ts src/lib/composables/usePagination.spec.ts
git commit -m "feat(ui): usePagination 组合式(切片+越界回夹+reset)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Pagination 组件

**Files:** Create `src/lib/ui/Pagination.vue`, `src/lib/ui/Pagination.spec.ts`

- [ ] **Step 1: 失败测试 `src/lib/ui/Pagination.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from './Pagination.vue'

describe('Pagination', () => {
  it('单页(total<=pageSize)不渲染', () => {
    const w = mount(Pagination, { props: { page: 1, total: 8, pageSize: 10 } })
    expect(w.find('[data-testid="page-next"]').exists()).toBe(false)
  })
  it('多页:prev 在首页禁用,next emit 下一页', async () => {
    const w = mount(Pagination, { props: { page: 1, total: 25, pageSize: 10 } })
    expect(w.get('[data-testid="page-prev"]').attributes('disabled')).toBeDefined()
    await w.get('[data-testid="page-next"]').trigger('click')
    expect(w.emitted('update:page')?.at(-1)).toEqual([2])
  })
  it('点页码 emit 该页;末页 next 禁用', async () => {
    const w = mount(Pagination, { props: { page: 3, total: 25, pageSize: 10 } })   // 3 页
    expect(w.get('[data-testid="page-next"]').attributes('disabled')).toBeDefined()
    await w.get('[data-testid="page-n-1"]').trigger('click')
    expect(w.emitted('update:page')?.at(-1)).toEqual([1])
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- ui/Pagination` → FAIL。

- [ ] **Step 3: 实现 `src/lib/ui/Pagination.vue`**
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
const props = defineProps<{ page: number; total: number; pageSize: number }>()
const emit = defineEmits<{ 'update:page': [number] }>()
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
// 页码窗口:<=7 全显示;否则 1 … 当前±1 … 末页('…' = -1 占位)
const pages = computed<number[]>(() => {
  const n = totalPages.value
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
  const set = new Set<number>([1, n, props.page, props.page - 1, props.page + 1])
  const sorted = [...set].filter((p) => p >= 1 && p <= n).sort((a, b) => a - b)
  const out: number[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push(-1)
    out.push(sorted[i])
  }
  return out
})
function go(p: number) { if (p >= 1 && p <= totalPages.value && p !== props.page) emit('update:page', p) }
</script>
<template>
  <div v-if="total > pageSize" class="flex items-center justify-center gap-1.5 pt-1 text-sm">
    <button type="button" data-testid="page-prev" :disabled="page <= 1"
      class="grid size-9 place-items-center rounded-lg glass-strong text-ink-2 transition hover:text-[hsl(var(--ink))] disabled:opacity-40"
      @click="go(page - 1)"><ChevronLeft class="size-4" /></button>
    <template v-for="(p, i) in pages" :key="i">
      <span v-if="p === -1" class="px-1 text-ink-3">…</span>
      <button v-else type="button" :data-testid="`page-n-${p}`"
        class="grid size-9 place-items-center rounded-lg text-sm font-medium transition"
        :class="p === page ? 'bg-brand text-white shadow' : 'glass-strong text-ink-2 hover:text-[hsl(var(--ink))]'"
        @click="go(p)">{{ p }}</button>
    </template>
    <button type="button" data-testid="page-next" :disabled="page >= totalPages"
      class="grid size-9 place-items-center rounded-lg glass-strong text-ink-2 transition hover:text-[hsl(var(--ink))] disabled:opacity-40"
      @click="go(page + 1)"><ChevronRight class="size-4" /></button>
    <span class="ml-2 text-xs text-ink-3">共 {{ total }} 条</span>
  </div>
</template>
```

- [ ] **Step 4: 运行 + typecheck** — `npm test -- ui/Pagination && npm run typecheck` → PASS(3)。

- [ ] **Step 5: Commit**
```bash
git add src/lib/ui/Pagination.vue src/lib/ui/Pagination.spec.ts
git commit -m "feat(ui): Pagination 组件(prev/窗口页码/next,单页隐藏,共N条)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: LinksAdminView 接入分页

**Files:** Modify `src/features/admin/links/LinksAdminView.vue`; Modify `src/features/admin/links/LinksAdminView.spec.ts`

- [ ] **Step 1: 扩展测试(在现有 describe 内新增)`src/features/admin/links/LinksAdminView.spec.ts`**
```ts
  it('超过一页时分页:默认显示 10 行,翻到第 2 页显示其余', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, code: `c${i + 1}`, nameZh: `名${i + 1}`, nameEn: `N${i + 1}`, url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: i, openInNewTab: true, grants: [] }))
    server.use(http.get(`${BASE}/api/admin/links`, () => HttpResponse.json(many)))
    const w = mount(LinksAdminView, { global: { plugins: [i18n] } }); await flushPromises()
    expect(w.findAll('[data-testid^="del-"]').length).toBe(10)
    await w.get('[data-testid="page-next"]').trigger('click'); await flushPromises()
    expect(w.findAll('[data-testid^="del-"]').length).toBe(2)
  })
```
(现有用例 1 条链接 → 分页隐藏,保持绿。)

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- LinksAdminView` → 新用例失败(仍渲染全部/无分页)。

- [ ] **Step 3: 改 `LinksAdminView.vue`**

- script:加 `import { usePagination } from '@/lib/composables/usePagination'`、`import Pagination from '@/lib/ui/Pagination.vue'`;在 `const links = ref<AdminLink[]>([])` 之后加 `const { page, paged, total, pageSize } = usePagination(links, 10)`。
- 模板:链接行 `v-for="l in links"` → **`v-for="l in paged"`**(空态 `v-if="!links.length"` 不变,用总数)。
- 在链接列表 `</GlassCard>` 之后(`<LinkFormModal>` 之前)加:
  ```vue
  <Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />
  ```
- 删除后 `load()` → `usePagination` 的 watch 自动回夹页码(无需手动处理)。

- [ ] **Step 4: 运行 + typecheck + 全量** — `npm test -- LinksAdminView && npm run typecheck && npm test` → 新旧用例绿;全量绿。

- [ ] **Step 5: Commit**
```bash
git add src/features/admin/links/LinksAdminView.vue src/features/admin/links/LinksAdminView.spec.ts
git commit -m "feat(admin): LinksAdminView 接入客户端分页(每页10)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: EnumsAdminView 接入分页(切 tab reset)

**Files:** Modify `src/features/admin/enums/EnumsAdminView.vue`; Modify `src/features/admin/enums/EnumsAdminView.spec.ts`

- [ ] **Step 1: 扩展测试(在现有 describe 内新增)`src/features/admin/enums/EnumsAdminView.spec.ts`**
```ts
  it('分页 + 切分类回第 1 页', async () => {
    const dept = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, category: 'DEPARTMENT', code: `D${i + 1}`, labelZh: `部门${i + 1}`, labelEn: `D${i + 1}`, sortOrder: i, active: true }))
    server.use(http.get(`${BASE}/api/admin/enums/DEPARTMENT`, () => HttpResponse.json(dept)))
    server.use(http.get(`${BASE}/api/admin/enums/ROLE`, () => HttpResponse.json([{ id: 99, category: 'ROLE', code: 'OP', labelZh: '操作', labelEn: 'Op', sortOrder: 1, active: true }])))
    const w = mount(EnumsAdminView, { global: { plugins: [i18n] } }); await flushPromises()
    expect(w.findAll('[data-testid^="enum-del-"]').length).toBe(10)
    await w.get('[data-testid="page-next"]').trigger('click'); await flushPromises()
    expect(w.findAll('[data-testid^="enum-del-"]').length).toBe(2)   // 第 2 页 2 行
    const role = [...w.findAll('button')].find((b) => b.text().includes('角色'))!
    await role.trigger('click'); await flushPromises()
    // 切到角色:回第 1 页,显示其 1 行;page-next 不应存在(单页)
    expect(w.text()).toContain('操作'); expect(w.find('[data-testid="page-next"]').exists()).toBe(false)
  })
```

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- EnumsAdminView` → 新用例失败。

- [ ] **Step 3: 改 `EnumsAdminView.vue`**

- script:加 `import { usePagination } from '@/lib/composables/usePagination'`、`import Pagination from '@/lib/ui/Pagination.vue'`;在 `const values = ref<EnumValue[]>([])` 之后加 `const { page, paged, total, pageSize, reset } = usePagination(values, 10)`。
- `switchTo(c)`:在切换并 `load()` 前调用 `reset()`,即:
  ```ts
  function switchTo(c: EnumCategory) { if (c !== active.value) { active.value = c; reset(); load() } }
  ```
- 模板:值行 `v-for="v in values"` → **`v-for="v in paged"`**(空态 `!values.length` 不变)。
- 在值表 `</GlassCard>` 之后(`<EnumFormModal>` 之前)加 `<Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />`。

- [ ] **Step 4: 运行 + typecheck + 全量 + build** — `npm test -- EnumsAdminView && npm run typecheck && npm test && npm run build` → 新旧绿;全量绿;build OK。

- [ ] **Step 5: Commit**
```bash
git add src/features/admin/enums/EnumsAdminView.vue src/features/admin/enums/EnumsAdminView.spec.ts
git commit -m "feat(admin): EnumsAdminView 接入分页(每页10,切分类回第1页)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 全量验证 + 运行冒烟

- [ ] **Step 1: 全量门禁** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → 干净/全绿/build OK。
- [ ] **Step 2: 运行冒烟(后端 dev :8080)** — `npm run dev`;登录 ADMIN1 → `/admin/links`:底部出现分页(~75 链接 → 8 页),默认 10 行,点页码/箭头翻页;`/admin/enums`:链接分类等多值分类显示分页(若 >10),切分类回第 1 页。模态/通知不透明(沿用)。停止:`fuser -k 5173/tcp`。
- [ ] **Step 3: Commit(若小修)** — 无改动跳过。

---

## 自检清单(Self-Review)

**规格覆盖(spec §3/§4/§5/§6/§7):** usePagination(切片/回夹/reset)→ T1;Pagination(prev/窗口页码/next/单页隐藏/计数)→ T2;LinksAdminView 接入 → T3;EnumsAdminView 接入 + 切 tab reset → T4;测试四处 + 既有保持绿 → T1–T4 + T5。

**占位符扫描:** 无 TBD;每步含完整代码/命令。两 View 改动以「现有 `v-for`/空态/插入位置」精确点名(实现者按现文件接入)。

**类型/命名一致性:** `usePagination(items,size)→{page,paged,total,totalPages,pageSize,reset}`、`Pagination`(`page`/`total`/`pageSize`/`update:page`、`data-testid` page-prev/page-next/page-n-{n})、两 View 渲染 `paged`、枚举 `switchTo` 调 `reset()`,跨 T1–T4 一致。**硬约束**(48 测试、删除后回夹)在 T3/T4/T5 复测。
