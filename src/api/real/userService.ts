import apiClient from '../apiClient'
import type {
  UpdateProfileRequest,
  NotificationPreferencesRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
} from '../../types/user'

export const userService = {
  async updateProfile(data: UpdateProfileRequest): Promise<void> {
    return apiClient.patch<unknown, void>('/api/v1/users/me/profile', data)
  },

  async updateNotifications(data: NotificationPreferencesRequest): Promise<void> {
    return apiClient.patch<unknown, void>('/api/v1/users/me/notifications', data)
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiClient.post<unknown, void>('/api/v1/users/me/change-password', data)
  },

  async deleteAccount(data: DeleteAccountRequest): Promise<void> {
    return apiClient.delete<unknown, void>('/api/v1/users/me', { data })
  },
}
