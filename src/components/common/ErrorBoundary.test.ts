import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { RouterView, createRouter, createMemoryHistory } from 'vue-router'
import { render, screen, fireEvent } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import ErrorBoundary from './ErrorBoundary.vue'

const Thrower = defineComponent({
  name: 'Thrower',
  setup() {
    return () => {
      throw new Error('render boom')
    }
  },
})

const Healthy = defineComponent({
  name: 'Healthy',
  setup: () => () => h('p', 'healthy content'),
})

function createRoutes() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/bad', component: Thrower },
      { path: '/good', component: Healthy },
    ],
  })
}

describe('ErrorBoundary', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('沒有錯誤時渲染 slot 內容，不顯示 fallback', () => {
    render(ErrorBoundary, { slots: { default: () => h(Healthy) } })

    expect(screen.getByText('healthy content')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('子元件 render 拋錯：顯示 fallback，兄弟元件仍在', async () => {
    const Parent = defineComponent({
      setup: () => () =>
        h('div', [
          h('p', 'sibling stays'),
          h(ErrorBoundary, null, { default: () => h(Thrower) }),
        ]),
    })

    render(Parent)
    await flushPromises()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('此區塊載入失敗')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新整理' })).toBeInTheDocument()
    expect(screen.getByText('sibling stays')).toBeInTheDocument()
  })

  it('捕捉錯誤時記錄元件名稱', async () => {
    render(ErrorBoundary, { slots: { default: () => h(Thrower) } })
    await flushPromises()

    const logged = errorSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
    expect(logged).toContain('Thrower')
  })

  it('錯誤被邊界吸收，不再往上傳給 app.config.errorHandler', async () => {
    const appHandler = vi.fn()

    render(ErrorBoundary, {
      slots: { default: () => h(Thrower) },
      global: { config: { errorHandler: appHandler } },
    })
    await flushPromises()

    expect(appHandler).not.toHaveBeenCalled()
  })

  it('路由切換後 fallback 消失並恢復顯示新頁面', async () => {
    const router = createRoutes()
    router.push('/bad')
    await router.isReady()
    const Parent = defineComponent({
      setup: () => () => h(ErrorBoundary, null, { default: () => h(RouterView) }),
    })

    render(Parent, { global: { plugins: [router] } })
    await flushPromises()
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await router.push('/good')
    await flushPromises()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('healthy content')).toBeInTheDocument()
  })

  it('點擊「重新整理」呼叫 reload', async () => {
    const reload = vi.fn()
    const router = createRoutes()
    router.push('/bad')
    await router.isReady()
    const Parent = defineComponent({
      setup: () => () => h(ErrorBoundary, { reload }, { default: () => h(RouterView) }),
    })

    render(Parent, { global: { plugins: [router] } })
    await flushPromises()

    await fireEvent.click(screen.getByRole('button', { name: '重新整理' }))

    expect(reload).toHaveBeenCalledTimes(1)
  })
})
