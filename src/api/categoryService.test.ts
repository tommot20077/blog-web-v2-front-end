import { categoryService } from './categoryService'
import apiClient from './apiClient'

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('categoryService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'))
    afterEach(() => vi.unstubAllEnvs())

    it('getCategories 委派 mock 並回傳分類列表', async () => {
      const result = await categoryService.getCategories()
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('getCategories 呼叫 GET /api/v1/categories', async () => {
      const mockCats = [{ id: 'c1', name: 'Vue', slug: 'vue' }]
      vi.mocked(apiClient.get).mockResolvedValue(mockCats)

      const result = await categoryService.getCategories()
      expect(result).toEqual(mockCats)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/categories')
    })

    it('API 錯誤時回傳空陣列', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await categoryService.getCategories()
      expect(result).toEqual([])
    })
  })
})
