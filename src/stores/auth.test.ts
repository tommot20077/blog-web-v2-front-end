import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'
import { authService } from '../api/authService'
import { createMockUser } from '../test-utils'
import type { AuthTokens } from '../types/auth'

vi.mock('../api/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
}))

const mockTokens: AuthTokens = { accessToken: 'test-access-token', expiresIn: 3600 }
const mockUser = createMockUser()

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始狀態', () => {
    it('user 為 null、accessToken 為 null、isAuthenticated 為 false', () => {
      const store = useAuthStore()

      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(store.returnUrl).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.isAdmin).toBe(false)
      expect(store.isAuthor).toBe(false)
      expect(store.userRole).toBeNull()
    })
  })

  describe('login', () => {
    it('成功時設定 accessToken 並呼叫 fetchUser', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(mockUser)

      const store = useAuthStore()
      await store.login({ email: 'test@test.com', password: 'password123' })

      expect(store.accessToken).toBe('test-access-token')
      expect(store.user).toEqual(mockUser)
      expect(authService.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' })
      expect(authService.getMe).toHaveBeenCalled()
    })

    it('失敗時拋出錯誤，狀態不變', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'))

      const store = useAuthStore()

      await expect(store.login({ email: 'bad@test.com', password: 'wrong' })).rejects.toThrow('Invalid credentials')
      expect(store.accessToken).toBeNull()
      expect(store.user).toBeNull()
    })

    it('成功後回傳 returnUrl 並清除它', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(mockUser)

      const store = useAuthStore()
      store.setReturnUrl('/dashboard')

      const redirect = await store.login({ email: 'test@test.com', password: 'password123' })

      expect(redirect).toBe('/dashboard')
      expect(store.returnUrl).toBeNull()
    })

    it('無 returnUrl 時回傳 null', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(mockUser)

      const store = useAuthStore()

      const redirect = await store.login({ email: 'test@test.com', password: 'password123' })

      expect(redirect).toBeNull()
    })
  })

  describe('register', () => {
    it('成功時設定 accessToken 並呼叫 fetchUser', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(mockUser)

      const store = useAuthStore()
      await store.register({ email: 'new@test.com', password: 'password123', nickname: 'NewUser' })

      expect(store.accessToken).toBe('test-access-token')
      expect(store.user).toEqual(mockUser)
      expect(authService.register).toHaveBeenCalledWith({ email: 'new@test.com', password: 'password123', nickname: 'NewUser' })
      expect(authService.getMe).toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('清除所有狀態', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(mockUser)
      vi.mocked(authService.logout).mockResolvedValue(undefined)

      const store = useAuthStore()
      // 先登入
      await store.login({ email: 'test@test.com', password: 'password123' })
      store.setReturnUrl('/some-page')

      // 登出
      await store.logout()

      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(store.returnUrl).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('即使 API 失敗也清除本地狀態', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(mockUser)
      vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'))

      const store = useAuthStore()
      await store.login({ email: 'test@test.com', password: 'password123' })

      // 不應拋出錯誤
      await store.logout()

      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
    })
  })

  describe('refreshToken', () => {
    it('成功時更新 accessToken 並呼叫 fetchUser', async () => {
      const newTokens: AuthTokens = { accessToken: 'new-access-token', expiresIn: 3600 }
      vi.mocked(authService.refresh).mockResolvedValue(newTokens)
      vi.mocked(authService.getMe).mockResolvedValue(mockUser)

      const store = useAuthStore()
      await store.refreshToken()

      expect(store.accessToken).toBe('new-access-token')
      expect(store.user).toEqual(mockUser)
      expect(authService.refresh).toHaveBeenCalled()
      expect(authService.getMe).toHaveBeenCalled()
    })

    it('失敗時向上拋出錯誤', async () => {
      vi.mocked(authService.refresh).mockRejectedValue(new Error('Refresh failed'))

      const store = useAuthStore()

      await expect(store.refreshToken()).rejects.toThrow('Refresh failed')
    })
  })

  describe('isAdmin getter', () => {
    it('user.role 為 ADMIN 時回傳 true', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(createMockUser({ role: 'ADMIN' }))

      const store = useAuthStore()
      await store.login({ email: 'admin@test.com', password: 'password123' })

      expect(store.isAdmin).toBe(true)
    })

    it('user.role 非 ADMIN 時回傳 false', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(createMockUser({ role: 'USER' }))

      const store = useAuthStore()
      await store.login({ email: 'user@test.com', password: 'password123' })

      expect(store.isAdmin).toBe(false)
    })
  })

  describe('isAuthor getter', () => {
    it('user.role 為 AUTHOR 時回傳 true', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(createMockUser({ role: 'AUTHOR' }))

      const store = useAuthStore()
      await store.login({ email: 'author@test.com', password: 'password123' })

      expect(store.isAuthor).toBe(true)
    })

    it('user.role 為 ADMIN 時也回傳 true', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(createMockUser({ role: 'ADMIN' }))

      const store = useAuthStore()
      await store.login({ email: 'admin@test.com', password: 'password123' })

      expect(store.isAuthor).toBe(true)
    })

    it('user.role 為 USER 時回傳 false', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockTokens)
      vi.mocked(authService.getMe).mockResolvedValue(createMockUser({ role: 'USER' }))

      const store = useAuthStore()
      await store.login({ email: 'user@test.com', password: 'password123' })

      expect(store.isAuthor).toBe(false)
    })
  })

  describe('setReturnUrl', () => {
    it('設定 returnUrl 可被讀取', () => {
      const store = useAuthStore()

      store.setReturnUrl('/protected-page')

      expect(store.returnUrl).toBe('/protected-page')
    })

    it('設定 null 清除 returnUrl', () => {
      const store = useAuthStore()
      store.setReturnUrl('/some-page')

      store.setReturnUrl(null)

      expect(store.returnUrl).toBeNull()
    })
  })
})
