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
