<script setup lang="ts">
import { useLocale } from '@/lib/i18n/useLocale'
import type { HomeCategory } from '@/lib/api/types'
import SystemCard from './SystemCard.vue'
defineProps<{ categories: HomeCategory[] }>()
const { pick } = useLocale()
</script>
<template>
  <div class="space-y-6">
    <section v-for="c in categories" :key="c.categoryCode">
      <h3 class="mb-4 flex items-center gap-3">
        <span class="h-6 w-1.5 rounded-full bg-brand"></span>
        <span class="text-lg font-extrabold tracking-tight">{{ pick(c, 'categoryLabel') }}</span>
        <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">{{ c.categoryCode }}</span>
        <span class="h-px flex-1 bg-border md:mr-12"></span>
      </h3>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SystemCard v-for="l in c.links" :key="l.id" :link="l" />
      </div>
    </section>
  </div>
</template>
