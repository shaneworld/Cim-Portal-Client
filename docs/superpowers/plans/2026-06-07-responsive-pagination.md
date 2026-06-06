# 分页按窗口高度自适应每页条数 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 管理列表每页条数随可见窗口高度自适应(ResizeObserver 观察面板正文 → floor(高/64),下限 5),面板全高、分页页脚钉底不跳。

**Architecture:** 新增 `useResponsivePageSize`(ResizeObserver→pageSize ref);`usePagination` 改为接受响应式 pageSize;`AdminPanel` 测量正文并 `v-model:page-size` 暴露 + 全高;恢复 `AdminLayout` 100dvh;两视图用 `rowsPerPage` ref 并删除 filler。

**Tech Stack:** Vue 3.5 + TS + Tailwind + Vitest/VTU。

**契约/现状:** spec `docs/superpowers/specs/2026-06-07-responsive-pagination-design.md`。当前(上轮后):`usePagination(items, 10)` 固定数字、返回 `{page,paged,total,totalPages,pageSize,reset}`;`AdminPanel`(`flex h-full flex-col p-0`,header/toolbar/body(`min-h-0 flex-1`)/footer 插槽,props `title`);`AdminLayout` 现为 `min-h-screen`(自然高,上轮回退);`LinksAdminView`/`EnumsAdminView` 含 `fillerCount` computed + filler spacer + 行 `h-16`。`Pagination`(`total>pageSize` 显示)。**硬约束:既有 61 测试保持绿。** 仓库 `/home/shane/Code/cim-portal/cim-portal-client`(在 `dev` 上新建 `responsive-pagination`)。门禁 `npm run typecheck && npm test`(触集成加 `npm run build`)。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## 文件结构

```
src/lib/composables/useResponsivePageSize.ts   # T1 新
src/lib/composables/usePagination.ts           # T2 改(响应式 pageSize)
src/features/admin/AdminPanel.vue              # T3 改(测量 + v-model + 全高保持)
src/features/admin/AdminLayout.vue             # T4 改(100dvh 全高)
src/features/admin/links/LinksAdminView.vue    # T4 改(rowsPerPage + 去 filler)
src/features/admin/enums/EnumsAdminView.vue    # T4 改(同上)
+ useResponsivePageSize.spec.ts / usePagination.spec.ts(扩展)
```

---

## Task 1: useResponsivePageSize 组合式

**Files:** Create `src/lib/composables/useResponsivePageSize.ts`, `src/lib/composables/useResponsivePageSize.spec.ts`

- [ ] **Step 1: 失败测试 `src/lib/composables/useResponsivePageSize.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { computeRows } from './useResponsivePageSize'

describe('computeRows', () => {
  it('floor(height / rowHeight)', () => {
    expect(computeRows(800, 64, 5)).toBe(12)   // 800/64=12.5 → 12
    expect(computeRows(640, 64, 5)).toBe(10)
  })
  it('下限优先', () => {
    expect(computeRows(200, 64, 5)).toBe(5)    // 200/64=3 → 下限5
    expect(computeRows(64, 64, 5)).toBe(5)
  })
})
```

- [ ] **Step 2: 运行确认 FAIL** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm test -- useResponsivePageSize` → FAIL（模块未找到）。

- [ ] **Step 3: 实现 `src/lib/composables/useResponsivePageSize.ts`**
```ts
import { onMounted, onBeforeUnmount, watch, type Ref } from 'vue'

export function computeRows(height: number, rowHeight: number, min: number): number {
  return Math.max(min, Math.floor(height / rowHeight))
}

export function useResponsivePageSize(
  el: Ref<HTMLElement | undefined>,
  out: Ref<number>,
  rowHeight = 64,
  min = 5,
) {
  let ro: ResizeObserver | undefined
  function measure() { if (el.value) out.value = computeRows(el.value.clientHeight, rowHeight, min) }
  onMounted(() => {
    if (typeof ResizeObserver === 'undefined') return
    ro = new ResizeObserver(measure)
    watch(el, (node) => { ro!.disconnect(); if (node) ro!.observe(node) }, { immediate: true })
  })
  onBeforeUnmount(() => ro?.disconnect())
}
```

- [ ] **Step 4: 运行 + typecheck** — `npm test -- useResponsivePageSize && npm run typecheck` → PASS（2），typecheck 干净。

- [ ] **Step 5: Commit**
```bash
git add src/lib/composables/useResponsivePageSize.ts src/lib/composables/useResponsivePageSize.spec.ts
git commit -m "feat(ui): useResponsivePageSize(ResizeObserver→每页行数,下限5)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: usePagination 接受响应式 pageSize

