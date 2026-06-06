import type { App } from 'vue'
import { createPinia } from 'pinia'

export function bootstrap(app: App) {
  app.use(createPinia())
}
