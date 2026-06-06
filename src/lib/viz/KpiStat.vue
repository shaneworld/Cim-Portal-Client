<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ label: string; value: string; deltaPct?: number }>()
const up = computed(() => (props.deltaPct ?? 0) >= 0)
</script>
<template>
  <div class="flex items-center justify-between gap-2">
    <span class="text-sm text-ink-2">{{ label }}</span>
    <span class="flex items-baseline gap-1.5">
      <span class="text-base font-bold">{{ value }}</span>
      <span v-if="deltaPct !== undefined" class="text-[10.5px] font-semibold"
        :class="up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
        :data-dir="up ? 'up' : 'down'">{{ up ? '▲' : '▼' }} {{ Math.abs(deltaPct) }}%</span>
    </span>
  </div>
</template>
