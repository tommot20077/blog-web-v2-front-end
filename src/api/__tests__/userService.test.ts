import { userService } from '../userService'
import apiClient from '../apiClient'

vi.mock('../apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

describe('userService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'))
    afterEach(() => vi.unstubAllEnvs())

    it('updateProfile 成功解析且無回傳值', async () => {
      await expect(
        userService.updateProfile({ nickname: 'TestUser', bio: 'Hello' }),
      ).resolves.toBeUndefined()
    })

    it('changePassword 成功解析且無回傳值', async () => {
      await expect(
        userService.changePassword({ oldPassword: 'old123', newPassword: 'new456' }),
      ).resolves.toBeUndefined()
    })

    it('deleteAccount 成功解析且無回傳值', async () => {
      await expect(
        userService.deleteAccount({ password: 'mypassword' }),
      ).resolves.toBeUndefined()
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('updateProfile 呼叫 PATCH /api/v1/users/me/profile', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue(undefined)
      const data = { nickname: 'NewName', bio: 'Bio text' }
      await userService.updateProfile(data)
      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/users/me/profile', data)
    })

    it('changePassword 呼叫 POST /api/v1/users/me/change-password', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(undefined)
      const data = { oldPassword: 'old', newPassword: 'new' }
      await userService.changePassword(data)
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/me/change-password', data)
    })

    it('deleteAccount 呼叫 DELETE /api/v1/users/me 並帶有 body', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)
      const data = { password: 'mypassword' }
      await userService.deleteAccount(data)
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/users/me', { data })
    })
  })
})
