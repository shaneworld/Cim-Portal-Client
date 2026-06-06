import type { App } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import { createAppRouter } from '@/router'
import { configureClient } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useTheme } from '@/lib/theme/useTheme'

export function bootstrap(app: App) {
  app.use(createPinia())
  app.use(i18n)
  configureClient({
    baseUrl: '',
    getToken: () => useAuthStore().token,
    getLocale: () => i18n.global.locale.value,
    onUnauthorized: () => { useAuthStore().clear() }
  })
  useTheme().init()
  useLocaleStore().initLocale()
  app.use(createAppRouter())
}
