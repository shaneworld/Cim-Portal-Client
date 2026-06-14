<script setup lang="ts">
import { ref, useSlots } from 'vue'
import GlassCard from '@/lib/ui/GlassCard.vue'
import { useResponsivePageSize } from '@/lib/composables/useResponsivePageSize'
defineProps<{ title: string }>()
const pageSize = defineModel<number>('pageSize', { default: 10 })
const slots = useSlots()
const bodyEl = ref<HTMLElement>()
useResponsivePageSize(bodyEl, pageSize)
</script>

<template>
  <GlassCard class="flex h-full flex-col p-0">
    <div class="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
      <h1 class="flex min-h-10 items-center text-lg font-bold">{{ title }}</h1>
      <div v-if="slots.actions" class="flex shrink-0 items-center gap-2"><slot name="actions" /></div>
    </div>
    <div v-if="slots.toolbar" class="border-b border-border/60 px-5 py-3"><slot name="toolbar" /></div>
    <div ref="bodyEl" class="min-h-0 flex-1 overflow-y-auto"><slot /></div>
    <div v-if="slots.footer" class="border-t border-border/60 px-5 py-3"><slot name="footer" /></div>
  </GlassCard>
</template>
