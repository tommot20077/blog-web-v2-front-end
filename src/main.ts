import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createUnhead, headSymbol, VueHeadMixin } from '@unhead/vue'
import './index.css'
import router from './router'
import App from './App.vue'
import apiClient from './api/apiClient'

const pinia = createPinia()
const head = createUnhead()

const app = createApp(App)
app.use(pinia)
app.use(router)
// @unhead/vue v2: 手動提供 head 實例給整個應用程式
app.provide(headSymbol, head)
app.mixin(VueHeadMixin)
app.mount('#app')

// E2E 測試用：開發模式下將 router、pinia 與 apiClient 掛到 window，讓 Playwright 可：
// - 觸發 SPA 導航（__router）
// - 操作 store state（__pinia，例如模擬 access token 過期）
// - 觸發真實並行 axios call（__apiClient，驗證 interceptor 的 isRefreshing+failedQueue 機制）
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__router = router
  ;(window as unknown as Record<string, unknown>).__pinia = pinia
  ;(window as unknown as Record<string, unknown>).__apiClient = apiClient

  if (import.meta.env.VITE_USE_MOCK === 'true') {
    import('./api/mock/e2eMockState').then(({ mockE2E }) => {
      ;(window as unknown as Record<string, unknown>).__mockE2E = mockE2E
    })
  }
}
