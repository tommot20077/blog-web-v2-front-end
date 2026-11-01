import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { RouterView, createRouter, createMemoryHistory } from 'vue-router'
import { render, screen, fireEvent } from '@testing-library/vue'
import { onMounted } from 'vue'
import { markErrorHandled } from '../../utils/errorReporting'
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

    render(Parent, { global: { plugins: [createRoutes()] } })
    await flushPromises()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('此區塊載入失敗')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新整理' })).toBeInTheDocument()
    expect(screen.getByText('sibling stays')).toBeInTheDocument()
  })

  it('捕捉錯誤時記錄元件名稱', async () => {
    render(ErrorBoundary, {
      slots: { default: () => h(Thrower) },
      global: { plugins: [createRoutes()] },
    })
    await flushPromises()

    const logged = errorSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
    expect(logged).toContain('Thrower')
  })

  it('錯誤被邊界吸收，不再往上傳給 app.config.errorHandler', async () => {
    const appHandler = vi.fn()

    render(ErrorBoundary, {
      slots: { default: () => h(Thrower) },
      global: { config: { errorHandler: appHandler }, plugins: [createRoutes()] },
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
  it('fallback 內有「回首頁」連結指向 /（shell 版面導覽列在 view 內，避免死胡同）', async () => {
    render(ErrorBoundary, {
      slots: { default: () => h(Thrower) },
      global: { plugins: [createRoutes()] },
    })
    await flushPromises()

    const link = screen.getByRole('link', { name: '回首頁' })
    expect(link).toHaveAttribute('href', '/')
  })

  describe('只吸收 render／setup 的同步錯誤，其餘交給 global handler', () => {
    it('async onMounted reject 已標記 handled 的 Error：頁面內容仍在、無 fallback，錯誤往上傳', async () => {
      const appHandler = vi.fn()
      const err = markErrorHandled(new Error('API 失敗'))
      const AsyncMounted = defineComponent({
        name: 'AsyncMounted',
        setup() {
          onMounted(async () => {
            throw err
          })
          return () => h('p', 'page content')
        },
      })

      render(ErrorBoundary, {
        slots: { default: () => h(AsyncMounted) },
        global: { config: { errorHandler: appHandler }, plugins: [createRoutes()] },
      })
      await flushPromises()

      expect(screen.getByText('page content')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(appHandler).toHaveBeenCalledTimes(1)
      expect(appHandler.mock.calls[0][0]).toBe(err)
    })

    it('async onMounted reject 一般 Error（info 為 mounted hook）：同樣不顯示 fallback', async () => {
      const appHandler = vi.fn()
      const AsyncMounted = defineComponent({
        setup() {
          onMounted(async () => {
            throw new Error('unhandled api failure')
          })
          return () => h('p', 'page content')
        },
      })

      render(ErrorBoundary, {
        slots: { default: () => h(AsyncMounted) },
        global: { config: { errorHandler: appHandler }, plugins: [createRoutes()] },
      })
      await flushPromises()

      expect(screen.getByText('page content')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(appHandler).toHaveBeenCalledTimes(1)
    })

    it('async onClick reject：頁面內容仍在、無 fallback', async () => {
      const appHandler = vi.fn()
      const Clicker = defineComponent({
        setup() {
          const onClick = async () => {
            throw markErrorHandled(new Error('儲存失敗'))
          }
          return () => h('button', { onClick }, 'save')
        },
      })

      render(ErrorBoundary, {
        slots: { default: () => h(Clicker) },
        global: { config: { errorHandler: appHandler }, plugins: [createRoutes()] },
      })
      await fireEvent.click(screen.getByRole('button', { name: 'save' }))
      await flushPromises()

      expect(screen.getByRole('button', { name: 'save' })).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(appHandler).toHaveBeenCalledTimes(1)
    })

    it('已標記 handled 的錯誤即使發生在 render 也不設 hasError，交給上層', async () => {
      // 不用 VTU mount：它會把 render 階段錯誤在 mount 後重新拋出，無法驗證「交給 app.errorHandler」
      const appHandler = vi.fn()
      const err = markErrorHandled(new Error('handled in render'))
      const HandledThrower = defineComponent({
        setup: () => () => {
          throw err
        },
      })
      const app = createApp({
        render: () => h(ErrorBoundary, null, { default: () => h(HandledThrower) }),
      })
      app.config.errorHandler = appHandler
      app.use(createRoutes())
      const root = document.createElement('div')
      document.body.appendChild(root)

      app.mount(root)
      await flushPromises()

      expect(root.querySelector('[role="alert"]')).toBeNull()
      expect(appHandler).toHaveBeenCalled()
      expect(appHandler.mock.calls[0][0]).toBe(err)
      app.unmount()
      root.remove()
    })
  })
})
