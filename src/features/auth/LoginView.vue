<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck, Eye, EyeOff } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { startSso } from '@/lib/auth/sso'
import { ApiError } from '@/lib/api/client'
import GlassCard from '@/lib/ui/GlassCard.vue'
import BrandMark from '@/lib/ui/BrandMark.vue'
import Input from '@/lib/ui/Input.vue'
import Button from '@/lib/ui/Button.vue'
import { useLocale } from '@/lib/i18n/useLocale'

const router = useRouter()
const auth = useAuthStore()
const { config } = useConfigStore()
const { t } = useLocale()

const employeeId = ref('')
const password = ref('')
const showPassword = ref(false)
const busy = ref(false)
const redirecting = ref(false)
const error = ref('')

onMounted(async () => {
  // Already signed in (e.g. landed on /login with a valid token) → go straight to the app,
  // don't bounce through SSO. Prevents the redirect dance / flicker.
  if (auth.isAuthenticated) { router.replace('/'); return }
  // Auto-initiate SSO at most ONCE per browser session. The flag is set BEFORE redirecting
  // (not only on failure), so anything that returns to /login can't re-trigger an SSO loop.
  if (config.ssoEnabled && !sessionStorage.getItem('sso_attempted')) {
    sessionStorage.setItem('sso_attempted', '1')
    redirecting.value = true
    try {
      await startSso(config)
    } catch {
      redirecting.value = false
      error.value = t('auth.login.ssoFailed')
    }
  }
})

async function signIn() {
  busy.value = true; error.value = ''
  try {
    await auth.loginInternal(employeeId.value, password.value)
    router.push('/')
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'USER_INACTIVE' || e.code === 'USER_NOT_PROVISIONED')) {
      router.push('/account-inactive')
    } else {
      error.value = e instanceof Error ? e.message : t('auth.login.failed')
      auth.clear()
    }
  } finally { busy.value = false }
}

async function ssoRetry() {
  sessionStorage.setItem('sso_attempted', '1')
  error.value = ''
  redirecting.value = true
  try {
    await startSso(config)
  } catch {
    redirecting.value = false
    error.value = t('auth.login.ssoFailed')
  }
}
</script>
<template>
  <div class="flex min-h-screen items-center justify-center p-4 sm:p-6">
    <GlassCard class="w-full max-w-md p-6 animate-fade-up sm:p-7">
      <div class="mb-6 flex items-center gap-3">
        <span class="grid size-11 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-indigo-500/25"><BrandMark class="size-7" /></span>
        <div><h1 class="text-2xl font-bold leading-none">{{ t('auth.login.title') }}</h1><p class="mt-1 text-sm text-ink-2">{{ t('auth.login.internalTitle') }}</p></div>
      </div>

      <!-- SSO auto-redirect state -->
      <div v-if="redirecting" class="flex flex-col items-center gap-3 py-6 text-ink-2">
        <svg class="size-8 animate-spin text-[hsl(var(--primary))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p class="text-sm">{{ t('auth.login.ssoRedirecting') }}</p>
      </div>

      <!-- Internal login form -->
      <div v-else class="space-y-5">
        <div class="space-y-3">
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('auth.login.employeeIdLabel') }}</span>
            <Input v-model="employeeId" data-testid="employeeId" :placeholder="t('auth.login.employeeIdLabel')" @keyup.enter="signIn" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('auth.login.passwordLabel') }}</span>
            <div class="relative">
              <Input v-model="password" data-testid="password" :type="showPassword ? 'text' : 'password'" :placeholder="t('auth.login.passwordLabel')" class="pr-10" @keyup.enter="signIn" />
              <button type="button" :aria-label="showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')"
                class="absolute inset-y-0 right-0 grid w-10 place-items-center text-ink-3 transition hover:text-ink-2"
                @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" class="size-4" />
                <Eye v-else class="size-4" />
              </button>
            </div>
          </label>
        </div>
        <p v-if="error" class="text-sm text-rose-500">{{ error }}</p>
        <div class="space-y-3">
          <Button data-testid="signIn" class="w-full" :disabled="busy" @click="signIn">{{ t('auth.login.signIn') }}</Button>
          <Button v-if="config.ssoEnabled" variant="outline" class="w-full" :disabled="busy" @click="ssoRetry">{{ t('auth.login.ssoButton') }}</Button>
        </div>
      </div>

      <p class="mt-5 flex items-center gap-1.5 text-xs text-ink-3"><ShieldCheck class="size-3.5" /> {{ t('auth.login.footer') }}</p>
    </GlassCard>
  </div>
</template>
