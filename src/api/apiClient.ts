/**
 * API Client — 基於 axios 的 HTTP 客戶端
 *
 * 功能：
 * - 以 VITE_API_BASE_URL 為 baseURL，預設 http://localhost:8080
 * - withCredentials: true（發送 HttpOnly refresh token cookie）
 * - Request interceptor：自動注入 Authorization Bearer token
 * - Response interceptor：解包 ApiResponse<T>，401 refresh queue
 */
import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '../types/auth'
import { useAuthStore } from '../stores/auth'

/** 待重發請求佇列項目 */
interface QueueItem {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  config: InternalAxiosRequestConfig
}

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
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
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
    const body = response.data as ApiResponse<unknown>
    if (isSuccessCode(body.code)) {
      return body.data as never
    }
    // 業務錯誤（HTTP 2xx 但 code !== '00000'）
    throw new Error(body.message)
  },
  // 錯誤回應
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalConfig = error.config as InternalAxiosRequestConfig

    // 非 401 或無 response：直接 reject
    if (!error.response || error.response.status !== 401) {
      const message = error.response?.data?.message ?? error.message
      return Promise.reject(new Error(message))
    }

    // /auth/refresh 本身的 401：不再觸發 refresh（防無限迴圈）
    if (originalConfig.url?.includes('/auth/refresh')) {
      return Promise.reject(new Error(error.response.data?.message ?? error.message))
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
      authStore.logout()
      processQueue(refreshError)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
