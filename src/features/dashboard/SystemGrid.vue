<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocale } from '@/lib/i18n/useLocale'
import type { HomeCategory, HomeLink } from '@/lib/api/types'
import SystemCard from './SystemCard.vue'
import ConfirmDialog from '@/lib/ui/ConfirmDialog.vue'
import { LINK_STATUS } from '@/constants'
defineProps<{ categories: HomeCategory[] }>()
const emit = defineEmits<{ 'favorite-changed': [{ id: number; favorite: boolean }] }>()
const { pick, t } = useLocale()

const pending = ref<HomeLink | null>(null)
const dlgOpen = ref(false)
const dlg = computed(() => {
  const l = pending.value
  if (!l) return { title: '', message: '' }
  const name = pick(l, 'name')
  if (l.statusCode === LINK_STATUS.MAINTENANCE) return { title: t('dashboard.maintenanceDlg.title'), message: t('dashboard.maintenanceDlg.message', { name }) }
  return { title: t('dashboard.deprecatedDlg.title'), message: t('dashboard.deprecatedDlg.message', { name }) }
})
function onBlocked(link: HomeLink) { pending.value = link; dlgOpen.value = true }
function proceed() { const p = pending.value; dlgOpen.value = false; if (p) window.open(p.url!, p.openInNewTab ? '_blank' : '_self', 'noopener') }
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
        <SystemCard v-for="l in c.links" :key="l.id" :link="l" @blocked="onBlocked" @favorite-changed="emit('favorite-changed', $event)" />
      </div>
    </section>
    <ConfirmDialog v-model:open="dlgOpen" :title="dlg.title" :message="dlg.message" :confirm-label="t('dashboard.proceedOpen')" tone="primary" @confirm="proceed" @cancel="dlgOpen = false" />
  </div>
</template>
