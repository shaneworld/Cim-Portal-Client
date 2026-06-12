<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ChevronLeft, Link2, ListChecks, ShieldCheck, Shield, Megaphone, Phone, Monitor } from 'lucide-vue-next'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppHeader from '@/features/dashboard/AppHeader.vue'
import { useLocale } from '@/lib/i18n/useLocale'

const { t } = useLocale()

const nav = [
  { to: '/admin/links', labelKey: 'admin.nav.links', icon: Link2, enabled: true },
  { to: '/admin/enums', labelKey: 'admin.nav.enums', icon: ListChecks, enabled: true },
  { to: '/admin/groups', labelKey: 'admin.nav.groups', icon: Shield, enabled: true },
  { to: '/admin/security', labelKey: 'admin.nav.security', icon: ShieldCheck, enabled: true },
  { to: '/admin/announcements', labelKey: 'admin.nav.announcements', icon: Megaphone, enabled: true },
  { to: '/admin/duty-lines', labelKey: 'admin.nav.dutyLines', icon: Phone, enabled: true },
  { to: '/admin/display', labelKey: 'admin.nav.display', icon: Monitor, enabled: true },
]
</script>
<template>
  <div class="flex h-[100dvh] flex-col py-4 sm:py-6 px-[max(1rem,7vw)]">
    <div class="flex min-h-0 w-full flex-1 flex-col gap-4">
      <AppHeader />
      <div class="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
      <GlassCard class="shrink-0 p-3 md:w-56">
        <RouterLink to="/" class="mb-3 flex items-center gap-1.5 px-2 text-sm text-ink-2 hover:text-[hsl(var(--ink))]"><ChevronLeft class="size-4" /> {{ t('admin.backToPortal') }}</RouterLink>
        <nav class="flex gap-1 overflow-x-auto md:flex-col">
          <template v-for="n in nav" :key="n.to">
            <RouterLink v-if="n.enabled" :to="n.to" class="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-2 transition hover:bg-[hsl(var(--primary)/0.1)]" active-class="bg-brand text-white">
              <component :is="n.icon" class="size-4" /> {{ t(n.labelKey) }}
            </RouterLink>
            <span v-else class="flex shrink-0 cursor-not-allowed items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-3/50">
              <component :is="n.icon" class="size-4" /> {{ t(n.labelKey) }}<span class="ml-auto hidden text-[10px] md:inline">{{ t('admin.comingSoon') }}</span>
            </span>
          </template>
        </nav>
      </GlassCard>
      <main class="min-h-0 min-w-0 flex-1"><RouterView /></main>
      </div>
    </div>
  </div>
</template>
