/**
 * API Client — 基於 axios 的 HTTP 客戶端
 *
 * 功能：
 * - 以 VITE_API_BASE_URL 為 baseURL，預設 http://localhost:9010
 * - withCredentials: true（發送 HttpOnly refresh token cookie）
 * - Request interceptor：自動注入 Authorization Bearer token
 * - Response interceptor：解包 ApiResponse<T>，401 refresh queue
 */
import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '../types/auth'
import { useAuthStore } from '../stores/auth'
import { markErrorHandled } from '../utils/errorReporting'
import { useToast } from '../composables/useToast'
import {
  TOO_MANY_REQUESTS_STATUS,
  getFriendlyErrorMessage,
  getRateLimitMessage,
  isRateLimited,
  parseRetryAfterSeconds,
} from '../utils/apiErrors'

/** 待重發請求佇列項目 */
interface QueueItem {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  config: InternalAxiosRequestConfig
}

/** 429 全域 toast 的去重 key */
const RATE_LIMIT_TOAST_KEY = 'rate-limit'

let isRefreshing = false
let failedQueue: QueueItem[] = []

/**
 * 處理佇列中等待的請求
 * @param error - 若不為 null 則 reject 所有等待請求
 */
function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error)
    } else {
      resolve(apiClient.request(config))
    }
  })
  failedQueue = []
}

/**
 * 判斷後端業務碼是否代表成功
 * 後端永遠回傳字串碼，成功碼為 "00000"
 */
export function isSuccessCode(code: string): boolean {
  return code === '00000'
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:9010',
  withCredentials: true,
})

// Request interceptor：注入 access token
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  return config
})

// Response interceptor：解包 ApiResponse + 401 refresh queue
apiClient.interceptors.response.use(
  // 成功回應（2xx）
  (response) => {
    // 二進位內容（如 GET /api/v1/files/{id}/content 以 blob 取回）不是 ApiResponse envelope，
    // 直接回傳原始資料，不嘗試解包。
    if (response.config?.responseType === 'blob') {
      return response.data
    }
    const body = response.data as ApiResponse<unknown>
    if (isSuccessCode(body.code)) {
      return body.data as never
    }
    // 業務錯誤（HTTP 2xx 但 code !== '00000'）
    throw markErrorHandled(new Error(body.message))
  },
  // 錯誤回應
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalConfig = error.config as InternalAxiosRequestConfig

    // 非 401 或無 response：直接 reject
    if (!error.response || error.response.status !== 401) {
      const code = error.response?.data?.code
      // 429（通用限流）：訊息帶 Retry-After 秒數；不自動重試，也不走 401 的 refresh 流程
      const isRateLimited = error.response?.status === TOO_MANY_REQUESTS_STATUS
      const retryAfterSeconds = isRateLimited ? parseRetryAfterSeconds(error.response?.headers) : undefined
      // 上傳相關錯誤碼（A0402／A0406／A0407）改用友善訊息；其他沿用後端 message
      const message = isRateLimited
        ? getRateLimitMessage(retryAfterSeconds)
        : getFriendlyErrorMessage(code) ?? error.response?.data?.message ?? error.message
      // 附上 HTTP status 與業務碼，讓呼叫端能區分「不存在（404／A0101）」與其他失敗（不影響 401 refresh 流程）
      if (isRateLimited) {
        // 統一在這裡提示等待時間（呼叫端遇到 429 不再顯示自己的錯誤 toast）；
        // 固定 key：畫面上同時最多一則，秒數不同時以最新的取代，不疊加
        const { showToast } = useToast()
        showToast(message, 'warning', 4000, undefined, RATE_LIMIT_TOAST_KEY)
      }
      const failure = Object.assign(new Error(message), {
        status: error.response?.status,
        code,
        ...(retryAfterSeconds !== undefined && { retryAfterSeconds }),
      })
      return Promise.reject(markErrorHandled(failure))
    }

    // /auth/refresh 本身的 401：不再觸發 refresh（防無限迴圈）
    if (originalConfig.url?.includes('/auth/refresh')) {
      return Promise.reject(markErrorHandled(new Error(error.response.data?.message ?? error.message)))
    }

    // 已有 refresh 進行中：排入等待佇列
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalConfig })
      })
    }

    // 首個 401：啟動 refresh 流程
    isRefreshing = true
    const authStore = useAuthStore()

    try {
      await authStore.refreshToken()

      // 更新原始請求的 Authorization header
      originalConfig.headers.Authorization = `Bearer ${authStore.accessToken}`

      // 處理等待佇列中的請求
      processQueue(null)

      // 重發原始請求
      return apiClient.request(originalConfig)
    } catch (refreshError) {
      markErrorHandled(refreshError)
      // refresh 本身被限流（429）是暫時性錯誤，不代表登入失效：不登出，把該錯誤往上拋即可
      if (!isRateLimited(refreshError)) authStore.logout()
      processQueue(refreshError)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
