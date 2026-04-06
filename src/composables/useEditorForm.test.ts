import { editorService } from '../api/editorService'
import { myArticlesService } from '../api/myArticlesService'
import { createMockEditorArticle } from '../test-utils/factories'
import { useEditorForm } from './useEditorForm'

vi.mock('../api/editorService')
vi.mock('../api/myArticlesService')

describe('useEditorForm', () => {
  const mockArticle = createMockEditorArticle()

  // ── 新建模式 ───────────────────────────────────────────────────────────────
  describe('新建模式（無 uuid）', () => {
    it('所有欄位初始為空', () => {
      const { title, summary, coverImageUrl, categoryIds, tagNames } = useEditorForm()
      expect(title.value).toBe('')
      expect(summary.value).toBe('')
      expect(coverImageUrl.value).toBeNull()
      expect(categoryIds.value).toEqual([])
      expect(tagNames.value).toEqual([])
    })

    it('isNew 為 true', () => {
      const { isNew } = useEditorForm()
      expect(isNew.value).toBe(true)
    })

    it('isSaving 初始為 false', () => {
      const { isSaving } = useEditorForm()
      expect(isSaving.value).toBe(false)
    })

    it('isDirty 初始為 false', () => {
      const { isDirty } = useEditorForm()
      expect(isDirty.value).toBe(false)
    })
  })

  // ── 編輯模式 ───────────────────────────────────────────────────────────────
  describe('編輯模式（有 uuid）', () => {
    it('isNew 為 false', () => {
      const { isNew } = useEditorForm('some-uuid')
      expect(isNew.value).toBe(false)
    })

    it('loadArticle() 成功後填入所有表單欄位', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)

      const { title, summary, coverImageUrl, categoryIds, tagNames, loadArticle } = useEditorForm(mockArticle.uuid)
      await loadArticle()

      expect(title.value).toBe(mockArticle.title)
      expect(summary.value).toBe(mockArticle.summary)
      expect(coverImageUrl.value).toBe(mockArticle.coverImageUrl)
      expect(categoryIds.value).toEqual(mockArticle.categories.map(c => c.id))
      expect(tagNames.value).toEqual(mockArticle.tags)
    })

    it('loadArticle() 成功後 article ref 有值', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)

      const { article, loadArticle } = useEditorForm(mockArticle.uuid)
      await loadArticle()

      expect(article.value).toEqual(mockArticle)
    })

    it('loadArticle() API 回傳 null 時 article 維持 null', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(null)

      const { article, loadArticle } = useEditorForm('nonexistent-uuid')
      await loadArticle()

      expect(article.value).toBeNull()
    })
  })

  // ── isDirty 偵測 ───────────────────────────────────────────────────────────
  describe('isDirty 偵測', () => {
    it('修改 title 後 isDirty 變為 true', async () => {
      const { title, isDirty } = useEditorForm()
      title.value = '新標題'
      await Promise.resolve() // wait for watcher
      expect(isDirty.value).toBe(true)
    })

    it('修改 summary 後 isDirty 變為 true', async () => {
      const { summary, isDirty } = useEditorForm()
      summary.value = '新摘要'
      await Promise.resolve()
      expect(isDirty.value).toBe(true)
    })
  })

  // ── saveDraft ───────────────────────────────────────────────────────────────
  describe('saveDraft()', () => {
    it('新建模式：呼叫 editorService.createArticle', async () => {
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const { title, saveDraft } = useEditorForm()
      title.value = '新文章'
      await saveDraft('# 內容')

      expect(editorService.createArticle).toHaveBeenCalledWith({
        title: '新文章',
        summary: '',
        content: '# 內容',
        coverImageUrl: null,
        categoryIds: [],
        tagNames: [],
      })
    })

    it('新建模式：儲存成功後 isDirty 重置為 false', async () => {
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const { title, isDirty, saveDraft } = useEditorForm()
      title.value = '新文章'
      await Promise.resolve()
      expect(isDirty.value).toBe(true)

      await saveDraft('內容')
      expect(isDirty.value).toBe(false)
    })

    it('新建模式：儲存成功後回傳 EditorArticle', async () => {
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const { saveDraft } = useEditorForm()
      const result = await saveDraft('內容')

      expect(result).toEqual(mockArticle)
    })

    it('編輯模式：呼叫 editorService.updateArticle（帶 uuid）', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)
      vi.mocked(editorService.updateArticle).mockResolvedValue(mockArticle)

      const { title, loadArticle, saveDraft } = useEditorForm(mockArticle.uuid)
      await loadArticle()
      title.value = '修改後標題'
      await saveDraft('修改後內容')

      expect(editorService.updateArticle).toHaveBeenCalledWith(
        mockArticle.uuid,
        expect.objectContaining({ title: '修改後標題', content: '修改後內容' }),
      )
    })

    it('儲存期間 isSaving 為 true，完成後恢復 false', async () => {
      let resolveCreate!: (v: typeof mockArticle) => void
      vi.mocked(editorService.createArticle).mockReturnValue(
        new Promise((resolve) => { resolveCreate = resolve }),
      )

      const { isSaving, saveDraft } = useEditorForm()
      const saving = saveDraft('內容')
      expect(isSaving.value).toBe(true)

      resolveCreate(mockArticle)
      await saving
      expect(isSaving.value).toBe(false)
    })
  })

  // ── UUID 接力（新建後連續儲存） ────────────────────────────────────────────
  describe('UUID 接力', () => {
    it('新建模式第一次 saveDraft 後 isNew 變為 false', async () => {
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const { isNew, saveDraft } = useEditorForm()
      expect(isNew.value).toBe(true)

      await saveDraft('內容')
      expect(isNew.value).toBe(false)
    })

    it('新建模式第二次 saveDraft 呼叫 updateArticle 而非 createArticle', async () => {
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)
      vi.mocked(editorService.updateArticle).mockResolvedValue(mockArticle)

      const { saveDraft } = useEditorForm()
      await saveDraft('第一次')
      await saveDraft('第二次')

      expect(editorService.createArticle).toHaveBeenCalledTimes(1)
      expect(editorService.updateArticle).toHaveBeenCalledOnce()
      expect(editorService.updateArticle).toHaveBeenCalledWith(
        mockArticle.uuid,
        expect.objectContaining({ content: '第二次' }),
      )
    })

    it('新建模式第一次 saveDraft 後 article.uuid 被設定', async () => {
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const { article, saveDraft } = useEditorForm()
      await saveDraft('內容')

      expect(article.value?.uuid).toBe(mockArticle.uuid)
    })
  })

  // ── submitForReview ────────────────────────────────────────────────────────
  describe('submitForReview()', () => {
    it('呼叫 myArticlesService.submitForReview（帶 article uuid）', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)
      vi.mocked(editorService.updateArticle).mockResolvedValue(mockArticle)
      vi.mocked(myArticlesService.submitForReview).mockResolvedValue(undefined)

      const { loadArticle, saveDraft, submitForReview } = useEditorForm(mockArticle.uuid)
      await loadArticle()
      await saveDraft('內容')
      await submitForReview()

      expect(myArticlesService.submitForReview).toHaveBeenCalledWith(mockArticle.uuid)
    })
  })
})
