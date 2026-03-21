import { render, type RenderOptions } from '@testing-library/vue'
import { createPinia } from 'pinia'
import type { Component } from 'vue'
import { createTestRouter } from './router-mock'

export function renderWithRouter(component: Component, options: RenderOptions = {}, initialRoute = '/') {
  const router = createTestRouter(initialRoute)
  const pinia = createPinia()
  return {
    ...render(component, {
      ...options,
      global: {
        ...options.global,
        plugins: [...(options.global?.plugins || []), router, pinia],
      },
    }),
    router,
    pinia,
  }
}

/**
 * 非同步版本，先等待 router 導航完成再渲染元件
 * 適用於元件需要在 setup/onMounted 中讀取 route.query 的場景
 */
export async function renderWithRouterAsync(component: Component, options: RenderOptions = {}, initialRoute = '/') {
  const router = createTestRouter(initialRoute)
  const pinia = createPinia()
  await router.isReady()
  return {
    ...render(component, {
      ...options,
      global: {
        ...options.global,
        plugins: [...(options.global?.plugins || []), router, pinia],
      },
    }),
    router,
    pinia,
  }
}
