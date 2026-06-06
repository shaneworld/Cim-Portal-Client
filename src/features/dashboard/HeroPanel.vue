<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useClock } from '@/lib/composables/useClock'
import { createMetricsProvider, type PortalMetrics } from '@/lib/metrics'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Gauge from '@/lib/viz/Gauge.vue'
import KpiStat from '@/lib/viz/KpiStat.vue'
import AreaChart from '@/lib/viz/AreaChart.vue'

const { locale } = useI18n({ useScope: 'global' })
const auth = useAuthStore()
const { time, weekday } = useClock()
const metrics = ref<PortalMetrics | null>(null)
const name = computed(() => (locale.value === 'zh' ? auth.currentUser?.displayNameZh : auth.currentUser?.displayNameEn) ?? '')
const greeting = computed(() => { const h = new Date().getHours(); return h < 6 ? '凌晨好' : h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好' })
onMounted(async () => { metrics.value = await createMetricsProvider().getMetrics() })
</script>
<template>
  <GlassCard class="animate-fade-up grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.05fr_1.35fr]">
    <div class="lg:border-r lg:border-white/40 lg:pr-5">
      <div class="flex items-center justify-between">
        <span class="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          <span class="size-1.5 rounded-full bg-emerald-500" style="animation: pulse-dot 1.8s infinite"></span>实时概览 · LIVE</span>
        <span class="font-mono text-sm tabular-nums text-ink-2">{{ time }} · {{ weekday }}</span>
      </div>
      <h2 class="mt-2 text-lg font-bold">{{ greeting }}<template v-if="name">,{{ name }}</template></h2>
      <p class="text-xs text-ink-3">{{ auth.currentUser?.departmentCode }} · {{ auth.currentUser?.roleCode }}</p>
      <div v-if="metrics" class="mt-4 flex items-center gap-4">
        <Gauge :value="metrics.oeePct" label="OEE %" />
        <div class="flex-1 space-y-2">
          <KpiStat label="在制品 WIP" :value="String(metrics.wip)" :delta-pct="metrics.wipDeltaPct" />
          <KpiStat label="良率 Yield" :value="metrics.yieldPct + '%'" :delta-pct="metrics.yieldDeltaPct" />
          <KpiStat label="本班产量" :value="metrics.throughput" :delta-pct="metrics.throughputDeltaPct" />
        </div>
      </div>
    </div>
    <div>
      <div class="mb-1 flex items-center justify-between">
        <b class="text-sm">本班产出趋势</b>
        <span v-if="metrics?.sample" class="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-300">示例数据 SAMPLE</span>
      </div>
      <AreaChart v-if="metrics" :points="metrics.shiftOutput" />
    </div>
  </GlassCard>
</template>
