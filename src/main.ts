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


