<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'

const router = useRouter()
const auth = useAuthStore()
const { config } = storeToRefs(useConfigStore())
const status = ref<'pending' | 'error'>('pending')

onMounted(async () => {
  try {
    const { completeSso } = await import('@/lib/auth/sso')
    const token = await completeSso(config.value)
    auth.setToken(token)
    await auth.hydrateUser()
    router.replace('/')
  } catch {
    sessionStorage.setItem('sso_attempted', '1')
    status.value = 'error'
    router.replace('/login')
  }
})
</script>
<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="text-center text-ink-2">
      <svg v-if="status === 'pending'" class="mx-auto mb-3 size-8 animate-spin text-[hsl(var(--primary))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p>{{ status === 'pending' ? 'Signing in…' : 'SSO failed, redirecting…' }}</p>
    </div>
  </div>
</template>
