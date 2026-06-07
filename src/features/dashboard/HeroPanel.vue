<script setup lang="ts">
import { computed } from 'vue'
import type { HomeCategory } from '@/lib/api/types'
import { useAuthStore } from '@/stores/auth'
import { useLocale } from '@/lib/i18n/useLocale'
import { useClock } from '@/lib/composables/useClock'
import GlassCard from '@/lib/ui/GlassCard.vue'
import { LINK_STATUS } from '@/constants'

const props = defineProps<{ categories: HomeCategory[] }>()
const { locale, pick, t } = useLocale()
const auth = useAuthStore()
const { time, weekday } = useClock()

const name = computed(() => (locale.value === 'zh' ? auth.currentUser?.displayNameZh : auth.currentUser?.displayNameEn) ?? '')
const greeting = computed(() => { const h = new Date().getHours(); return h < 6 ? t('dashboard.greeting.dawn') : h < 12 ? t('dashboard.greeting.morning') : h < 18 ? t('dashboard.greeting.afternoon') : t('dashboard.greeting.evening') })
const links = computed(() => props.categories.flatMap((c) => c.links))
const stats = computed(() => [
  { label: t('dashboard.stats.systems'), value: links.value.length },
  { label: t('dashboard.stats.categories'), value: props.categories.length },
  { label: t('dashboard.stats.online'), value: links.value.filter((l) => l.statusCode === LINK_STATUS.ACTIVE).length },
])
</script>

<template>
  <GlassCard class="animate-fade-up grid grid-cols-1 gap-5 p-5 sm:grid-cols-[1.1fr_1fr]">
    <div>
      <div class="flex items-center gap-2">
        <span class="size-1.5 rounded-full bg-emerald-500" style="animation: pulse-dot 1.8s infinite"></span>
        <span class="text-[10.5px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">在线 · LIVE</span>
      </div>
      <h2 class="mt-4 text-xl font-bold">{{ greeting }}<template v-if="name">,{{ name }}</template></h2>
      <p class="mt-2.5 text-sm text-ink-2">
        {{ auth.currentUser?.departmentCode }} · {{ auth.currentUser?.roleCode }}
        <span class="text-ink-3"> · 工号 {{ auth.currentUser?.employeeId }}</span>
      </p>
      <p class="mt-2.5 font-mono text-sm tabular-nums text-ink-3">{{ time }} · {{ weekday }}</p>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div v-for="s in stats" :key="s.label" class="glass-strong flex flex-col items-center justify-center rounded-xl p-3 text-center">
        <span class="text-3xl font-extrabold tabular-nums">{{ s.value }}</span>
        <span class="mt-1.5 text-sm font-medium text-ink-2">{{ s.label }}</span>
      </div>
    </div>
  </GlassCard>
</template>
