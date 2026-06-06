<script setup lang="ts">
import { useSlots } from 'vue'
import GlassCard from '@/lib/ui/GlassCard.vue'
defineProps<{ title: string }>()
const slots = useSlots()
</script>

<template>
  <GlassCard class="flex h-full flex-col p-0">
    <div class="flex items-center justify-between gap-3 border-b border-border/60 p-4">
      <h1 class="text-lg font-bold">{{ title }}</h1>
      <div v-if="slots.actions" class="flex shrink-0 items-center gap-2"><slot name="actions" /></div>
    </div>
    <div v-if="slots.toolbar" class="border-b border-border/60 px-4 py-3"><slot name="toolbar" /></div>
    <div class="min-h-0 flex-1 overflow-y-auto"><slot /></div>
    <div v-if="slots.footer" class="border-t border-border/60 px-4 py-3"><slot name="footer" /></div>
  </GlassCard>
</template>
