import { createApp } from 'vue'
import './assets/index.css'
import App from './App.vue'
import { bootstrap } from './bootstrap'

const app = createApp(App)
bootstrap(app)
app.mount('#app')

// 桌面端(Tauri)启动后检查更新;web 环境为 no-op
import('@/lib/desktop/updater').then((m) => m.maybeCheckForUpdates())
