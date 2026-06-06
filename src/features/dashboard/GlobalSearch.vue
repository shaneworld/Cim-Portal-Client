<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

defineProps<{ query: string; resultCount?: number }>()
const emit = defineEmits<{ 'update:query': [string] }>()
</script>

<template>
  <div class="relative flex items-center">
    <Search class="pointer-events-none absolute left-3 size-4 text-ink-3" />
    <input
      :value="query"
      type="text"
      placeholder="搜索系统、文档…"
      class="h-11 w-full rounded-xl border border-input glass-strong pl-10 pr-24 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @input="emit('update:query', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="query" class="absolute right-10 text-xs text-ink-3">找到 {{ resultCount ?? 0 }} 个</span>
    <button
      v-if="query"
      type="button"
      data-testid="search-clear"
      class="absolute right-3 text-ink-3 hover:text-[hsl(var(--ink))]"
      @click="emit('update:query', '')"
    >
      <X class="size-4" />
    </button>
  </div>
</template>
