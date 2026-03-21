import { render, type RenderOptions } from '@testing-library/vue'
import type { Component } from 'vue'
import { createTestRouter } from './router-mock'

export function renderWithRouter(component: Component, options: RenderOptions = {}, initialRoute = '/') {
  const router = createTestRouter(initialRoute)
  return {
    ...render(component, {
      ...options,
      global: {
        ...options.global,
        plugins: [...(options.global?.plugins || []), router],
      },
    }),
    router,
  }
}
