import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosHeaders } from 'axios'
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../stores/auth'

/**
 * apiClient 測試
 *
 * 測試策略：
 * 攔截 axios.create 的呼叫參數，捕捉 interceptor callback，
 * 直接調用 interceptor 函式來驗證行為。
 */

// 儲存被註冊的 interceptors
let capturedCreateConfig: Record<string, unknown> = {}
let requestFulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>
let responseFulfilled: (response: AxiosResponse) => unknown
let responseRejected: (error: unknown) => Promise<unknown>
let mockInstanceRequest: ReturnType<typeof vi.fn>

// 在檔案頂層 mock axios（vitest 會 hoist）
vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios')
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn((config: Record<string, unknown>) => {
        capturedCreateConfig = config
        mockInstanceRequest = vi.fn()
        return {
          defaults: { ...config, headers: {} },
          interceptors: {
            request: {
              use: vi.fn((fulfilled: typeof requestFulfilled) => {
                requestFulfilled = fulfilled
              }),
            },
            response: {
              use: vi.fn((fulfilled: typeof responseFulfilled, rejected: typeof responseRejected) => {
                responseFulfilled = fulfilled
                responseRejected = rejected
              }),
            },
          },
          request: mockInstanceRequest,
          get: vi.fn(),
          post: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          patch: vi.fn(),
        }
      }),
    },
  }
})

/** 建立帶有 headers 的 InternalAxiosRequestConfig */
function createConfig(url: string): InternalAxiosRequestConfig {
  return { url, headers: new AxiosHeaders() } as InternalAxiosRequestConfig
}

/** 建立模擬的 401 錯誤物件 */
function create401Error(url: string) {
  return {
    config: createConfig(url),
    response: {
      status: 401,
      data: { code: 401, message: 'Unauthorized', data: null },
    },
    isAxiosError: true,
    message: 'Unauthorized',
  }
}

