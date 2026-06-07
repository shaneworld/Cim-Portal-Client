<script setup lang="ts">
import { computed } from 'vue'
import { LINK_STATUS } from '@/constants'
const props = defineProps<{ status: string }>()
const color = computed(() => props.status === LINK_STATUS.ACTIVE ? 'hsl(var(--go))' : props.status === LINK_STATUS.MAINTENANCE ? 'hsl(var(--caution))' : props.status === LINK_STATUS.DEPRECATED ? 'hsl(var(--stop))' : 'hsl(var(--ink-3))')
</script>
<template><span class="inline-block size-2 rounded-full" :style="{ background: color }" :title="status"></span></template>