**Files:** Modify `src/lib/composables/usePagination.ts`, `src/lib/composables/usePagination.spec.ts`

- [ ] **Step 1: 追加失败测试到现有 `usePagination.spec.ts`(现有 describe 内新增)**
```ts
  it('接受 ref pageSize:改 ref 重算并回夹', async () => {
    const { ref, nextTick } = await import('vue')
    const items = ref(Array.from({ length: 30 }, (_, i) => i + 1))
    const size = ref(5)
    const { page, paged, totalPages } = usePagination(items, size)
    expect(paged.value.length).toBe(5); expect(totalPages.value).toBe(6)
    page.value = 6                       // 第 6 页(size=5,共 30)
    size.value = 20                      // 变大 → 共 2 页
    await nextTick()
    expect(totalPages.value).toBe(2); expect(page.value).toBe(2)   // 回夹 6→2
    expect(paged.value.length).toBe(10)  // 第 2 页:21..30
  })
```
（现有顶部已 `import { ref, nextTick } from 'vue'` 则复用,勿重复导入；本用例内联 import 防冲突。）

- [ ] **Step 2: 运行确认 FAIL** — `npm test -- usePagination` → 新用例失败（当前 pageSize 为固定数字,改 ref 不重算）。

- [ ] **Step 3: 改 `src/lib/composables/usePagination.ts` 为全文**
```ts
import { ref, computed, watch, toValue, type Ref, type MaybeRefOrGetter } from 'vue'

export function usePagination<T>(items: Ref<T[]>, pageSize: MaybeRefOrGetter<number>) {
  const page = ref(1)
  const size = computed(() => Math.max(1, toValue(pageSize)))
  const total = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
  const paged = computed(() => items.value.slice((page.value - 1) * size.value, page.value * size.value))
  watch([items, size], () => { if (page.value > totalPages.value) page.value = totalPages.value })
  function reset() { page.value = 1 }
  return { page, paged, total, totalPages, pageSize: size, reset }
}
```

- [ ] **Step 4: 运行 + typecheck + 全量** — `npm test -- usePagination && npm run typecheck && npm test` → 新旧 usePagination 用例通过；typecheck 干净；全量绿（既有数字调用与视图测试不受影响——返回 `pageSize` 仍解包为数字）。

- [ ] **Step 5: Commit**
```bash
git add src/lib/composables/usePagination.ts src/lib/composables/usePagination.spec.ts
git commit -m "feat(ui): usePagination 接受响应式 pageSize(ref/getter)+ size 变化回夹

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: AdminPanel 测量正文 + v-model:page-size

**Files:** Modify `src/features/admin/AdminPanel.vue`

- [ ] **Step 1: 改 `src/features/admin/AdminPanel.vue` 为全文**
```vue
<script setup lang="ts">
import { ref, useSlots } from 'vue'
import GlassCard from '@/lib/ui/GlassCard.vue'
import { useResponsivePageSize } from '@/lib/composables/useResponsivePageSize'
defineProps<{ title: string }>()
const pageSize = defineModel<number>('pageSize', { default: 10 })
const slots = useSlots()
const bodyEl = ref<HTMLElement>()
useResponsivePageSize(bodyEl, pageSize)
</script>

<template>
  <GlassCard class="flex h-full flex-col p-0">
    <div class="flex items-center justify-between gap-3 border-b border-border/60 p-4">
      <h1 class="text-lg font-bold">{{ title }}</h1>
      <div v-if="slots.actions" class="flex shrink-0 items-center gap-2"><slot name="actions" /></div>
    </div>
    <div v-if="slots.toolbar" class="border-b border-border/60 px-4 py-3"><slot name="toolbar" /></div>
    <div ref="bodyEl" class="min-h-0 flex-1 overflow-y-auto"><slot /></div>
    <div v-if="slots.footer" class="border-t border-border/60 px-4 py-3"><slot name="footer" /></div>
  </GlassCard>
</template>
```

- [ ] **Step 2: typecheck + AdminPanel 测试** — `npm run typecheck && npm test -- AdminPanel` → typecheck 干净；既有 AdminPanel 插槽测试通过（jsdom 无 ResizeObserver,pageSize 保持默认；插槽渲染不变）。

- [ ] **Step 3: Commit**
```bash
git add src/features/admin/AdminPanel.vue
git commit -m "feat(admin): AdminPanel 观察正文高度并以 v-model:page-size 暴露自适应每页数

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 全高布局 + 两视图接入(去 filler)

**Files:** Modify `src/features/admin/AdminLayout.vue`, `src/features/admin/links/LinksAdminView.vue`, `src/features/admin/enums/EnumsAdminView.vue`

