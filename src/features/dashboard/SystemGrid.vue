<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocale } from '@/lib/i18n/useLocale'
import type { HomeCategory, HomeLink } from '@/lib/api/types'
import SystemCard from './SystemCard.vue'
import ConfirmDialog from '@/lib/ui/ConfirmDialog.vue'
defineProps<{ categories: HomeCategory[] }>()
const { pick } = useLocale()

const pending = ref<HomeLink | null>(null)
const dlgOpen = ref(false)
const dlg = computed(() => {
  const l = pending.value
  if (!l) return { title: '', message: '' }
  const name = pick(l, 'name')
  if (l.statusCode === 'MAINTENANCE') return { title: '系统维护中', message: `「${name}」正在维护,可能暂时无法正常使用。仍要打开吗?` }
  return { title: '系统已停用', message: `「${name}」已停用(旧版),建议改用替代系统。仍要打开吗?` }
})
function onBlocked(l: HomeLink) { pending.value = l; dlgOpen.value = true }
function proceed() { const l = pending.value; dlgOpen.value = false; if (l) window.open(l.url, l.openInNewTab ? '_blank' : '_self', 'noopener') }
</script>
<template>
  <div class="space-y-6">
    <section v-for="c in categories" :key="c.categoryCode">
      <h3 class="mb-4 flex items-center gap-3">
        <span class="h-6 w-1.5 rounded-full bg-brand"></span>
        <span class="text-lg font-extrabold tracking-tight">{{ pick(c, 'categoryLabel') }}</span>
        <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">{{ c.categoryCode }}</span>
        <span class="h-px flex-1 bg-border"></span>
      </h3>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <SystemCard v-for="l in c.links" :key="l.id" :link="l" @blocked="onBlocked" />
      </div>
    </section>
    <ConfirmDialog v-model:open="dlgOpen" :title="dlg.title" :message="dlg.message" confirm-label="仍要打开" tone="primary" @confirm="proceed" @cancel="dlgOpen = false" />
  </div>
</template>
