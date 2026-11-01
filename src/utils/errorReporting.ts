/**
 * 錯誤回報與分類工具（FE-01 全域錯誤處理）
 *
 * - reportError：集中記錄錯誤的出口。
 *   目前後端沒有錯誤回報端點（不發明契約），因此只做 console.error；
 *   需要時再於此函式內接後端，呼叫端不必改動。
 * - markErrorHandled / isErrorHandled：apiClient interceptor 已處理過的錯誤標記，
 *   讓全域 handler 只記錄、不重複提示使用者。
 * - isIgnorableError：AbortError／取消請求不需要提示。
 */
import type { ComponentPublicInstance } from 'vue'

/** 錯誤上下文：用於 log 定位 */
export interface ErrorContext {
  componentName?: string
  info?: string
  source?: string
}

/** 標記「已被 apiClient interceptor 處理」；用 Symbol.for 讓跨模組實例（含測試的 resetModules）仍一致 */
const HANDLED = Symbol.for('blog-web.error.handled')

/**
 * 記錄錯誤。目前只輸出到 console（尚無後端回報端點，需要時再接後端）。
 */
export function reportError(error: unknown, context: ErrorContext = {}): void {
  const parts = [
    context.source ? `[${context.source}]` : '',
    context.componentName ? `component=${context.componentName}` : '',
    context.info ? `info=${context.info}` : '',
  ].filter(Boolean)
  console.error('[reportError]', ...parts, error)
}

/** 標記錯誤已由 apiClient interceptor 處理過，回傳同一個值以便串接 */
export function markErrorHandled<T>(error: T): T {
  if (typeof error === 'object' && error !== null) {
    ;(error as Record<symbol, unknown>)[HANDLED] = true
  }
  return error
}

/** 錯誤是否已被 interceptor 標記為處理過 */
export function isErrorHandled(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as Record<symbol, unknown>)[HANDLED] === true
}

/** AbortError／axios 取消請求：使用者主動或導航造成，不需提示 */
export function isIgnorableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const { name, code } = error as { name?: unknown; code?: unknown }
  return name === 'AbortError' || name === 'CanceledError' || code === 'ERR_CANCELED'
}

/** 取得元件名稱（$options.name → SFC __name → Anonymous） */
export function getComponentName(instance: ComponentPublicInstance | null | undefined): string {
  const options = instance?.$options as { name?: string; __name?: string } | undefined
  return options?.name ?? options?.__name ?? 'Anonymous'
}

/**
 * Vue errorCaptured 的 info 是否代表 render／setup 階段的錯誤。
 *
 * 只有這兩類才代表「該區塊畫不出來」，ErrorBoundary 才應以 fallback 取代；
 * async lifecycle hook／event handler 的 rejection（如 onMounted(async) 內 API 失敗）
 * 頁面其實已渲染完成，不能整頁替換。
 *
 * 依據 @vue/runtime-core 的 handleError：
 * - 開發模式 info = ErrorTypeStrings[type]（'setup function' / 'render function' …）
 * - production info = `https://vuejs.org/error-reference/#runtime-${type}`，
 *   ErrorCodes.SETUP_FUNCTION = 0、RENDER_FUNCTION = 1
 */
export function isRenderPhaseError(info: string | undefined | null): boolean {
  if (!info) return false
  if (info === 'render function' || info === 'setup function') return true
  return /#runtime-[01]$/.test(info)
}
