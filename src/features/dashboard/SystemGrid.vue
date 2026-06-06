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
        {{ pick(c, 'categoryLabel') }}
        <span class="rounded-md bg-[hsl(var(--primary)/0.12)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">{{ c.categoryCode }}</span>
      </h3>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SystemCard v-for="l in c.links" :key="l.id" :link="l" />
      </div>
    </section>
  </div>
</template>
