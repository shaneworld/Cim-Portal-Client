<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Inbox, AlertTriangle, RotateCw, SearchX } from 'lucide-vue-next'
import type { HomeCategory } from '@/lib/api/types'
import { getHome } from '@/lib/api/portal'
import { useLocale } from '@/lib/i18n/useLocale'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Button from '@/lib/ui/Button.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import AppHeader from './AppHeader.vue'
import HeroPanel from './HeroPanel.vue'
import DomainHighlights from './DomainHighlights.vue'
import SystemGrid from './SystemGrid.vue'
import GlobalSearch from './GlobalSearch.vue'

const { pick } = useLocale()
const categories = ref<HomeCategory[]>([])
const loading = ref(true); const error = ref(false); const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase(); if (!q) return categories.value
  return categories.value.map((c) => ({ ...c, links: c.links.filter((l) =>
    pick(l, 'name').toLowerCase().includes(q) || l.code.toLowerCase().includes(q) || pick(c, 'categoryLabel').toLowerCase().includes(q)) })).filter((c) => c.links.length > 0)
})
const resultCount = computed(() => filtered.value.reduce((n, c) => n + c.links.length, 0))
const noMatch = computed(() => !loading.value && !error.value && categories.value.length > 0 && filtered.value.length === 0)
async function load() { loading.value = true; error.value = false; try { categories.value = (await getHome()).categories } catch { error.value = true } finally { loading.value = false } }
onMounted(load)
</script>
<template>
  <div class="min-h-screen p-4 pb-24 sm:p-6 sm:pb-24">
    <div class="mx-auto max-w-7xl space-y-8">
      <AppHeader />
      <template v-if="loading">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><Skeleton v-for="n in 8" :key="n" /></div>
      </template>
      <GlassCard v-else-if="error" class="mx-auto mt-6 max-w-md p-8 text-center">
        <AlertTriangle class="mx-auto size-10 text-rose-500" /><p class="mt-3 font-medium text-rose-500">加载失败</p>
        <Button class="mx-auto mt-4" @click="load"><RotateCw class="size-4" /> 重试</Button>
      </GlassCard>
      <template v-else>
        <HeroPanel :categories="categories" />
        <GlobalSearch v-model:query="query" :result-count="resultCount" />
        <GlassCard v-if="categories.length === 0" class="mx-auto mt-4 max-w-md p-10 text-center">
          <Inbox class="mx-auto size-12 text-ink-3" /><p class="mt-3 text-ink-2">暂无可访问的系统</p>
        </GlassCard>
        <GlassCard v-else-if="noMatch" class="mx-auto mt-4 max-w-md p-10 text-center">
          <SearchX class="mx-auto size-12 text-ink-3" /><p class="mt-3 text-ink-2">无匹配系统</p>
        </GlassCard>
        <template v-else>
          <section v-if="!query">
            <h2 class="mb-4 flex items-center gap-3">
              <span class="h-6 w-1.5 rounded-full bg-brand"></span>
              <span class="text-lg font-extrabold tracking-tight">系统分类</span>
              <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">Categories</span>
              <span class="h-px flex-1 bg-border"></span>
            </h2>
            <DomainHighlights :categories="categories" />
          </section>
          <section>
            <h2 class="mb-4 flex items-center gap-3">
              <span class="h-6 w-1.5 rounded-full bg-brand"></span>
              <span class="text-lg font-extrabold tracking-tight">所有系统</span>
              <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">All Systems</span>
              <span class="h-px flex-1 bg-border"></span>
            </h2>
            <SystemGrid :categories="filtered" />
          </section>
        </template>
      </template>
    </div>
  </div>
</template>
