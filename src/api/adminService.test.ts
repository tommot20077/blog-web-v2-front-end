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

    it('publishArticle 委派 mock 並回傳 PUBLISHED 文章', async () => {
      const result = await adminService.publishArticle('editor-pending-1')
      expect(result.status).toBe('PUBLISHED')
    })

    it('rejectArticle 委派 mock 並回傳 REJECTED 文章', async () => {
      const result = await adminService.rejectArticle('editor-pending-1', '需要修改的詳細理由說明文字。')
      expect(result.status).toBe('REJECTED')
      expect(result.rejectReason).toBe('需要修改的詳細理由說明文字。')
    })

    it('createCategory 委派 mock 並回傳新分類', async () => {
      const result = await adminService.createCategory({ name: 'Test', slug: 'test' })
      expect(result.name).toBe('Test')
      expect(result.slug).toBe('test')
      expect(result.uuid).toBeTruthy()
    })

    it('updateCategory 委派 mock 並回傳更新後分類', async () => {
      const result = await adminService.updateCategory('cat-1', { name: 'Updated' })
      expect(result.uuid).toBe('cat-1')
    })

    it('deleteCategory 委派 mock 並成功解析', async () => {
      await expect(adminService.deleteCategory('cat-1')).resolves.toBeUndefined()
    })

    it('updateTag 委派 mock 並成功解析', async () => {
      await expect(adminService.updateTag('tag-1', { color: '#ff0000' })).resolves.toBeUndefined()
    })

    it('deleteTag 委派 mock 並成功解析', async () => {
      await expect(adminService.deleteTag('tag-1')).resolves.toBeUndefined()
    })

    it('reindex 委派 mock 並成功解析', async () => {
      await expect(adminService.reindex()).resolves.toBeUndefined()
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('getPendingArticles 呼叫 GET /api/v1/admin/articles/pending 並帶 params', async () => {
      const mockResult = {
        list: [],
        total: 0,
        pageSize: 10,
        pageNum: 1,
        totalPage: 0,
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockResult)
      const result = await adminService.getPendingArticles(1, 10)
      expect(result).toHaveProperty('records')
      expect(result.total).toBe(0)
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/admin/articles/pending',
        { params: { page: 1, size: 10 } }
      )
    })

    it('getPendingArticles tags 由物件陣列映射為字串陣列', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        list: [
          {
            uuid: 'p-1',
            title: '待審文章',
            summary: '摘要',
            coverImageUrl: null,
            status: 'PENDING_REVIEW',
            tags: [{ id: 't-1', name: 'Vue', slug: 'vue' }],
            rejectReason: null,
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-01T00:00:00Z',
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            authorNickname: 'Author',
          },
        ],
        total: 1,
        pageSize: 10,
        pageNum: 1,
        totalPage: 1,
      })
      const result = await adminService.getPendingArticles(1, 10)
      expect(result.records[0].tags).toEqual(['Vue'])
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

    it('createCategory 呼叫 POST /api/v1/admin/categories', async () => {
      const mockCat = { uuid: 'new-cat', name: 'Test', slug: 'test' }
      vi.mocked(apiClient.post).mockResolvedValue(mockCat)
      const result = await adminService.createCategory({ name: 'Test', slug: 'test' })
      expect(result).toEqual(mockCat)
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/admin/categories', { name: 'Test', slug: 'test' })
    })

    it('updateCategory 呼叫 PUT /api/v1/admin/categories/:uuid', async () => {
      const mockCat = { uuid: 'cat-1', name: 'Updated', slug: 'updated' }
      vi.mocked(apiClient.put).mockResolvedValue(mockCat)
      const result = await adminService.updateCategory('cat-1', { name: 'Updated' })
      expect(result).toEqual(mockCat)
      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/admin/categories/cat-1', { name: 'Updated' })
    })

    it('deleteCategory 呼叫 DELETE /api/v1/admin/categories/:uuid', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)
      await adminService.deleteCategory('cat-1')
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/admin/categories/cat-1')
    })

    it('updateTag 呼叫 PUT /api/v1/admin/tags/:id', async () => {
      vi.mocked(apiClient.put).mockResolvedValue(undefined)
      await adminService.updateTag('tag-1', { color: '#ff0000' })
      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/admin/tags/tag-1', { color: '#ff0000' })
    })

    it('deleteTag 呼叫 DELETE /api/v1/admin/tags/:id', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)
      await adminService.deleteTag('tag-1')
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/admin/tags/tag-1')
    })

    it('reindex 呼叫 POST /api/v1/admin/search/reindex', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(undefined)
      await adminService.reindex()
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/admin/search/reindex')
    })
  })
})
