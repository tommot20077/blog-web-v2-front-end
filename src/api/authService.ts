import type { LoginPayload, RegisterPayload, AuthTokens, User } from '../types/auth'

export const authService = {
  async login(payload: LoginPayload): Promise<AuthTokens> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authService: svc } = await import('./mock/authService')
      return svc.login(payload)
    }
    const { authService: svc } = await import('./real/authService')
    return svc.login(payload)
  },

  async register(payload: RegisterPayload): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authService: svc } = await import('./mock/authService')
      return svc.register(payload)
    }
    const { authService: svc } = await import('./real/authService')
    return svc.register(payload)
  },

  async refresh(): Promise<AuthTokens> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authService: svc } = await import('./mock/authService')
      return svc.refresh()
    }
    const { authService: svc } = await import('./real/authService')
    return svc.refresh()
  },

  async logout(): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authService: svc } = await import('./mock/authService')
      return svc.logout()
    }
    const { authService: svc } = await import('./real/authService')
    return svc.logout()
  },

  async forgotPassword(email: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authService: svc } = await import('./mock/authService')
      return svc.forgotPassword(email)
    }
    const { authService: svc } = await import('./real/authService')
    return svc.forgotPassword(email)
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authService: svc } = await import('./mock/authService')
      return svc.resetPassword(token, newPassword)
    }
    const { authService: svc } = await import('./real/authService')
    return svc.resetPassword(token, newPassword)
  },

  async verifyEmail(token: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authService: svc } = await import('./mock/authService')
      return svc.verifyEmail(token)
    }
    const { authService: svc } = await import('./real/authService')
    return svc.verifyEmail(token)
  },

  async getMe(): Promise<User> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authService: svc } = await import('./mock/authService')
      return svc.getMe()
    }
    const { authService: svc } = await import('./real/authService')
    return svc.getMe()
  },

  async resendVerification(email: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authService: svc } = await import('./mock/authService')
      return svc.resendVerification(email)
    }
    const { authService: svc } = await import('./real/authService')
    return svc.resendVerification(email)
  },
}
