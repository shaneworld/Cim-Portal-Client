<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ points: number[] }>()
const W = 460, H = 150
const coords = computed(() => {
  const pts = props.points; if (!pts.length) return []
  const min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1
  return pts.map((p, i) => [ (i / (pts.length - 1)) * W, H - ((p - min) / span) * (H - 20) - 10 ] as [number, number])
})
const line = computed(() => coords.value.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0]},${c[1]}`).join(' '))
const area = computed(() => coords.value.length ? `${line.value} L${W},${H} L0,${H} Z` : '')
const last = computed(() => coords.value[coords.value.length - 1])
</script>
<template>
  <svg width="100%" :height="H" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none">
    <defs><linearGradient id="areag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(79,70,229,.35)" /><stop offset="1" stop-color="rgba(79,70,229,0)" /></linearGradient></defs>
    <g stroke="rgba(30,41,80,.08)"><line x1="0" y1="38" x2="460" y2="38" /><line x1="0" y1="76" x2="460" y2="76" /><line x1="0" y1="114" x2="460" y2="114" /></g>
    <path :d="area" fill="url(#areag)" />
    <path :d="line" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle v-if="last" :cx="last[0]" :cy="last[1]" r="4" fill="#4f46e5" stroke="#fff" stroke-width="2" />
  </svg>
</template>
