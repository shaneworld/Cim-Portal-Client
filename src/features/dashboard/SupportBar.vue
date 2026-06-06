<script setup lang="ts">
import { Phone } from 'lucide-vue-next'
import GlassCard from '@/lib/ui/GlassCard.vue'
</script>

<template>
  <GlassCard class="flex flex-wrap items-center justify-center gap-2 p-3.5 text-sm text-ink-2">
    <Phone class="size-4 text-[hsl(var(--primary))]" />
    遇到问题请拨打 <b class="font-mono text-base text-[hsl(var(--ink))]">39100</b>
    <span class="text-ink-3">· Call 39100 if you run into problems</span>
  </GlassCard>
</template>
