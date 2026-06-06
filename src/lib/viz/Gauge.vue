<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ value: number; label?: string; max?: number }>()
const R = 44, C = 2 * Math.PI * R
const offset = computed(() => C * (1 - Math.min(1, props.value / (props.max ?? 100))))
</script>
<template>
  <svg width="104" height="104" viewBox="0 0 104 104">
    <circle cx="52" cy="52" :r="R" fill="none" stroke="rgba(30,41,80,.10)" stroke-width="10" />
    <circle cx="52" cy="52" :r="R" fill="none" stroke="url(#gaugeg)" stroke-width="10" stroke-linecap="round"
      :stroke-dasharray="C" :stroke-dashoffset="offset" transform="rotate(-90 52 52)" />
    <defs><linearGradient id="gaugeg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1" /><stop offset="1" stop-color="#06b6d4" /></linearGradient></defs>
    <text x="52" y="49" text-anchor="middle" font-size="21" font-weight="800" fill="currentColor">{{ value }}</text>
    <text x="52" y="64" text-anchor="middle" font-size="10" fill="hsl(var(--ink-3))">{{ label }}</text>
  </svg>
</template>
