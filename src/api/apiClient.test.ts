import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosHeaders } from 'axios'
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { isErrorHandled } from '../utils/errorReporting'

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

// mock authService 以打斷 auth.ts → authService → apiClient circular dependency
vi.mock('./authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}))

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
      data: { code: 'A0200', message: 'Unauthorized', data: null },
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

    it('VITE_API_BASE_URL 未設定時使用預設值 http://localhost:9010', async () => {
      vi.stubEnv('VITE_API_BASE_URL', '')
      vi.resetModules()
      await import('./apiClient')

      expect(capturedCreateConfig.baseURL).toBe('http://localhost:9010')
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
    it('code="00000" 時解包回傳 response.data.data', () => {
      const mockResponse = {
        data: { code: '00000', message: 'OK', data: { id: 1, name: 'test' } },
        status: 200,
      } as AxiosResponse

      const result = responseFulfilled(mockResponse)

      expect(result).toEqual({ id: 1, name: 'test' })
    })

    it('code !== "00000" 時 reject 並帶後端 message', () => {
      const mockResponse = {
        data: { code: 'A0001', message: '參數錯誤', data: null },
        status: 200,
      } as AxiosResponse

      expect(() => responseFulfilled(mockResponse)).toThrow('參數錯誤')
    })

    it('code 為字串 "00000" 時解包回傳 response.data.data', () => {
      const mockResponse = {
        data: { code: '00000', message: '操作成功', data: { id: 2, name: 'backend-test' } },
        status: 200,
      } as AxiosResponse

      const result = responseFulfilled(mockResponse)

      expect(result).toEqual({ id: 2, name: 'backend-test' })
    })

    it('code 為字串錯誤碼 "A0001" 時 reject 並帶後端 message', () => {
      const mockResponse = {
        data: { code: 'A0001', message: '用戶不存在', data: null },
        status: 200,
      } as AxiosResponse

      expect(() => responseFulfilled(mockResponse)).toThrow('用戶不存在')
    })

    it('responseType 為 blob 時直接回傳 response.data，不嘗試解包 ApiResponse envelope（供帶認證圖片抓取使用）', () => {
      const blob = new Blob(['fake-image-bytes'], { type: 'image/png' })
      const mockResponse = {
        data: blob,
        status: 200,
        config: { responseType: 'blob' },
      } as unknown as AxiosResponse

      const result = responseFulfilled(mockResponse)

      expect(result).toBe(blob)
    })
  })

  // ============================================================
  // 4. Response interceptor — 401 refresh queue
  // ============================================================
  describe('Response interceptor — 401 refresh queue', () => {
    it('非 /auth/refresh 的 401 觸發 token refresh 並重發原請求', async () => {
      const authStore = useAuthStore()
      authStore.refreshToken = vi.fn().mockImplementation(async () => {
        authStore.accessToken = 'new-access-token'
      })

      mockInstanceRequest.mockResolvedValue({
        data: { code: '00000', message: 'OK', data: { id: 1 } },
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

      let resolveRefresh!: () => void
      authStore.refreshToken = vi.fn().mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveRefresh = () => {
            authStore.accessToken = 'new-token'
            resolve()
          }
        }),
      )

      mockInstanceRequest.mockResolvedValue({
        data: { code: '00000', message: 'OK', data: { id: 'retried' } },
      })

      const p1 = responseRejected(create401Error('/api/v1/articles'))
      const p2 = responseRejected(create401Error('/api/v1/tags'))
      const p3 = responseRejected(create401Error('/api/v1/users'))

      // 只呼叫一次 refreshToken
      expect(authStore.refreshToken).toHaveBeenCalledOnce()

      resolveRefresh()
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
        response: { status: 403, data: { code: 'A0300', message: '權限不足', data: null } },
        isAxiosError: true,
        message: 'Forbidden',
      }

      await expect(responseRejected(error)).rejects.toThrow('權限不足')
    })

    it('500 錯誤帶後端 message reject', async () => {
      const error = {
        config: createConfig('/api/v1/articles'),
        response: { status: 500, data: { code: 'B0001', message: '伺服器內部錯誤', data: null } },
        isAxiosError: true,
        message: 'Internal Server Error',
      }

      await expect(responseRejected(error)).rejects.toThrow('伺服器內部錯誤')
    })

    it.each([
      [413, 'A0402', '檔案太大（文章圖片上限 20MB，頭像上限 5MB）'],
      [400, 'A0406', '圖片尺寸過大（總像素需小於 1 億）'],
      [400, 'A0407', '頭像檔案無效，請重新上傳'],
    ])('A6：HTTP %i／%s 以友善訊息取代後端 message，並保留 status 與 code', async (status, code, friendly) => {
      const error = {
        config: createConfig('/api/v1/files/upload'),
        response: { status, data: { code, message: '後端原始訊息', data: null } },
        isAxiosError: true,
        message: 'Request failed',
      }

      await expect(responseRejected(error)).rejects.toMatchObject({ message: friendly, status, code })
    })

    describe('A4：HTTP 429 通用限流', () => {
      function create429Error(headers?: Record<string, string>) {
        return {
          config: createConfig('/api/v1/articles/a/comments'),
          response: {
            status: 429,
            headers,
            data: { code: 'A0009', message: '請求過於頻繁，請稍後再試', data: null },
          },
          isAxiosError: true,
          message: 'Request failed with status code 429',
        }
      }

      it('有 Retry-After → 顯示「操作太頻繁，請 N 秒後再試」，並保留 status、code 與秒數', async () => {
        await expect(responseRejected(create429Error({ 'retry-after': '30' }))).rejects.toMatchObject({
          message: '操作太頻繁，請 30 秒後再試',
          status: 429,
          code: 'A0009',
          retryAfterSeconds: 30,
        })
      })

      it('AxiosHeaders 形狀（以 get 讀取）也能取得 Retry-After', async () => {
        const headers = new AxiosHeaders({ 'Retry-After': '12' })
        await expect(responseRejected(create429Error(headers as never))).rejects.toMatchObject({
          message: '操作太頻繁，請 12 秒後再試',
        })
      })

      it.each([[undefined], [{}], [{ 'retry-after': '' }], [{ 'retry-after': 'abc' }], [{ 'retry-after': '0' }], [{ 'retry-after': '-5' }]])(
        '沒有可用的 Retry-After（%j）→ 顯示通用訊息「請稍後再試」',
        async (headers) => {
          await expect(responseRejected(create429Error(headers))).rejects.toMatchObject({
            message: '操作太頻繁，請稍後再試',
            status: 429,
          })
        },
      )

      it('不觸發 401 的 refresh 流程、不自動重試，且標記為已處理', async () => {
        const authStore = useAuthStore()
        authStore.refreshToken = vi.fn()

        const error = await responseRejected(create429Error({ 'retry-after': '5' })).catch((e: unknown) => e)

        expect(authStore.refreshToken).not.toHaveBeenCalled()
        expect(mockInstanceRequest).not.toHaveBeenCalled()
        expect(isErrorHandled(error)).toBe(true)
      })

      it('429 沒有 response body 也能顯示友善訊息', async () => {
        const error = {
          config: createConfig('/api/v1/search'),
          response: { status: 429, headers: { 'retry-after': '7' }, data: undefined },
          isAxiosError: true,
          message: 'Request failed with status code 429',
        }
        await expect(responseRejected(error)).rejects.toMatchObject({ message: '操作太頻繁，請 7 秒後再試', status: 429 })
      })

      it('顯示 warning toast：有秒數時帶秒數，連續同一則 429 不重複堆疊', async () => {
        // resetModules 後 apiClient 載入的是新的 useToast 實例，這裡必須動態取同一個
        const { useToast } = await import('../composables/useToast')
        const { toasts } = useToast()
        toasts.value = []

        await responseRejected(create429Error({ 'retry-after': '30' })).catch(() => undefined)
        await responseRejected(create429Error({ 'retry-after': '30' })).catch(() => undefined)

        expect(toasts.value).toHaveLength(1)
        expect(toasts.value[0]).toMatchObject({ message: '操作太頻繁，請 30 秒後再試', type: 'warning' })
      })

      it('沒有 Retry-After 時 toast 顯示通用訊息', async () => {
        // resetModules 後 apiClient 載入的是新的 useToast 實例，這裡必須動態取同一個
        const { useToast } = await import('../composables/useToast')
        const { toasts } = useToast()
        toasts.value = []

        await responseRejected(create429Error()).catch(() => undefined)

        expect(toasts.value.map(t => t.message)).toEqual(['操作太頻繁，請稍後再試'])
      })

      it('A0113（auth 限流，HTTP 400）維持沿用後端訊息，不走 429 邏輯', async () => {
        const error = {
          config: createConfig('/api/v1/auth/login'),
          response: { status: 400, headers: { 'retry-after': '30' }, data: { code: 'A0113', message: '請求過於頻繁，請稍後再試', data: null } },
          isAxiosError: true,
          message: 'Request failed with status code 400',
        }
        await expect(responseRejected(error)).rejects.toMatchObject({
          message: '請求過於頻繁，請稍後再試',
          status: 400,
          code: 'A0113',
        })
      })
    })

    it('404 錯誤帶上 HTTP status 與後端業務碼，供呼叫端判斷「不存在」（公開作者頁 A0101）', async () => {
      const error = {
        config: createConfig('/api/v1/users/x/profile'),
        response: { status: 404, data: { code: 'A0101', message: '用戶不存在', data: null } },
        isAxiosError: true,
        message: 'Not Found',
      }

      await expect(responseRejected(error)).rejects.toMatchObject({ status: 404, code: 'A0101', message: '用戶不存在' })
    })

    it('無 response（網路錯誤）時 status／code 為 undefined', async () => {
      const error = {
        config: createConfig('/api/v1/articles'),
        response: undefined,
        message: 'Network Error',
        isAxiosError: true,
      }

      const rejected = await responseRejected(error).catch((e: unknown) => e) as { status?: number; code?: string }
      expect(rejected.status).toBeUndefined()
      expect(rejected.code).toBeUndefined()
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
  // ============================================================
  // 6. FE-01：interceptor 產生的錯誤標記為「已處理」，供全域 handler 去重
  // ============================================================
  describe('Response interceptor — 錯誤標記（FE-01 全域錯誤去重）', () => {
    it('業務錯誤（code !== 00000）拋出的 Error 標記為已處理', () => {
      const mockResponse = {
        data: { code: 'A0001', message: '參數錯誤', data: null },
        status: 200,
      } as AxiosResponse

      let thrown: unknown
      try { responseFulfilled(mockResponse) } catch (e) { thrown = e }

      expect(isErrorHandled(thrown)).toBe(true)
    })

    it('HTTP 500 錯誤 reject 的 Error 標記為已處理', async () => {
      const error = {
        config: createConfig('/api/v1/articles'),
        response: { status: 500, data: { code: 'B0001', message: '伺服器內部錯誤', data: null } },
        isAxiosError: true,
        message: 'Internal Server Error',
      }

      const rejected = await responseRejected(error).catch((e: unknown) => e)

      expect(isErrorHandled(rejected)).toBe(true)
    })

    it('/auth/refresh 本身 401 reject 的 Error 標記為已處理', async () => {
      const rejected = await responseRejected(create401Error('/auth/refresh')).catch((e: unknown) => e)

      expect(isErrorHandled(rejected)).toBe(true)
    })

    it('refresh 失敗 reject 的錯誤標記為已處理', async () => {
      const authStore = useAuthStore()
      authStore.refreshToken = vi.fn().mockRejectedValue(new Error('Refresh failed'))
      authStore.logout = vi.fn()

      const rejected = await responseRejected(create401Error('/api/v1/articles')).catch((e: unknown) => e)

      expect(isErrorHandled(rejected)).toBe(true)
    })
  })
})
