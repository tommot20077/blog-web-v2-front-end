import { adminService } from './adminService'
import apiClient from './apiClient'

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('adminService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'))
    afterEach(() => vi.unstubAllEnvs())

    it('getPendingArticles 委派 mock 並回傳 PageResult', async () => {
      const result = await adminService.getPendingArticles(1, 10)
      expect(result).toHaveProperty('records')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('pages')
    })

    it('getPendingArticles 回傳的文章全為 PENDING_REVIEW 狀態', async () => {
      const result = await adminService.getPendingArticles(1, 10)
      result.records.forEach(article => {
        expect(article.status).toBe('PENDING_REVIEW')
      })
    })

    it('getPendingCount 委派 mock 並回傳數字', async () => {
      const count = await adminService.getPendingCount()
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('publishArticle 委派 mock 並回傳 PUBLISHED 文章', async () => {
      const result = await adminService.publishArticle('editor-pending-1')
      expect(result.status).toBe('PUBLISHED')
    })

    it('rejectArticle 委派 mock 並回傳 REJECTED 文章', async () => {
      const result = await adminService.rejectArticle('editor-pending-1', '需要修改的詳細理由說明文字。')
      expect(result.status).toBe('REJECTED')
      expect(result.rejectReason).toBe('需要修改的詳細理由說明文字。')
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('getPendingArticles 呼叫 GET /api/admin/articles/pending 並帶 params', async () => {
      const mockResult = { records: [], total: 0, size: 10, current: 1, pages: 1 }
      vi.mocked(apiClient.get).mockResolvedValue(mockResult)
      const result = await adminService.getPendingArticles(1, 10)
      expect(result).toEqual(mockResult)
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/admin/articles/pending',
        { params: { page: 1, size: 10 } }
      )
    })

    it('getPendingCount 呼叫 getPendingArticles(1,1) 並回傳 total', async () => {
      const mockResult = { records: [], total: 5, size: 1, current: 1, pages: 5 }
      vi.mocked(apiClient.get).mockResolvedValue(mockResult)
      const result = await adminService.getPendingCount()
      expect(result).toBe(5)
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/admin/articles/pending',
        { params: { page: 1, size: 1 } }
      )
    })

    it('publishArticle 呼叫 POST /api/v1/articles/:uuid/publish', async () => {
      const mockArticle = { uuid: 'p1', status: 'PUBLISHED' }
      vi.mocked(apiClient.post).mockResolvedValue(mockArticle)
      await adminService.publishArticle('p1')
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/articles/p1/publish')
    })

    it('rejectArticle 呼叫 POST /api/v1/articles/:uuid/reject 並帶 reason', async () => {
      const mockArticle = { uuid: 'p1', status: 'REJECTED', rejectReason: '原因' }
      vi.mocked(apiClient.post).mockResolvedValue(mockArticle)
      await adminService.rejectArticle('p1', '退回原因說明文字')
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/articles/p1/reject', { reason: '退回原因說明文字' })
    })

    it('getPendingCount API 錯誤時回傳 0', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await adminService.getPendingCount()
      expect(result).toBe(0)
    })
  })
})
