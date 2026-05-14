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
    return apiClient.get('/api/v1/auth/verify-email', { params: { token } })
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
