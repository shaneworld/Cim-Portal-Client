import { createApp } from 'vue'
import './assets/index.css'
import App from './App.vue'
import { bootstrap } from './bootstrap'

const app = createApp(App)
bootstrap(app)
app.mount('#app')

// 仅桌面(Tauri,--mode desktop)构建纳入并运行;Web 默认构建经 DCE 移除整条 Tauri 子图
if (import.meta.env.VITE_DESKTOP === 'true') {
  import('@/lib/desktop/updater').then((m) => m.maybeCheckForUpdates())
}
