<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import Button from '@/lib/ui/Button.vue'

defineProps<{ query: string; resultCount?: number }>()
const emit = defineEmits<{ 'update:query': [string] }>()
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="relative w-full max-w-md">
      <Search class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
      <input
        :value="query"
        type="text"
        placeholder="搜索系统、文档…"
        class="h-10 w-full rounded-xl border border-input glass-strong pl-12 pr-24 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @input="emit('update:query', ($event.target as HTMLInputElement).value)"
        @keyup.enter="emit('update:query', query)"
      />
      <span v-if="query" class="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-ink-3">找到 {{ resultCount ?? 0 }} 个</span>
      <button
        v-if="query"
        type="button"
        data-testid="search-clear"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-[hsl(var(--ink))]"
        @click="emit('update:query', '')"
      >
        <X class="size-4" />
      </button>
    </div>
    <Button variant="primary" class="shrink-0 gap-1.5" @click="emit('update:query', query)"><Search class="size-4" /> 搜索</Button>
  </div>
</template>
