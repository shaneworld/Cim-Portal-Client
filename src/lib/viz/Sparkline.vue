<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ points: number[]; width?: number; height?: number }>()
const w = computed(() => props.width ?? 80), h = computed(() => props.height ?? 24)
const d = computed(() => {
  const pts = props.points; if (!pts.length) return ''
  const min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1
  return pts.map((p, i) => `${(i / (pts.length - 1)) * w.value},${h.value - ((p - min) / span) * h.value}`).join(' ')
})
</script>
<template>
  <svg :width="w" :height="h" :viewBox="`0 0 ${w} ${h}`" preserveAspectRatio="none">
    <polyline :points="d" fill="none" stroke="hsl(var(--primary))" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
