<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ status: string }>()
const color = computed(() => props.status === 'ACTIVE' ? 'hsl(var(--go))' : props.status === 'MAINTENANCE' ? 'hsl(var(--caution))' : props.status === 'DEPRECATED' ? 'hsl(var(--stop))' : 'hsl(var(--ink-3))')
</script>
<template><span class="inline-block size-2 rounded-full" :style="{ background: color }" :title="status"></span></template>
