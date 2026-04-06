import { searchService } from '../searchService'
import apiClient from '../apiClient'

vi.mock('../apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

describe('searchService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'))
    afterEach(() => vi.unstubAllEnvs())

    it('search 委派 mock 並回傳含 records 的 PageResult', async () => {
      const result = await searchService.search({ q: 'Vue' })
      expect(Array.isArray(result.records)).toBe(true)
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('current')
      expect(result).toHaveProperty('pages')
      expect(result).toHaveProperty('size')
    })

    it('search 無查詢詞時回傳所有結果', async () => {
      const result = await searchService.search({})
      expect(result.records.length).toBeGreaterThan(0)
    })

    it('suggest 回傳字串陣列', async () => {
      const result = await searchService.suggest('Vue')
      expect(Array.isArray(result)).toBe(true)
      result.forEach(item => expect(typeof item).toBe('string'))
    })

    it('suggest q 為空時回傳空陣列', async () => {
      const result = await searchService.suggest('')
      expect(result).toEqual([])
    })

    it('getHistory 回傳字串陣列', async () => {
      const result = await searchService.getHistory()
      expect(Array.isArray(result)).toBe(true)
      result.forEach(item => expect(typeof item).toBe('string'))
    })

    it('clearHistory 成功解析且無回傳值', async () => {
      await expect(searchService.clearHistory()).resolves.toBeUndefined()
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('search 呼叫 GET /api/v1/search 並回傳 PageResult', async () => {
      const backendResponse = {
        list: [
          { articleUuid: 'u1', title: 'Vue', summary: '...', slug: 'vue', authorNickname: 'A', tagNames: [], publishedAt: '2024-01-01T00:00:00Z', viewCount: 1, likeCount: 0 },
        ],
        pageNum: 1,
        pageSize: 10,
        totalPage: 1,
        total: 1,
      }
      vi.mocked(apiClient.get).mockResolvedValue(backendResponse)

      const result = await searchService.search({ q: 'Vue', page: 1, size: 10 })
      expect(result.records).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/search', { params: { q: 'Vue', page: 1, size: 10 } })
    })

    it('search API 錯誤時回傳空 PageResult', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await searchService.search({ q: 'x' })
      expect(result.records).toEqual([])
      expect(result.total).toBe(0)
    })

    it('suggest 呼叫 GET /api/v1/search/suggest', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(['Vue 3', 'Vue Router'])
      const result = await searchService.suggest('Vue')
      expect(result).toEqual(['Vue 3', 'Vue Router'])
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/search/suggest', { params: { q: 'Vue' } })
    })

    it('suggest q 為空時直接回傳 [] 不呼叫 API', async () => {
      const result = await searchService.suggest('')
      expect(result).toEqual([])
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('suggest API 錯誤時回傳空陣列', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await searchService.suggest('Vue')
      expect(result).toEqual([])
    })

    it('getHistory 呼叫 GET /api/v1/search/history', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(['Vue 3', 'TypeScript'])
      const result = await searchService.getHistory()
      expect(result).toEqual(['Vue 3', 'TypeScript'])
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/search/history')
    })

    it('getHistory API 錯誤時回傳空陣列', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await searchService.getHistory()
      expect(result).toEqual([])
    })

    it('clearHistory 呼叫 DELETE /api/v1/search/history', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)
      await searchService.clearHistory()
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/search/history')
    })
  })
})
