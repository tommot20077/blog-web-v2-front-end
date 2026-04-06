import { editorService } from './editorService'
import apiClient from './apiClient'

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const mockFormData = {
  title: '測試標題',
  summary: '測試摘要',
  content: '# 測試',
  coverImageUrl: null,
  categoryIds: ['cat-1'],
  tagNames: ['Vue'],
}

describe('editorService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'))
    afterEach(() => vi.unstubAllEnvs())

    it('createArticle 委派 mock 並回傳草稿文章', async () => {
      const result = await editorService.createArticle(mockFormData)
      expect(result.status).toBe('DRAFT')
      expect(result.title).toBe('測試標題')
    })

    it('getArticleForEdit 委派 mock 並回傳現有文章', async () => {
      const result = await editorService.getArticleForEdit('editor-draft-1')
      expect(result).not.toBeNull()
      expect(result?.uuid).toBe('editor-draft-1')
    })

    it('getArticleForEdit 找不到時回傳 null', async () => {
      const result = await editorService.getArticleForEdit('no-such-uuid')
      expect(result).toBeNull()
    })

    it('updateArticle 委派 mock 並回傳更新後文章', async () => {
      const result = await editorService.updateArticle('editor-draft-1', { ...mockFormData, title: '更新標題' })
      expect(result.title).toBe('更新標題')
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('createArticle 呼叫 POST /api/v1/articles', async () => {
      const mockArticle = { uuid: 'new-1', status: 'DRAFT' }
      vi.mocked(apiClient.post).mockResolvedValue(mockArticle)

      const result = await editorService.createArticle(mockFormData)
      expect(result).toEqual(mockArticle)
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/articles', mockFormData)
    })

    it('updateArticle 呼叫 PUT /api/v1/articles/:uuid', async () => {
      const mockArticle = { uuid: 'edit-1', status: 'DRAFT', title: '更新' }
      vi.mocked(apiClient.put).mockResolvedValue(mockArticle)

      await editorService.updateArticle('edit-1', mockFormData)
      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/articles/edit-1', mockFormData)
    })

    it('getArticleForEdit 呼叫 GET /api/v1/articles/:uuid/edit', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ uuid: 'e1', content: '# Hi' })
      await editorService.getArticleForEdit('e1')
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/e1/edit')
    })

    it('getArticleForEdit API 錯誤時回傳 null', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await editorService.getArticleForEdit('e1')
      expect(result).toBeNull()
    })
  })
})
