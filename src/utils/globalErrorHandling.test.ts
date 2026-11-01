import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { CanceledError } from 'axios'
import { createRouter, createMemoryHistory } from 'vue-router'
import {
  installGlobalErrorHandling,
  GLOBAL_ERROR_TOAST_MESSAGE,
  APP_UPDATED_TOAST_MESSAGE,
} from './globalErrorHandling'
import { isChunkLoadError } from './chunkLoadError'
import { markErrorHandled } from './errorReporting'
import { useToast } from '../composables/useToast'

/** 派發 unhandledrejection（happy-dom 無 PromiseRejectionEvent，改用一般 Event 掛 reason） */
function dispatchRejection(reason: unknown) {
  const event = new Event('unhandledrejection') as Event & { reason: unknown }
  event.reason = reason
  window.dispatchEvent(event)
}

function dispatchWindowError(error: unknown, message = 'Uncaught') {
  const event = new Event('error') as Event & { error: unknown; message: string }
  event.error = error
  event.message = message
  window.dispatchEvent(event)
}

describe('installGlobalErrorHandling', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>
  let teardown: () => void
  const { toasts, removeToast } = useToast()

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    toasts.value.forEach((t) => removeToast(t.id))
    teardown = installGlobalErrorHandling(createApp({ render: () => null }))
  })

  afterEach(() => {
    teardown()
    toasts.value.forEach((t) => removeToast(t.id))
  })

  describe('app.config.errorHandler', () => {
    it('元件拋錯時被呼叫，記錄元件名稱與 info，並提示一次', () => {
      const Boom = defineComponent({
        name: 'BoomComponent',
        setup() {
          return () => {
            throw new Error('render failed')
          }
        },
      })
      const app = createApp({ render: () => h(Boom) })
      const off = installGlobalErrorHandling(app)

      app.mount(document.createElement('div'))

      expect(app.config.errorHandler).toBeTypeOf('function')
      const logged = errorSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
      expect(logged).toContain('BoomComponent')
      expect(logged).toContain('render')
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].type).toBe('error')
      expect(toasts.value[0].message).toBe(GLOBAL_ERROR_TOAST_MESSAGE)
      off()
    })

    it('已被 apiClient interceptor 處理過的錯誤只記錄，不重複提示', () => {
      const app = createApp({ render: () => null })
      const off = installGlobalErrorHandling(app)

      app.config.errorHandler!(markErrorHandled(new Error('伺服器錯誤')), null, 'native event handler')

      expect(errorSpy).toHaveBeenCalled()
      expect(toasts.value).toHaveLength(0)
      off()
    })
  })

  describe('unhandledrejection', () => {
    it('一般 Error：記錄並提示一次', () => {
      const err = new Error('promise failed')

      dispatchRejection(err)

      expect(errorSpy).toHaveBeenCalled()
      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].message).toBe(GLOBAL_ERROR_TOAST_MESSAGE)
    })

    it('同一個錯誤物件重複通知，只提示一次', () => {
      const err = new Error('same')

      dispatchRejection(err)
      dispatchRejection(err)

      expect(toasts.value).toHaveLength(1)
    })

    it('被 interceptor 處理過的 axios 錯誤：不重複提示（仍記錄）', () => {
      dispatchRejection(markErrorHandled(new Error('Network Error')))

      expect(errorSpy).toHaveBeenCalled()
      expect(toasts.value).toHaveLength(0)
    })

    it('AbortError：不提示', () => {
      dispatchRejection(new DOMException('The operation was aborted', 'AbortError'))

      expect(toasts.value).toHaveLength(0)
    })

    it('axios 取消請求（CanceledError）：不提示', () => {
      dispatchRejection(new CanceledError('canceled'))

      expect(toasts.value).toHaveLength(0)
    })

    it('非 Error 的 reason（例如字串）也會記錄並提示', () => {
      dispatchRejection('plain string rejection')

      expect(errorSpy).toHaveBeenCalled()
      expect(toasts.value).toHaveLength(1)
    })
  })

  describe('window error', () => {
    it('未捕捉的執行期錯誤：記錄並提示一次', () => {
      dispatchWindowError(new Error('uncaught'))

      expect(errorSpy).toHaveBeenCalled()
      expect(toasts.value).toHaveLength(1)
    })

    it('沒有 error 物件的事件（例如 ResizeObserver loop 訊息）：只記錄，不提示', () => {
      dispatchWindowError(null, 'ResizeObserver loop completed with undelivered notifications.')

      expect(toasts.value).toHaveLength(0)
    })

    it('AbortError：不提示', () => {
      dispatchWindowError(new DOMException('aborted', 'AbortError'))

      expect(toasts.value).toHaveLength(0)
    })
  })

  describe('teardown', () => {
    it('呼叫回傳的函式後，不再監聽 window 事件', () => {
      teardown()
      errorSpy.mockClear()

      dispatchRejection(new Error('after teardown'))

      expect(errorSpy).not.toHaveBeenCalled()
      expect(toasts.value).toHaveLength(0)
      // afterEach 會再呼叫一次 teardown，需為冪等
    })
  })
  describe('chunk 載入失敗（部署後舊分頁）', () => {
    const CHUNK_MESSAGES = [
      'Failed to fetch dynamically imported module: https://x.test/assets/Foo-abc.js',
      'Importing a module script failed.',
      'error loading dynamically imported module: https://x.test/assets/Foo-abc.js',
    ]

    it.each(CHUNK_MESSAGES)('isChunkLoadError 辨識：%s', (message) => {
      expect(isChunkLoadError(new TypeError(message))).toBe(true)
    })

    it('isChunkLoadError 不誤判一般錯誤', () => {
      expect(isChunkLoadError(new Error('Network Error'))).toBe(false)
      expect(isChunkLoadError(null)).toBe(false)
      expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false)
    })

    it('router.onError 收到 chunk 錯誤：出現更新提示（含重新整理動作），沒有通用 toast', async () => {
      teardown()
      const reload = vi.fn()
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', component: { render: () => null } },
          {
            path: '/lazy',
            component: () => Promise.reject(new TypeError(CHUNK_MESSAGES[0])),
          },
        ],
      })
      teardown = installGlobalErrorHandling(createApp({ render: () => null }), { router, reload })
      router.push('/')
      await router.isReady()

      await router.push('/lazy').catch(() => {})

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].message).toBe(APP_UPDATED_TOAST_MESSAGE)
      expect(toasts.value.some((t) => t.message === GLOBAL_ERROR_TOAST_MESSAGE)).toBe(false)
      expect(toasts.value[0].action?.label).toBe('重新整理')
      toasts.value[0].action?.onClick()
      expect(reload).toHaveBeenCalledTimes(1)
    })

    it('router.onError 收到非 chunk 錯誤：只記錄，不提示（維持原本只 log 的行為）', async () => {
      teardown()
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', component: { render: () => null } },
          { path: '/bad', component: () => Promise.reject(new Error('some guard failure')) },
        ],
      })
      teardown = installGlobalErrorHandling(createApp({ render: () => null }), { router })
      router.push('/')
      await router.isReady()
      errorSpy.mockClear()

      await router.push('/bad').catch(() => {})

      expect(errorSpy).toHaveBeenCalled()
      expect(toasts.value).toHaveLength(0)
    })

    it('vite:preloadError 事件：出現更新提示且不走通用 toast', () => {
      const event = new Event('vite:preloadError') as Event & { payload: unknown }
      event.payload = new TypeError(CHUNK_MESSAGES[1])

      window.dispatchEvent(event)

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].message).toBe(APP_UPDATED_TOAST_MESSAGE)
    })

    it('同一次載入內多個 chunk 錯誤（preloadError + rejection + 不同錯誤物件）只提示一次', () => {
      const e1 = new TypeError(CHUNK_MESSAGES[0])
      const preload = new Event('vite:preloadError') as Event & { payload: unknown }
      preload.payload = e1

      window.dispatchEvent(preload)
      dispatchRejection(e1)
      dispatchRejection(new TypeError(CHUNK_MESSAGES[2]))

      expect(toasts.value).toHaveLength(1)
      expect(toasts.value[0].message).toBe(APP_UPDATED_TOAST_MESSAGE)
    })

    it('teardown 後不再監聽 vite:preloadError', () => {
      teardown()
      const event = new Event('vite:preloadError') as Event & { payload: unknown }
      event.payload = new TypeError(CHUNK_MESSAGES[0])

      window.dispatchEvent(event)

      expect(toasts.value).toHaveLength(0)
    })
  })
})