- [ ] **Step 1: `AdminLayout.vue` 恢复全高**
将模板外层三处改为(其余侧栏/nav 不变):
```html
  <div class="min-h-screen p-4 sm:p-6">          →  <div class="flex h-[100dvh] flex-col p-4 sm:p-6">
    <div class="mx-auto max-w-[1600px] space-y-4"> →  <div class="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-4">
      <div class="flex flex-col gap-4 md:flex-row md:items-stretch"> → <div class="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
```
并将 `<main class="min-w-0 flex-1">` 改为 `<main class="min-h-0 min-w-0 flex-1">`。

- [ ] **Step 2: `LinksAdminView.vue`**
  - script:`import { ref, computed, onMounted } from 'vue'` → 若 `computed` 仅用于 fillerCount 则改回 `import { ref, onMounted } from 'vue'`；删除 `const fillerCount = computed(...)` 行；将 `const { page, paged, total, pageSize } = usePagination(links, 10)` 上方加 `const rowsPerPage = ref(10)`,并改为 `usePagination(links, rowsPerPage)`。
  - 模板:`<AdminPanel title="链接管理">` → `<AdminPanel title="链接管理" v-model:page-size="rowsPerPage">`；删除 filler 行 `<div v-if="fillerCount" :style="{ height: fillerCount * 64 + 'px' }" aria-hidden="true"></div>`；行 `h-16`、`<Pagination>` 不变。

- [ ] **Step 3: `EnumsAdminView.vue`**
  - script:同理删除 `fillerCount` 与多余 `computed` 引入;加 `const rowsPerPage = ref(10)`;`usePagination(values, rowsPerPage)`(保留 `reset`)。
  - 模板:`<AdminPanel title="枚举管理">` → 加 `v-model:page-size="rowsPerPage"`;删除 filler 行;其余(tabs/行 h-16/Pagination)不变。

- [ ] **Step 4: typecheck + 全量 + build** — `npm run typecheck && npm test && npm run build` → typecheck 干净；全量绿（视图测试:`rowsPerPage` 初始 10 + jsdom 无 RO → 仍每页 10,既有断言通过）；build OK。

- [ ] **Step 5: Commit**
```bash
git add src/features/admin/AdminLayout.vue src/features/admin/links/LinksAdminView.vue src/features/admin/enums/EnumsAdminView.vue
git commit -m "feat(admin): 全高布局 + Links/Enums 接入自适应每页数(去 filler)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 全量验证 + 运行冒烟

- [ ] **Step 1: 全量门禁** — `cd /home/shane/Code/cim-portal/cim-portal-client && npm run verify` → 干净/全绿/build OK。
- [ ] **Step 2: 运行冒烟(后端 dev :8080)** — `npm run dev`;登录 ADMIN1 → `/admin/links`:
  - 高窗口(如 1000px)每页行数 >10(行填满正文,无大空白);矮窗口(如 700px)每页行数更少;调整窗口高度 → 每页行数随之变化、分页页数重算。
  - 任意页分页控件钉在面板底部、位置恒定(末页不足整页时上方有空白、页脚不跳)。
  - `/admin/enums` 同样自适应;切分类回第 1 页。
  - 测量法:浏览器不同高度下 `[data-testid^="del-"]` 行数 ≈ floor(正文高/64),下限 5。停止:`fuser -k 5173/tcp`。
- [ ] **Step 3: Commit(若小修)** — 无改动跳过。

---

## 自检清单(Self-Review)

**规格覆盖(spec §3–§8):** useResponsivePageSize + computeRows → T1;usePagination 响应式 → T2;AdminPanel 测量 + v-model + 全高 → T3;AdminLayout 全高 + 两视图 rowsPerPage/去 filler → T4;测试两处 + 既有保持绿 → T1/T2 + T5。下限 5、行高 64、ResizeObserver、jsdom 安全 → T1。

**占位符扫描:** 无 TBD;每步含完整代码/命令。视图改动以「具体行替换 + 删除 filler」点名。

**类型/命名一致性:** `computeRows(height,rowHeight,min)`、`useResponsivePageSize(el,out,rowHeight=64,min=5)`、`usePagination(items, MaybeRefOrGetter<number>)→{page,paged,total,totalPages,pageSize:size,reset}`、AdminPanel `defineModel('pageSize')` ↔ 视图 `v-model:page-size="rowsPerPage"`、`usePagination(items, rowsPerPage)`,跨 T1–T4 一致。**硬约束**(61 测试、jsdom 无 RO 保持每页 10)在 T2/T3/T4/T5 复测。
