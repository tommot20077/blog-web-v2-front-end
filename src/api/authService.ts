import type { LoginPayload, RegisterPayload, AuthTokens, User } from '../types/auth'
import apiClient from './apiClient'

export const authService = {
  async login(payload: LoginPayload): Promise<AuthTokens> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { loginMock } = await import('./mock/authMockService')
      return loginMock(payload)
    }
    return apiClient.post('/api/v1/auth/login', payload)
  },

  async register(payload: RegisterPayload): Promise<AuthTokens> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { registerMock } = await import('./mock/authMockService')
      return registerMock(payload)
    }
    return apiClient.post('/api/v1/auth/register', payload)
  },

  async refresh(): Promise<AuthTokens> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { refreshTokenMock } = await import('./mock/authMockService')
      return refreshTokenMock()
    }
    return apiClient.post('/api/v1/auth/refresh')
  },

  async logout(): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { logoutMock } = await import('./mock/authMockService')
      return logoutMock()
    }
    return apiClient.post('/api/v1/auth/logout')
  },

  async forgotPassword(email: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { forgotPasswordMock } = await import('./mock/authMockService')
      return forgotPasswordMock(email)
    }
    return apiClient.post('/api/v1/auth/forgot-password', { email })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { resetPasswordMock } = await import('./mock/authMockService')
      return resetPasswordMock(token, newPassword)
    }
    return apiClient.post('/api/v1/auth/reset-password', { token, newPassword })
  },

  async verifyEmail(token: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { verifyEmailMock } = await import('./mock/authMockService')
      return verifyEmailMock(token)
    }
    return apiClient.post('/api/v1/auth/verify-email', { token })
  },

  async getMe(): Promise<User> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getMeMock } = await import('./mock/authMockService')
      return getMeMock()
    }
    return apiClient.get('/api/v1/users/me')
  },

  async resendVerification(email: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { resendVerificationMock } = await import('./mock/authMockService')
      return resendVerificationMock()
    }
    return apiClient.post('/api/v1/auth/resend-verification', { email })
  },
}
