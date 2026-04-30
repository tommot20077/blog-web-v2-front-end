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

    it('getCategoryBySlug 找到對應分類時回傳分類', async () => {
      const result = await categoryService.getCategoryBySlug('vue')
      expect(result).not.toBeNull()
      expect(result!.slug).toBe('vue')
    })

    it('getCategoryBySlug 找不到時回傳 null', async () => {
      const result = await categoryService.getCategoryBySlug('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('getCategories 呼叫 GET /api/v1/categories 並將 uuid 映射為 id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([{ uuid: 'c1', name: 'Vue', slug: 'vue' }])

      const result = await categoryService.getCategories()
      expect(result).toEqual([{ id: 'c1', name: 'Vue', slug: 'vue' }])
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/categories')
    })

    it('API 錯誤時回傳空陣列', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await categoryService.getCategories()
      expect(result).toEqual([])
    })

    it('getCategoryBySlug 呼叫 GET /api/v1/categories/:slug 並將 uuid 映射為 id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ uuid: 'c1', name: 'Vue', slug: 'vue' })

      const result = await categoryService.getCategoryBySlug('vue')
      expect(result).toEqual({ id: 'c1', name: 'Vue', slug: 'vue' })
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/categories/vue')
    })

    it('getCategoryBySlug API 錯誤時回傳 null', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await categoryService.getCategoryBySlug('bad-slug')
      expect(result).toBeNull()
    })
  })
})
