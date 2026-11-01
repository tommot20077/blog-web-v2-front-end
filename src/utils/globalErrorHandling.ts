/**
 * 全域錯誤處理（FE-01）
 *
 * 安裝三個全域出口：
 * 1. app.config.errorHandler：元件 render／lifecycle／事件處理中未被攔下的錯誤
 * 2. window 'unhandledrejection'：未被 catch 的 Promise rejection
 * 3. window 'error'：未捕捉的執行期錯誤
 *
 * 4. router.onError／window 'vite:preloadError'：部署後舊分頁載入新 chunk 失敗
 *    （見 chunkLoadError.ts）→ 提示「網站已更新」並附「重新整理」按鈕，不走通用 toast。
 *    選擇「提示 + 手動重新整理」而非自動 reload：自動 reload 會讓編輯器等頁面的未儲存內容消失。
 *    同一次載入只提示一次（router.onError、preloadError、unhandledrejection 常同時觸發）。
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
import type { Router } from 'vue-router'
import { useToast } from '../composables/useToast'
import { isChunkLoadError } from './chunkLoadError'
import {
  getComponentName,
  isErrorHandled,
  isIgnorableError,
  reportError,
} from './errorReporting'

export const GLOBAL_ERROR_TOAST_MESSAGE = '發生非預期的錯誤，請稍後再試或重新整理頁面'
export const APP_UPDATED_TOAST_MESSAGE = '網站已更新，請重新整理'

/** 更新提示停留時間：夠長讓使用者先存檔再按重新整理 */
const APP_UPDATED_TOAST_DURATION = 60_000

export interface GlobalErrorHandlingOptions {
  /** 事件目標（預設 window，測試可注入） */
  target?: Window
  /** 掛上 router.onError 以接住路由 chunk 載入失敗 */
  router?: Router
  /** 「重新整理」動作（預設 location.reload，測試可注入） */
  reload?: () => void
}

/**
 * 安裝全域錯誤處理。
 * @param app - Vue app 實例
 * @param options - target／router／reload（皆選填）
 * @returns 解除監聽的函式（冪等）
 */
export function installGlobalErrorHandling(
  app: App,
  options: GlobalErrorHandlingOptions = {},
): () => void {
  const { target = window, router, reload = () => window.location.reload() } = options
  const { showToast } = useToast()
  const notified = new WeakSet<object>()
  let updateNoticeShown = false

  /** 網站已更新提示：同一次載入只出現一次 */
  const notifyAppUpdated = () => {
    if (updateNoticeShown) return
    updateNoticeShown = true
    showToast(APP_UPDATED_TOAST_MESSAGE, 'warning', APP_UPDATED_TOAST_DURATION, {
      label: '重新整理',
      onClick: reload,
    })
  }

  /** 記錄；符合條件才提示使用者 */
  const handle = (error: unknown, source: string, componentName?: string, info?: string) => {
    reportError(error, { source, componentName, info })

    if (isChunkLoadError(error)) {
      notifyAppUpdated()
      return
    }
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

  // Vite 預載 chunk／CSS 失敗；不 preventDefault，讓原本的 import() 錯誤照常走 router.onError（已去重）
  const onPreloadError = (event: Event) => {
    reportError((event as Event & { payload?: unknown }).payload, { source: 'vite:preloadError' })
    notifyAppUpdated()
  }

  target.addEventListener('unhandledrejection', onUnhandledRejection)
  target.addEventListener('error', onWindowError)
  target.addEventListener('vite:preloadError', onPreloadError)

  // router.onError 一旦註冊，vue-router 就不再自行 console.error，所以非 chunk 錯誤要自己記錄
  const removeRouterErrorHandler = router?.onError((error) => {
    if (isChunkLoadError(error)) {
      handle(error, 'router-error')
      return
    }
    reportError(error, { source: 'router-error' })
  })

  return () => {
    target.removeEventListener('unhandledrejection', onUnhandledRejection)
    target.removeEventListener('error', onWindowError)
    target.removeEventListener('vite:preloadError', onPreloadError)
    removeRouterErrorHandler?.()
  }
}
