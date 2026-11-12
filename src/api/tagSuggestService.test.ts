import { tagSuggestService } from './tagSuggestService'
import apiClient from './apiClient'

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('tagSuggestService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'))
    afterEach(() => vi.unstubAllEnvs())

    it('suggestTags 委派 mock 並回傳匹配標籤', async () => {
      const result = await tagSuggestService.suggestTags('Vu')
      expect(result.some(t => t.name === 'Vue 3')).toBe(true)
    })

    it('空 query 回傳空陣列', async () => {
      const result = await tagSuggestService.suggestTags('')
      expect(result).toHaveLength(0)
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('suggestTags 帶 query 呼叫 GET /api/v1/tags/suggest', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(['Vue'])
      await tagSuggestService.suggestTags('Vu')
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/tags/suggest', { params: { q: 'Vu', limit: 10 } })
    })

    it('suggestTags 帶 limit query 對齊後端參數', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(['Vue'])
      await tagSuggestService.suggestTags('Vu', 8)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/tags/suggest', {
        params: { q: 'Vu', limit: 8 },
      })
    })

    it('suggestTags 將後端 string[] 回應映射為不含 articleCount 的 TagSuggestion', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(['Vue', 'Vite'])

      const result = await tagSuggestService.suggestTags('V')

      expect(result).toEqual([
        { name: 'Vue' },
        { name: 'Vite' },
      ])
    })

    it('空 query 不呼叫 API，直接回傳空陣列', async () => {
      const result = await tagSuggestService.suggestTags('')
      expect(apiClient.get).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('API 錯誤時回傳空陣列', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await tagSuggestService.suggestTags('test')
      expect(result).toEqual([])
    })
  })
})
