<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { LogOut, LayoutDashboard } from 'lucide-vue-next'
import type { HomeCategory } from '@/lib/api/types'
import { getHome } from '@/lib/api/portal'
import { useAuthStore } from '@/stores/auth'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Button from '@/lib/ui/Button.vue'

const { locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const auth = useAuthStore()
const categories = ref<HomeCategory[]>([])
const name = computed(() => (locale.value === 'zh' ? auth.currentUser?.displayNameZh : auth.currentUser?.displayNameEn) ?? '')
const total = computed(() => categories.value.reduce((n, c) => n + c.links.length, 0))
function logout() { auth.logout(); try { router.push('/login') } catch {} }
onMounted(async () => { try { categories.value = (await getHome()).categories } catch { /* placeholder */ } })
</script>
<template>
  <div class="min-h-screen p-4 sm:p-6">
    <div class="mx-auto max-w-7xl space-y-4">
      <GlassCard class="flex items-center justify-between p-4">
        <div class="flex items-center gap-2.5">
          <span class="grid size-8 place-items-center rounded-lg bg-brand font-extrabold text-white">C</span>
          <b class="text-lg">CIM 门户</b>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-ink-2">{{ name }} · {{ auth.currentUser?.employeeId }}</span>
          <Button variant="ghost" @click="logout"><LogOut class="size-4" /></Button>
        </div>
      </GlassCard>

      <GlassCard class="p-8 text-center animate-fade-up">
        <LayoutDashboard class="mx-auto size-10 text-[hsl(var(--primary))]" />
        <h1 class="mt-3 text-xl font-bold">仪表盘 · 你好,{{ name }}</h1>
        <p class="mt-2 text-ink-2">已接入 {{ total }} 个可访问系统。完整玻璃仪表盘(实时数据可视化、领域高亮、系统网格)将于 P1b 上线。</p>
      </GlassCard>
    </div>
  </div>
</template>
