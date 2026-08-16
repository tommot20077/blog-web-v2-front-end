import type { LoginPayload, RegisterPayload, AuthTokens, User } from '../../types/auth'
import apiClient from '../apiClient'

export const authService = {
  async login(payload: LoginPayload): Promise<AuthTokens> {
    return apiClient.post('/api/v1/auth/login', payload)
  },

  async register(payload: RegisterPayload): Promise<void> {
    return apiClient.post('/api/v1/auth/register', payload)
  },

  async refresh(): Promise<AuthTokens> {
    return apiClient.post('/api/v1/auth/refresh')
  },

  async logout(): Promise<void> {
    return apiClient.post('/api/v1/auth/logout')
  },

  async forgotPassword(email: string): Promise<void> {
    return apiClient.post('/api/v1/auth/forgot-password', { email })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return apiClient.post('/api/v1/auth/reset-password', { token, newPassword })
  },

  async verifyEmail(token: string): Promise<void> {
    // 後端為 POST + @RequestBody VerifyEmailRequest（AuthController:221）。
    // 原本用 GET + query param，導致點擊驗證信連結時後端回
    // "Request method 'GET' is not supported"；且 security.md 原則 8 禁止以
    // query param 傳遞 token（會外洩進伺服器日誌／瀏覽器歷史／Referer）。
    return apiClient.post('/api/v1/auth/verify-email', { token })
  },

  async verifyEmailCode(email: string, code: string): Promise<void> {
    return apiClient.post('/api/v1/auth/verify-email-code', { email, code })
  },

  async getMe(): Promise<User> {
    return apiClient.get('/api/v1/users/me')
  },

  async resendVerification(email: string): Promise<void> {
    return apiClient.post('/api/v1/auth/resend-verification', { email })
  },
}
