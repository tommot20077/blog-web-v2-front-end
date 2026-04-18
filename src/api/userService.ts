import apiClient from './apiClient'
import type { UpdateProfileRequest, ChangePasswordRequest, DeleteAccountRequest } from '../types/user'

export const userService = {
  async updateProfile(data: UpdateProfileRequest): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { updateProfileMock } = await import('./mock/userMockService')
      return updateProfileMock(data)
    }
    return apiClient.patch<unknown, void>('/api/v1/users/me/profile', data)
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { changePasswordMock } = await import('./mock/userMockService')
      return changePasswordMock(data)
    }
    return apiClient.post<unknown, void>('/api/v1/users/me/change-password', data)
  },

  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { deleteAccountMock } = await import('./mock/userMockService')
      return deleteAccountMock(data)
    }
    return apiClient.delete<unknown, void>('/api/v1/users/me', { data })
  },
}
