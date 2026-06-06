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
