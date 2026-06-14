<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Inbox, AlertTriangle, RotateCw, SearchX } from 'lucide-vue-next'
import type { HomeCategory, HomeLink } from '@/lib/api/types'
import { getHome } from '@/lib/api/portal'
import { useLocale } from '@/lib/i18n/useLocale'
import { useConfigStore } from '@/stores/config'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Button from '@/lib/ui/Button.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import AppHeader from './AppHeader.vue'
import HeroPanel from './HeroPanel.vue'
import SystemGrid from './SystemGrid.vue'
import SystemCard from './SystemCard.vue'
import GlobalSearch from './GlobalSearch.vue'
import AnnouncementsPanel from './AnnouncementsPanel.vue'
import DutyLinesPanel from './DutyLinesPanel.vue'

const { pick, t } = useLocale()
const configStore = useConfigStore()
const { config } = storeToRefs(configStore)
const categories = ref<HomeCategory[]>([])
const loading = ref(true); const error = ref(false); const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase(); if (!q) return categories.value
  return categories.value.map((c) => ({ ...c, links: c.links.filter((l) =>
    pick(l, 'name').toLowerCase().includes(q) || pick(c, 'categoryLabel').toLowerCase().includes(q)) })).filter((c) => c.links.length > 0)
})
const resultCount = computed(() => filtered.value.reduce((n, c) => n + c.links.length, 0))
const noMatch = computed(() => !loading.value && !error.value && categories.value.length > 0 && filtered.value.length === 0)

// Deduplicated favorites from the filtered set (accessible + favorite)
const seen = new Set<number>()
const favorites = computed<HomeLink[]>(() => {
  seen.clear()
  return filtered.value.flatMap((c) => c.links).filter((l) => {
    if (!l.favorite || !l.accessible) return false
    if (seen.has(l.id)) return false
    seen.add(l.id)
    return true
  })
})

// Handle star toggle from a SystemCard: update the link in the categories array in place
function onFavoriteChanged({ id, favorite }: { id: number; favorite: boolean }) {
  for (const cat of categories.value) {
    for (const link of cat.links) {
      if (link.id === id) { link.favorite = favorite; return }
    }
  }
}

async function load() {
  loading.value = true; error.value = false
  await configStore.reload()
  try { categories.value = (await getHome()).categories } catch { error.value = true } finally { loading.value = false }
}
onMounted(load)
</script>
<template>
  <div class="min-h-screen py-4 sm:py-6 px-[max(1rem,7vw)]">
    <div class="mx-auto max-w-[1600px] space-y-6">
      <AppHeader />
      <template v-if="loading">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><Skeleton v-for="n in 8" :key="n" /></div>
      </template>
      <GlassCard v-else-if="error" class="mx-auto mt-6 max-w-md p-8 text-center">
        <AlertTriangle class="mx-auto size-10 text-rose-500" /><p class="mt-3 font-medium text-rose-500">{{ t('dashboard.error') }}</p>
        <Button class="mx-auto mt-4" @click="load"><RotateCw class="size-4" /> {{ t('common.retry') }}</Button>
      </GlassCard>
      <template v-else>
        <HeroPanel v-if="config.heroEnabled !== false" :categories="categories" :compact="!!config.infoPanelEnabled" />
        <div v-if="config.infoPanelEnabled" class="grid gap-4 md:[grid-template-columns:1.95fr_1fr] md:h-[clamp(18rem,42vh,26rem)]">
          <AnnouncementsPanel class="min-h-0" />
          <DutyLinesPanel class="min-h-0" />
        </div>
        <GlobalSearch v-model:query="query" :result-count="resultCount" />
        <GlassCard v-if="categories.length === 0" class="mx-auto mt-4 max-w-md p-10 text-center">
          <Inbox class="mx-auto size-12 text-ink-3" /><p class="mt-3 text-ink-2">{{ t('dashboard.empty') }}</p>
        </GlassCard>
        <GlassCard v-else-if="noMatch" class="mx-auto mt-4 max-w-md p-10 text-center">
          <SearchX class="mx-auto size-12 text-ink-3" /><p class="mt-3 text-ink-2">{{ t('dashboard.noMatch') }}</p>
        </GlassCard>
        <template v-else>
          <!-- My links / 我的收藏 section — only shown when there are favorites -->
          <section v-if="favorites.length > 0">
            <h3 class="mb-4 flex items-center gap-3">
              <span class="h-6 w-1.5 rounded-full bg-amber-400"></span>
              <span class="text-lg font-extrabold tracking-tight">{{ t('dashboard.myLinks') }}</span>
              <span class="h-px flex-1 bg-border"></span>
            </h3>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              <SystemCard
                v-for="l in favorites"
                :key="l.id"
                :link="l"
                @favorite-changed="onFavoriteChanged"
              />
            </div>
          </section>
          <SystemGrid :categories="filtered" @favorite-changed="onFavoriteChanged" />
        </template>
      </template>
    </div>
  </div>
</template>
