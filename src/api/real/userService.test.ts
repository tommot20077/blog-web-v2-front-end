import { describe, it, expect, vi, afterEach } from 'vitest'
import { userService } from './userService'
import apiClient from '../apiClient'

vi.mock('../apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

describe('real/userService', () => {
  afterEach(() => vi.restoreAllMocks())

  it('updateProfile 呼叫 PATCH /api/v1/users/me/profile 並帶上 avatarUrl 與 location', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(undefined)
    const data = {
      nickname: 'NewName',
      bio: 'Bio text',
      website: 'https://my.blog',
      socialLinks: '{"github":"g"}',
      avatarUrl: 'https://cdn.example.com/a.png',
      location: 'Taipei',
    }
    await userService.updateProfile(data)
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/users/me/profile', data)
  })

  it('updateNotifications 呼叫 PATCH /api/v1/users/me/notifications 並帶上 5 個布林偏好', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(undefined)
    const data = {
      comment: true,
      like: false,
      review: true,
      follow: false,
      newsletter: true,
    }
    await userService.updateNotifications(data)
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/users/me/notifications', data)
  })
})
