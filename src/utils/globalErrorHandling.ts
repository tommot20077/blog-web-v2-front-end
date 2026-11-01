/**
 * 全域錯誤處理（FE-01）
 *
 * 安裝三個全域出口：
 * 1. app.config.errorHandler：元件 render／lifecycle／事件處理中未被攔下的錯誤
 * 2. window 'unhandledrejection'：未被 catch 的 Promise rejection
 * 3. window 'error'：未捕捉的執行期錯誤
 *
 * 去重規則（不重複提示）：
 * - 已被 apiClient interceptor 標記處理過的錯誤 → 只記錄
 * - AbortError／取消請求 → 只記錄
 * - 同一個錯誤物件只提示一次（可能同時經過多個出口）
 * - window 'error' 沒有 error 物件（例如 ResizeObserver loop 訊息）→ 只記錄
 *
 * 各元件自己 catch 並顯示的錯誤不會走到這裡，行為不變。
 */
import type { App, ComponentPublicInstance } from 'vue'
import { useToast } from '../composables/useToast'
import {
  getComponentName,
  isErrorHandled,
  isIgnorableError,
  reportError,
} from './errorReporting'

export const GLOBAL_ERROR_TOAST_MESSAGE = '發生非預期的錯誤，請稍後再試或重新整理頁面'

/**
 * 安裝全域錯誤處理。
 * @param app - Vue app 實例
 * @param target - 事件目標（預設 window，測試可注入）
 * @returns 解除監聽的函式（冪等）
 */
export function installGlobalErrorHandling(app: App, target: Window = window): () => void {
  const { showToast } = useToast()
  const notified = new WeakSet<object>()

  /** 記錄；符合條件才提示使用者 */
  const handle = (error: unknown, source: string, componentName?: string, info?: string) => {
    reportError(error, { source, componentName, info })

    if (isIgnorableError(error) || isErrorHandled(error)) return
    if (typeof error === 'object' && error !== null) {
      if (notified.has(error)) return
      notified.add(error)
    }
    showToast(GLOBAL_ERROR_TOAST_MESSAGE, 'error')
  }

  app.config.errorHandler = (err: unknown, instance: ComponentPublicInstance | null, info: string) => {
    handle(err, 'vue-error-handler', getComponentName(instance), info)
  }

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    handle(event.reason, 'unhandledrejection')
  }

  const onWindowError = (event: ErrorEvent) => {
    // 沒有 error 物件（跨來源 Script error、ResizeObserver loop 等）：只記錄，不打擾使用者
    if (!event.error) {
      reportError(event.message, { source: 'window-error' })
      return
    }
    handle(event.error, 'window-error')
  }

  target.addEventListener('unhandledrejection', onUnhandledRejection)
  target.addEventListener('error', onWindowError)

  return () => {
    target.removeEventListener('unhandledrejection', onUnhandledRejection)
    target.removeEventListener('error', onWindowError)
  }
}
