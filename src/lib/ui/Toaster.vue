<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()
</script>
<template>
  <div class="pointer-events-none fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
    <TransitionGroup name="page">
      <div v-for="t in toast.toasts" :key="t.id" class="pointer-events-auto flex items-start gap-2 rounded-xl border border-border bg-white p-3 text-sm shadow-lg dark:bg-[#141b2e]">
        <CheckCircle2 v-if="t.type === 'success'" class="mt-0.5 size-4 shrink-0 text-emerald-500" />
        <Info v-else-if="t.type === 'info'" class="mt-0.5 size-4 shrink-0 text-[hsl(var(--primary))]" />
        <AlertCircle v-else class="mt-0.5 size-4 shrink-0 text-rose-500" />
        <span class="min-w-0 flex-1">{{ t.message }}</span>
        <a v-if="t.action" :href="t.action.href" target="_blank" rel="noopener noreferrer" class="shrink-0 font-semibold text-[hsl(var(--primary))] hover:underline">{{ t.action.label }}</a>
        <button class="text-ink-3 hover:text-[hsl(var(--ink))]" @click="toast.dismiss(t.id)"><X class="size-4" /></button>
      </div>
    </TransitionGroup>
  </div>
</template>
