import { adminService } from './adminService'
import apiClient from './apiClient'

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('adminService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'))
    afterEach(() => vi.unstubAllEnvs())

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

    it('getPendingCount 呼叫 GET /api/v1/admin/articles/pending', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(3)
      const result = await adminService.getPendingCount()
      expect(result).toBe(3)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/admin/articles/pending')
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
