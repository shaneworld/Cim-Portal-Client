# 管理控制台分页:按窗口高度自适应每页条数 设计

**日期:** 2026-06-07
**状态:** 设计已确认,待用户审阅 → 实现计划
**背景:** 续「客户端分页(固定 10/页)」。改为**每页条数随可见窗口高度自适应**:面板填满可用视口高度,每页行数 = 面板正文区能容纳的 64px 行数,窗口缩放时重算。仓库 `cim-portal-client`。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 高度测量 | **ResizeObserver 观察面板正文元素**(测真实可用空间,自动适配 Links/Enums 不同 chrome,resize 重算,无硬编码偏移)。 |
| 最小行数 | **下限 5**(极矮窗口至少 5 行,放不下则正文滚动)。 |
| 行高 | 固定 `h-16` = **64px**(沿用),测量 ÷64。 |
| 占位撑高 | **去掉 filler spacer**:面板全高,分页页脚钉在底部,行数填满正文,无需占位。 |

**与上轮关系:** 上轮为防分页跳动 + 避免占满视口的大空白,把面板设为固定 10 行自然高。本轮自适应**取代**该方案——行数随高度填满正文(无空白),全高面板使页脚位置恒定(不跳)。

## 2. 组件与文件

```
src/lib/composables/useResponsivePageSize.ts   # 新:ResizeObserver → pageSize
src/lib/composables/usePagination.ts           # 改:pageSize 接受响应式
src/features/admin/AdminPanel.vue              # 改:测量正文 + v-model:page-size + 全高
src/features/admin/AdminLayout.vue             # 改:恢复 100dvh 全高
src/features/admin/links/LinksAdminView.vue    # 改:rowsPerPage ref + 去 filler
src/features/admin/enums/EnumsAdminView.vue    # 改:同上
+ useResponsivePageSize.spec.ts / usePagination.spec.ts(扩展)
```
复用:`@/lib/ui/Pagination.vue`(`total>pageSize` 时显示,自隐藏)、`GlassCard`。

## 3. useResponsivePageSize

`src/lib/composables/useResponsivePageSize.ts`:
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
    if (typeof ResizeObserver === 'undefined') return   // jsdom/SSR 安全
    ro = new ResizeObserver(measure)
    watch(el, (node) => { ro!.disconnect(); if (node) ro!.observe(node) }, { immediate: true })
  })
  onBeforeUnmount(() => ro?.disconnect())
}
```
- 写入调用方提供的 `out` ref;`ResizeObserver` 不存在(jsdom)时不触发,`out` 保持初始值。
- `clientHeight` = 正文可用高度(`flex-1`,由布局决定,与行数无关 → 无循环)。

## 4. usePagination(改为响应式 pageSize)

`src/lib/composables/usePagination.ts`:
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
- `pageSize` 现接受数字或 ref/getter;返回 `pageSize: size`(computed,模板自动解包为数字)。
- 既有以数字 `10` 调用仍可用(`toValue(10)===10`)。
- `watch([items, size])`:列表或每页数变化(含窗口变大致 pageSize 增大)时回夹页码。

## 5. AdminPanel(测量 + 暴露 pageSize + 全高)

```vue
<script setup lang="ts">
import { ref, useSlots } from 'vue'
import GlassCard from '@/lib/ui/GlassCard.vue'
import { useResponsivePageSize } from '@/lib/composables/useResponsivePageSize'
defineProps<{ title: string }>()
const pageSize = defineModel<number>('pageSize', { default: 10 })
const slots = useSlots()
const bodyEl = ref<HTMLElement>()
useResponsivePageSize(bodyEl, pageSize)   // 64px 行高 / 下限 5
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
- `pageSize` 为可选 v-model;只分页的视图绑定 `v-model:page-size`,不绑定的(理论上)仍工作(model 默认 10,无害)。
- `h-full` 填满 `main`;`bodyEl` 为 `flex-1` 正文,被观察。

## 6. AdminLayout(恢复全高)

```html
<div class="flex h-[100dvh] flex-col p-4 sm:p-6">
  <div class="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-4">
    <AppHeader />
    <div class="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
      <GlassCard class="shrink-0 p-3 md:w-56"> …侧栏不变… </GlassCard>
      <main class="min-h-0 min-w-0 flex-1"><RouterView /></main>
    </div>
  </div>
</div>
```
(即恢复上轮被撤的全高结构;侧栏 `md:flex-row` 默认 stretch → 与面板等高。)

## 7. 视图改动(Links / Enums)

二者一致:
- script:`const rowsPerPage = ref(10)`;`const { page, paged, total, pageSize } = usePagination(items, rowsPerPage)`;**删除** `fillerCount` computed 与 `computed` 多余引入(若仅此处用)。
- 模板:`<AdminPanel title="…" v-model:page-size="rowsPerPage">`;**删除** filler spacer `<div v-if="fillerCount" …>`;行保留 `h-16`;`<Pagination :page :total :page-size="pageSize" @update:page>` 不变(`total>pageSize` 时显示)。
- Enums 切分类仍 `reset()`。

## 8. 测试

- **`useResponsivePageSize.spec.ts`**:`computeRows(800,64,5)===12`;`computeRows(200,64,5)===5`(下限);`computeRows(64,64,5)===5`(下限优先于 1)。
- **`usePagination.spec.ts`(扩展)**:传入 `ref` pageSize → 改 ref 重算 `paged`/`totalPages`;pageSize 由 5→20(变大)且当前在第 3 页 → 回夹到有效页。既有数字调用用例保持。
- **既有视图测试**:`rowsPerPage` 初始 10 + jsdom 无 ResizeObserver(不触发)→ 仍每页 10,既有分页断言通过。
- 既有 61 测试保持绿。

## 9. 不在范围内(YAGNI)

每页尺寸手动选择器;持久化每页数;非 64px 行的视图(当前都 h-16);防抖(ResizeObserver 自身已合并,极端抖动可后续加);服务端分页。
