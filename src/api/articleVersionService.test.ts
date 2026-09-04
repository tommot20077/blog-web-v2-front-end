import { articleVersionService } from './articleVersionService'
import apiClient from './apiClient'
import { getArticleForEditMock } from './mock/editorMockService'
import { resetArticleVersionStore, resetEditorArticleStore } from './mock/data'

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('articleVersionService（mock / real facade）', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'true')
      resetEditorArticleStore()
      resetArticleVersionStore()
    })
    afterEach(() => vi.unstubAllEnvs())

    it('list 委派 mock 回傳版本分頁，不打真實 API', async () => {
      const result = await articleVersionService.list('editor-draft-1')

      expect(result.records.length).toBeGreaterThan(0)
      expect(result.total).toBe(result.records.length)
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('restore 委派 mock，並把文章內容換成該版本快照，不打真實 API', async () => {
      const before = await getArticleForEditMock('editor-draft-1')
      const { records } = await articleVersionService.list('editor-draft-1')
      const oldest = records[records.length - 1]!

      await articleVersionService.restore('editor-draft-1', oldest.uuid)

      const after = await getArticleForEditMock('editor-draft-1')
      expect(after?.content).not.toBe(before?.content)
      expect(apiClient.post).not.toHaveBeenCalled()
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.clearAllMocks()
    })

    it('list 呼叫 GET /api/v1/articles/{articleUuid}/versions 並帶上查詢參數', async () => {
      const page = { records: [], total: 0, current: 1, size: 20, pages: 0 }
      vi.mocked(apiClient.get).mockResolvedValue(page)

      const result = await articleVersionService.list('article-uuid', { type: 'MANUAL', page: 2, size: 10 })

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/versions', {
        params: { type: 'MANUAL', page: 2, size: 10 },
      })
      expect(result).toEqual(page)
    })

    it('restore 呼叫 POST /api/v1/articles/{articleUuid}/versions/{versionUuid}/restore', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(undefined)

      await articleVersionService.restore('article-uuid', 'version-uuid')

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/articles/article-uuid/versions/version-uuid/restore',
      )
    })
  })
})
