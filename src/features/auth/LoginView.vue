<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { UserRound, ChevronRight, ShieldCheck } from 'lucide-vue-next'
import { DEV_IDENTITIES } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/lib/api/client'
import GlassCard from '@/lib/ui/GlassCard.vue'
import BrandMark from '@/lib/ui/BrandMark.vue'
import { useLocale } from '@/lib/i18n/useLocale'

const router = useRouter()
const auth = useAuthStore()
const { t } = useLocale()
const busy = ref<string | null>(null)
const error = ref('')

async function pick(employeeId: string) {
  busy.value = employeeId; error.value = ''
  try { await auth.login(employeeId); router.push('/') }
  catch (e) {
    if (e instanceof ApiError && (e.code === 'USER_INACTIVE' || e.code === 'USER_NOT_PROVISIONED')) router.push('/account-inactive')
    else { error.value = e instanceof Error ? e.message : t('auth.login.failed'); auth.clear() }
  } finally { busy.value = null }
}
</script>
<template>
  <div class="flex min-h-screen items-center justify-center p-4 sm:p-6">
    <GlassCard class="w-full max-w-md p-6 animate-fade-up sm:p-7">
      <div class="mb-6 flex items-center gap-3">
        <span class="grid size-11 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-indigo-500/25"><BrandMark class="size-7" /></span>
        <div><h1 class="text-2xl font-bold leading-none">{{ t('auth.login.title') }}</h1><p class="mt-1 text-sm text-ink-2">{{ t('auth.login.subtitle') }}</p></div>
      </div>
      <div class="space-y-2">
        <button v-for="id in DEV_IDENTITIES" :key="id.employeeId"
          class="group flex w-full items-center gap-3 rounded-xl glass-strong p-3 text-left transition hover:-translate-y-0.5 disabled:opacity-50"
          :disabled="busy !== null" @click="pick(id.employeeId)">
          <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-white"><UserRound class="size-4" /></span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-medium">{{ id.employeeId }} · {{ id.nameZh }}</span>
            <span class="block truncate text-xs text-ink-3">{{ id.hint }}</span>
          </span>
          <ChevronRight class="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
      <p v-if="error" class="mt-4 text-sm text-rose-500">{{ error }}</p>
      <p class="mt-5 flex items-center gap-1.5 text-xs text-ink-3"><ShieldCheck class="size-3.5" /> {{ t('auth.login.footer') }}</p>
    </GlassCard>
  </div>
</template>
