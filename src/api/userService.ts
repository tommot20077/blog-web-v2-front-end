import type { UpdateProfileRequest, ChangePasswordRequest, DeleteAccountRequest } from '../types/user'

export const userService = {
  async updateProfile(data: UpdateProfileRequest): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { userService: svc } = await import('./mock/userService')
      return svc.updateProfile(data)
    }
    const { userService: svc } = await import('./real/userService')
    return svc.updateProfile(data)
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { userService: svc } = await import('./mock/userService')
      return svc.changePassword(data)
    }
    const { userService: svc } = await import('./real/userService')
    return svc.changePassword(data)
  },

  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { userService: svc } = await import('./mock/userService')
      return svc.deleteAccount(data)
    }
    const { userService: svc } = await import('./real/userService')
    return svc.deleteAccount(data)
  },
}
