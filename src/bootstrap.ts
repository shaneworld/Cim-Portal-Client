import type { App } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import { createAppRouter } from '@/router'
import { configureClient } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useTheme } from '@/lib/theme/useTheme'
import { useConfigStore } from '@/stores/config'

export async function bootstrap(app: App) {
  const pinia = createPinia()
  app.use(pinia)
  app.use(i18n)
  configureClient({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
    getToken: () => useAuthStore().token,
    getLocale: () => i18n.global.locale.value,
    onUnauthorized: () => { useAuthStore().clear() }
  })
  useTheme().init()
  useLocaleStore().initLocale()
  // Load portal config before mounting so login flow knows ssoEnabled
  await useConfigStore().load()
  app.use(createAppRouter())
}
