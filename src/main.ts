import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createUnhead, headSymbol, VueHeadMixin } from '@unhead/vue'
import './index.css'
import router from './router'
import App from './App.vue'

const pinia = createPinia()
const head = createUnhead()

const app = createApp(App)
app.use(pinia)
app.use(router)
// @unhead/vue v2: 手動提供 head 實例給整個應用程式
app.provide(headSymbol, head)
app.mixin(VueHeadMixin)
app.mount('#app')

// E2E 測試用：開發模式下將 router 與 pinia 掛到 window，讓 Playwright 可觸發 SPA 導航
// 並操作 store state（例如模擬 access token 過期，驗證 axios refresh interceptor）
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__router = router
  ;(window as unknown as Record<string, unknown>).__pinia = pinia
}