describe('apiClient', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.stubEnv('VITE_API_BASE_URL', 'http://test-api:8080')

    // 每個 test 前清除模組快取並重新載入，確保 interceptors 被重新註冊
    vi.resetModules()
    await import('./apiClient')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ============================================================
  // 1. axios instance 基本設定
  // ============================================================
  describe('axios instance 設定', () => {
    it('使用 VITE_API_BASE_URL 作為 baseURL', () => {
      expect(capturedCreateConfig.baseURL).toBe('http://test-api:8080')
    })

    it('VITE_API_BASE_URL 未設定時使用預設值 http://localhost:8080', async () => {
      vi.stubEnv('VITE_API_BASE_URL', '')
      vi.resetModules()
      await import('./apiClient')

      expect(capturedCreateConfig.baseURL).toBe('http://localhost:8080')
    })

    it('設定 withCredentials: true 以發送 HttpOnly cookie', () => {
      expect(capturedCreateConfig.withCredentials).toBe(true)
    })
  })

  // ============================================================
  // 2. Request interceptor
  // ============================================================
  describe('Request interceptor', () => {
    it('auth store 有 accessToken 時注入 Authorization header', () => {
      const authStore = useAuthStore()
      authStore.accessToken = 'test-access-token'

      const config = createConfig('/api/v1/articles')
      const result = requestFulfilled(config)

      expect((result as InternalAxiosRequestConfig).headers.Authorization).toBe('Bearer test-access-token')
    })

    it('auth store 沒有 accessToken 時不注入 Authorization header', () => {
      const authStore = useAuthStore()
      authStore.accessToken = null

      const config = createConfig('/api/v1/articles')
      const result = requestFulfilled(config)

      expect((result as InternalAxiosRequestConfig).headers.Authorization).toBeUndefined()
    })
  })

  // ============================================================
  // 3. Response interceptor — 成功路徑
  // ============================================================
  describe('Response interceptor — 成功', () => {
    it('code=200 時解包回傳 response.data.data', () => {
      const mockResponse = {
        data: { code: 200, message: 'OK', data: { id: 1, name: 'test' } },
        status: 200,
      } as AxiosResponse

      const result = responseFulfilled(mockResponse)

      expect(result).toEqual({ id: 1, name: 'test' })
    })

    it('code !== 200 時 reject 並帶後端 message', () => {
      const mockResponse = {
        data: { code: 400, message: '參數錯誤', data: null },
        status: 200,
      } as AxiosResponse

      expect(() => responseFulfilled(mockResponse)).toThrow('參數錯誤')
    })
  })

  // ============================================================
  // 4. Response interceptor — 401 refresh queue
  // ============================================================
  describe('Response interceptor — 401 refresh queue', () => {
    it('非 /auth/refresh 的 401 觸發 token refresh 並重發原請求', async () => {
      const authStore = useAuthStore()
      authStore.refreshToken = vi.fn().mockResolvedValue('new-access-token')

      mockInstanceRequest.mockResolvedValue({
        data: { code: 200, message: 'OK', data: { id: 1 } },
      })

      const error = create401Error('/api/v1/articles')
      await responseRejected(error)

      expect(authStore.refreshToken).toHaveBeenCalledOnce()
      expect(mockInstanceRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/api/v1/articles' }),
      )
    })

    it('多個請求同時 401 時僅觸發一次 refresh，其餘排入佇列', async () => {
      const authStore = useAuthStore()

      let resolveRefresh!: (token: string) => void
      authStore.refreshToken = vi.fn().mockImplementation(
        () => new Promise<string>((resolve) => { resolveRefresh = resolve }),
      )

      mockInstanceRequest.mockResolvedValue({
        data: { code: 200, message: 'OK', data: { id: 'retried' } },
      })

      const p1 = responseRejected(create401Error('/api/v1/articles'))
      const p2 = responseRejected(create401Error('/api/v1/tags'))
      const p3 = responseRejected(create401Error('/api/v1/users'))

      // 只呼叫一次 refreshToken
      expect(authStore.refreshToken).toHaveBeenCalledOnce()

      resolveRefresh('new-token')
      await Promise.all([p1, p2, p3])

      // 三個請求都應該被重發
      expect(mockInstanceRequest).toHaveBeenCalledTimes(3)
    })

    it('refresh 失敗時呼叫 logout 並 reject 所有佇列中的請求', async () => {
      const authStore = useAuthStore()
      authStore.refreshToken = vi.fn().mockRejectedValue(new Error('Refresh failed'))
      authStore.logout = vi.fn()

      const p1 = responseRejected(create401Error('/api/v1/articles'))
      const p2 = responseRejected(create401Error('/api/v1/tags'))

      await expect(p1).rejects.toThrow()
      await expect(p2).rejects.toThrow()

      expect(authStore.logout).toHaveBeenCalledOnce()
    })

    it('/auth/refresh 本身的 401 不觸發再次 refresh（防無限迴圈）', async () => {
      const authStore = useAuthStore()
      authStore.refreshToken = vi.fn()

      await expect(responseRejected(create401Error('/auth/refresh'))).rejects.toThrow()

      expect(authStore.refreshToken).not.toHaveBeenCalled()
    })
  })

  // ============================================================
  // 5. Response interceptor — 其他 HTTP 錯誤
  // ============================================================
  describe('Response interceptor — 其他 HTTP 錯誤', () => {
    it('403 錯誤帶後端 message reject', async () => {
      const error = {
        config: createConfig('/api/v1/admin'),
        response: { status: 403, data: { code: 403, message: '權限不足', data: null } },
        isAxiosError: true,
        message: 'Forbidden',
      }

      await expect(responseRejected(error)).rejects.toThrow('權限不足')
    })

    it('500 錯誤帶後端 message reject', async () => {
      const error = {
        config: createConfig('/api/v1/articles'),
        response: { status: 500, data: { code: 500, message: '伺服器內部錯誤', data: null } },
        isAxiosError: true,
        message: 'Internal Server Error',
      }

      await expect(responseRejected(error)).rejects.toThrow('伺服器內部錯誤')
    })

    it('無 response body 時使用預設錯誤訊息', async () => {
      const error = {
        config: createConfig('/api/v1/articles'),
        response: undefined,
        message: 'Network Error',
        isAxiosError: true,
      }

      await expect(responseRejected(error)).rejects.toThrow('Network Error')
    })
  })
})
