<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ChevronLeft, Link2, ListChecks, Tags, Users } from 'lucide-vue-next'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppHeader from '@/features/dashboard/AppHeader.vue'
const nav = [
  { to: '/admin/links', label: '链接', icon: Link2, enabled: true },
  { to: '/admin/enums', label: '枚举', icon: ListChecks, enabled: false },
  { to: '/admin/labels', label: '标签', icon: Tags, enabled: false },
  { to: '/admin/users', label: '用户', icon: Users, enabled: false },
]
</script>
<template>
  <div class="min-h-screen p-4 sm:p-6">
    <div class="mx-auto max-w-[1600px] space-y-4">
      <AppHeader />
      <div class="flex flex-col gap-4 md:flex-row">
      <GlassCard class="shrink-0 p-3 md:w-56">
        <RouterLink to="/" class="mb-3 flex items-center gap-1.5 px-2 text-sm text-ink-2 hover:text-[hsl(var(--ink))]"><ChevronLeft class="size-4" /> 返回门户</RouterLink>
        <nav class="flex gap-1 overflow-x-auto md:flex-col">
          <template v-for="n in nav" :key="n.to">
            <RouterLink v-if="n.enabled" :to="n.to" class="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-2 transition hover:bg-[hsl(var(--primary)/0.1)]" active-class="bg-brand text-white">
              <component :is="n.icon" class="size-4" /> {{ n.label }}
            </RouterLink>
            <span v-else class="flex shrink-0 cursor-not-allowed items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-3/50">
              <component :is="n.icon" class="size-4" /> {{ n.label }}<span class="ml-auto hidden text-[10px] md:inline">即将上线</span>
            </span>
          </template>
        </nav>
      </GlassCard>
      <main class="min-w-0 flex-1"><RouterView /></main>
      </div>
    </div>
  </div>
</template>
