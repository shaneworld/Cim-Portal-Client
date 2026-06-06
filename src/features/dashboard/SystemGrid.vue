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
      <h3 class="mb-4 flex items-center gap-2 text-sm font-bold">
        <span class="h-4 w-1 rounded bg-brand"></span>{{ pick(c, 'categoryLabel') }}
        <span class="font-mono text-[10px] uppercase tracking-widest text-ink-3">{{ c.categoryCode }}</span>
      </h3>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SystemCard v-for="l in c.links" :key="l.id" :link="l" />
      </div>
    </section>
  </div>
</template>
