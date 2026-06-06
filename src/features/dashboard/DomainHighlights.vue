<script setup lang="ts">
import { useLocale } from '@/lib/i18n/useLocale'
import type { HomeCategory } from '@/lib/api/types'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'

defineProps<{ categories: HomeCategory[] }>()
const { pick } = useLocale()
const ICON: Record<string, string> = { MES: 'factory', QA: 'line-chart', SPC: 'line-chart', AMS: 'wrench', MAINTENANCE: 'wrench', LOGISTICS: 'boxes', REPORTS: 'file-text' }
const GRAD: Record<string, string> = { MES: 'linear-gradient(135deg,#6366f1,#8b5cf6)', QA: 'linear-gradient(135deg,#06b6d4,#3b82f6)', AMS: 'linear-gradient(135deg,#f59e0b,#ef4444)', LOGISTICS: 'linear-gradient(135deg,#10b981,#06b6d4)', REPORTS: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }
function icon(c: HomeCategory) { return ICON[c.categoryCode] ?? 'boxes' }
function grad(c: HomeCategory) { return GRAD[c.categoryCode] ?? 'linear-gradient(135deg,#6366f1,#06b6d4)' }
</script>
<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
    <GlassCard v-for="c in categories" :key="c.categoryCode" class="p-4 transition hover:-translate-y-0.5">
      <span class="mb-2.5 grid size-9 place-items-center rounded-xl text-white" :style="{ backgroundImage: grad(c) }"><AppIcon :name="icon(c)" class="size-5" /></span>
      <div class="text-sm font-semibold">{{ pick(c, 'categoryLabel') }}</div>
      <div class="mt-0.5 text-xs text-ink-3">{{ c.categoryCode }}</div>
      <div class="mt-2 text-xs font-semibold text-[hsl(var(--primary))]">{{ c.links.length }} 个系统 →</div>
    </GlassCard>
  </div>
</template>
