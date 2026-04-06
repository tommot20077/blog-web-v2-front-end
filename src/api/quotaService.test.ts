import { quotaService } from './quotaService'
import apiClient from './apiClient'

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('quotaService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'))
    afterEach(() => vi.unstubAllEnvs())

    it('getQuota 委派 mock 並回傳配額資訊', async () => {
      const result = await quotaService.getQuota()
      expect(result.limitBytes).toBe(104_857_600)
      expect(result.usedBytes).toBeGreaterThan(0)
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('getQuota 呼叫 GET /api/v1/users/me/quota', async () => {
      const mockQuota = { usedBytes: 1000, limitBytes: 100_000, remainingBytes: 99_000 }
      vi.mocked(apiClient.get).mockResolvedValue(mockQuota)

      const result = await quotaService.getQuota()
      expect(result).toEqual(mockQuota)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/quota')
    })

    it('API 錯誤時回傳預設配額', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await quotaService.getQuota()
      expect(result.usedBytes).toBe(0)
      expect(result.limitBytes).toBeGreaterThan(0)
    })
  })
})
