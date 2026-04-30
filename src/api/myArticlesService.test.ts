import { myArticlesService } from './myArticlesService'
import apiClient from './apiClient'

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('myArticlesService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'))
    afterEach(() => vi.unstubAllEnvs())

    it('getMyArticles 委派 mock 並回傳文章列表', async () => {
      const result = await myArticlesService.getMyArticles('ALL', 1, 10)
      expect(result.total).toBeGreaterThan(0)
    })

    it('getMyArticles 篩選 DRAFT 只回傳草稿', async () => {
      const result = await myArticlesService.getMyArticles('DRAFT', 1, 20)
      result.records.forEach(a => expect(a.status).toBe('DRAFT'))
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('getMyArticles 呼叫 GET /api/v1/articles/me 並帶正確參數', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        records: [],
        total: 0,
        size: 10,
        current: 1,
        pages: 0,
      })
      await myArticlesService.getMyArticles('DRAFT', 1, 10)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/me', { params: { status: 'DRAFT', page: 1, size: 10 } })
    })

    it('getMyArticles ALL 時不帶 status 參數', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        records: [],
        total: 0,
        size: 10,
        current: 1,
        pages: 0,
      })
      await myArticlesService.getMyArticles('ALL', 1, 10)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/me', { params: { page: 1, size: 10 } })
    })

    it('tags 由物件陣列映射為字串陣列', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        records: [
          {
            uuid: 'my-1',
            title: '我的文章',
            summary: '摘要',
            coverImageUrl: null,
            status: 'DRAFT',
            tags: [{ id: 't-1', name: 'Vue', slug: 'vue' }],
            rejectReason: null,
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
          },
        ],
        total: 1,
        size: 10,
        current: 1,
        pages: 1,
      })
      const result = await myArticlesService.getMyArticles('DRAFT', 1, 10)
      expect(result.records[0].tags).toEqual(['Vue'])
    })

    it('deleteArticle 呼叫 DELETE /api/v1/articles/:uuid', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)
      await myArticlesService.deleteArticle('uuid-1')
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/articles/uuid-1')
    })

    it('submitForReview 呼叫 POST /api/v1/articles/:uuid/submit', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(undefined)
      await myArticlesService.submitForReview('uuid-1')
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/articles/uuid-1/submit')
    })
  })
})
