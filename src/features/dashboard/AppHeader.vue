<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Languages, Sun, Moon, Monitor, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useLabelsStore } from '@/stores/labels'
import { useTheme, type ThemeMode } from '@/lib/theme/useTheme'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Button from '@/lib/ui/Button.vue'

const router = useRouter()
const auth = useAuthStore()
const labels = useLabelsStore()
const { locale } = useI18n({ useScope: 'global' })
const { mode, setMode } = useTheme()
const name = computed(() => (locale.value === 'zh' ? auth.currentUser?.displayNameZh : auth.currentUser?.displayNameEn) ?? '')
const ThemeIcon = computed(() => (mode.value === 'light' ? Sun : mode.value === 'dark' ? Moon : Monitor))
function toggleLocale() { labels.setLocale(locale.value === 'zh' ? 'en' : 'zh') }
function cycleTheme() { const o: ThemeMode[] = ['light', 'dark', 'system']; setMode(o[(o.indexOf(mode.value) + 1) % o.length]) }
function logout() { auth.logout(); try { router.push('/login') } catch { /* no router in tests */ } }
</script>
<template>
  <GlassCard class="flex items-center justify-between gap-2 p-3 sm:p-4">
    <div class="flex shrink-0 items-center gap-2.5">
      <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-brand font-extrabold text-white shadow-lg shadow-indigo-500/25">C</span>
      <b class="whitespace-nowrap text-lg">CIM 门户</b>
    </div>
    <nav class="flex min-w-0 items-center gap-1.5">
      <RouterLink v-if="auth.isAdmin" to="/admin" class="mr-1 inline-flex h-9 shrink-0 items-center rounded-xl bg-brand px-3 text-sm font-semibold text-white">管理</RouterLink>
      <span class="hidden max-w-[40vw] truncate px-1 text-sm text-ink-2 sm:inline">{{ name }} · {{ auth.currentUser?.employeeId }}</span>
      <Button variant="ghost" size="sm" class="shrink-0 gap-1.5" @click="toggleLocale"><Languages class="size-4" /> {{ locale === 'zh' ? 'EN' : '中' }}</Button>
      <Button variant="ghost" size="icon" class="shrink-0" @click="cycleTheme"><component :is="ThemeIcon" class="size-4" /></Button>
      <Button variant="ghost" size="icon" class="shrink-0" @click="logout"><LogOut class="size-4" /></Button>
    </nav>
  </GlassCard>
</template>
