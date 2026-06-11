import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getConfig, type PortalConfig } from '@/lib/api/portal'

const FALLBACK: PortalConfig = { ssoEnabled: false, scopes: 'openid profile', usernameClaim: 'preferred_username' }

export const useConfigStore = defineStore('config', () => {
  const config = ref<PortalConfig>({ ...FALLBACK })
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    try {
      config.value = await getConfig()
    } catch {
      config.value = { ...FALLBACK }
    }
    loaded.value = true
  }

  async function reload() {
    try {
      config.value = await getConfig()
    } catch {
      // keep current config on failure
    }
    loaded.value = true
  }

  return { config, loaded, load, reload }
})
