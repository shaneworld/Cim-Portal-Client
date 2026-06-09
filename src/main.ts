import { createApp } from 'vue'
import './assets/index.css'
import App from './App.vue'
import { bootstrap } from './bootstrap'

const app = createApp(App)
bootstrap(app).then(() => app.mount('#app'))
