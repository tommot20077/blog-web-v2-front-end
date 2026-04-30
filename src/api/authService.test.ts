import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { LoginPayload, RegisterPayload, AuthTokens, User } from '../types/auth'

// mock apiClient — 在 VITE_USE_MOCK=false 時驗證正確的 HTTP 呼叫
const mockPost = vi.fn()
const mockGet = vi.fn()

vi.mock('./apiClient', () => ({
  default: {
    post: mockPost,
    get: mockGet,
  },
}))

describe('authService', () => {
  // ============================================================
  // Mock 路由測試 — 驗證 VITE_USE_MOCK=true 時 delegate 到 mock module
  // ============================================================
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'true')
      // 抑制 mock service 內部的 console.log（Pristine Output）
      vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllEnvs()
    })

    it('login 委派給 loginMock 並回傳 AuthTokens', async () => {
      const { authService } = await import('./authService')
      const payload: LoginPayload = { identifier: 'admin@test.com', password: 'Password1' }

      const result = await authService.login(payload)

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('expiresIn')
      expect(typeof result.accessToken).toBe('string')
      expect(typeof result.expiresIn).toBe('number')
    })

    it('register 委派給 registerMock 並 resolve void', async () => {
      const { authService } = await import('./authService')
      const payload: RegisterPayload = {
        email: `new-${Date.now()}@test.com`,
        password: 'Password1',
        username: 'new_user',
        nickname: 'NewUser',
      }

      await expect(authService.register(payload)).resolves.toBeUndefined()
    })

    it('refresh 委派給 refreshTokenMock 並回傳 AuthTokens', async () => {
      const { authService } = await import('./authService')
      // 先登入讓 refreshTokenValid = true
      await authService.login({ identifier: 'admin@test.com', password: 'Password1' })

      const result = await authService.refresh()

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('expiresIn')
    })

    it('logout 委派給 logoutMock 並 resolve void', async () => {
      const { authService } = await import('./authService')

      await expect(authService.logout()).resolves.toBeUndefined()
    })

    it('forgotPassword 委派給 forgotPasswordMock 並 resolve void', async () => {
      const { authService } = await import('./authService')

      await expect(authService.forgotPassword('admin@test.com')).resolves.toBeUndefined()
    })

    it('resetPassword 委派給 resetPasswordMock 並 resolve void', async () => {
      const { authService } = await import('./authService')

      await expect(
        authService.resetPassword('mock-reset-token', 'NewPassword1'),
      ).resolves.toBeUndefined()
    })

    it('verifyEmail 委派給 verifyEmailMock 並 resolve void', async () => {
      const { authService } = await import('./authService')

      await expect(authService.verifyEmail('mock-verify-token')).resolves.toBeUndefined()
    })

    it('getMe 委派給 getMeMock 並回傳 User 物件', async () => {
      const { authService } = await import('./authService')
      // 先登入
      await authService.login({ identifier: 'admin@test.com', password: 'Password1' })

      const result = await authService.getMe()

      expect(result).toHaveProperty('uuid')
      expect(result).toHaveProperty('email', 'admin@test.com')
      expect(result).toHaveProperty('nickname')
      expect(result).toHaveProperty('role')
    })

    it('resendVerification 委派給 resendVerificationMock 並 resolve void', async () => {
      const { authService } = await import('./authService')

      await expect(authService.resendVerification('user@test.com')).resolves.toBeUndefined()
    })
  })

  // ============================================================
  // API 模式測試 — 驗證 VITE_USE_MOCK=false 時使用 apiClient
  // ============================================================
  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'false')
      mockPost.mockReset()
      mockGet.mockReset()
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('login 使用 apiClient.post 呼叫正確的 URL 和 payload', async () => {
      const mockTokens: AuthTokens = { accessToken: 'token-123', expiresIn: 3600 }
      mockPost.mockResolvedValue(mockTokens)

      const { authService } = await import('./authService')
      const payload: LoginPayload = { identifier: 'test@test.com', password: 'Password1' }
      const result = await authService.login(payload)

      expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/login', payload)
      expect(result).toEqual(mockTokens)
    })

    it('register 使用 apiClient.post 呼叫正確的 URL 和 payload（含 username）', async () => {
      mockPost.mockResolvedValue(undefined)

      const { authService } = await import('./authService')
      const payload: RegisterPayload = {
        email: 'new@test.com',
        password: 'Password1',
        username: 'new_user',
        nickname: 'New',
      }
      await authService.register(payload)

      expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/register', payload)
    })

    it('refresh 使用 apiClient.post 呼叫正確的 URL（無 body）', async () => {
      const mockTokens: AuthTokens = { accessToken: 'token-789', expiresIn: 3600 }
      mockPost.mockResolvedValue(mockTokens)

      const { authService } = await import('./authService')
      const result = await authService.refresh()

      expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/refresh')
      expect(result).toEqual(mockTokens)
    })

    it('logout 使用 apiClient.post 呼叫正確的 URL', async () => {
      mockPost.mockResolvedValue(undefined)

      const { authService } = await import('./authService')
      await authService.logout()

      expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/logout')
    })

    it('forgotPassword 使用 apiClient.post 呼叫正確的 URL 和 body', async () => {
      mockPost.mockResolvedValue(undefined)

      const { authService } = await import('./authService')
      await authService.forgotPassword('test@test.com')

      expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
        email: 'test@test.com',
      })
    })

    it('resetPassword 使用 apiClient.post 呼叫正確的 URL 和 body', async () => {
      mockPost.mockResolvedValue(undefined)

      const { authService } = await import('./authService')
      await authService.resetPassword('reset-token-abc', 'NewPassword1')

      expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/reset-password', {
        token: 'reset-token-abc',
        newPassword: 'NewPassword1',
      })
    })

    it('verifyEmail 使用 apiClient.get 並將 token 作為 query param', async () => {
      mockGet.mockResolvedValue(undefined)

      const { authService } = await import('./authService')
      await authService.verifyEmail('verify-token-xyz')

      expect(mockGet).toHaveBeenCalledWith('/api/v1/auth/verify-email', {
        params: { token: 'verify-token-xyz' },
      })
    })

    it('getMe 使用 apiClient.get 呼叫正確的 URL', async () => {
      const mockUser: User = {
        uuid: 'u-1',
        email: 'test@test.com',
        nickname: 'Test',
        avatarUrl: null,
        role: 'USER',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00Z',
      }
      mockGet.mockResolvedValue(mockUser)

      const { authService } = await import('./authService')
      const result = await authService.getMe()

      expect(mockGet).toHaveBeenCalledWith('/api/v1/users/me')
      expect(result).toEqual(mockUser)
    })

    it('resendVerification 使用 apiClient.post 呼叫正確的 URL 和 body', async () => {
      mockPost.mockResolvedValue(undefined)

      const { authService } = await import('./authService')
      await authService.resendVerification('user@test.com')

      expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/resend-verification', {
        email: 'user@test.com',
      })
    })
  })
})
