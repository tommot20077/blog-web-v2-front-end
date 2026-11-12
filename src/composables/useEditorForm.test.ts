import { nextTick } from 'vue'
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

    it('D5：loadArticle() 載入既有文章不算「未儲存修改」（watcher 非同步觸發後 isDirty 仍為 false）', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)

      const { isDirty, loadArticle } = useEditorForm(mockArticle.uuid)
      await loadArticle()
      await nextTick()

      expect(isDirty.value).toBe(false)
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

    it('loadArticle() 回傳載入到的文章，讓呼叫端可據以判斷是否載入成功', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)

      const { loadArticle } = useEditorForm(mockArticle.uuid)

      await expect(loadArticle()).resolves.toEqual(mockArticle)
    })

    it('loadArticle() 取不到文章時回傳 null（real service 失敗會吞例外回 null），呼叫端才分得出失敗', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(null)

      const { loadArticle } = useEditorForm('nonexistent-uuid')

      await expect(loadArticle()).resolves.toBeNull()
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

    it('儲存進行中又修改標題：儲存完成後仍為 dirty（修改不會被吃掉）', async () => {
      let resolveCreate!: (a: typeof mockArticle) => void
      vi.mocked(editorService.createArticle).mockReturnValue(
        new Promise((resolve) => { resolveCreate = resolve }),
      )

      const { title, isDirty, saveDraft } = useEditorForm()
      title.value = '舊標題'
      const saving = saveDraft('內容')
      title.value = '儲存期間改的標題'
      resolveCreate(mockArticle)
      await saving

      expect(isDirty.value).toBe(true)
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
  // ── B2：樂觀鎖 version ─────────────────────────────────────────────────────
  describe('B2：樂觀鎖 version', () => {
    const loaded = createMockEditorArticle({ version: 3 })

    it('loadArticle() 記住 version', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      const { version, loadArticle } = useEditorForm(loaded.uuid)
      await loadArticle()
      expect(version.value).toBe(3)
    })

    it('既有文章存檔 payload 帶 version', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      vi.mocked(editorService.updateArticle).mockResolvedValue({ ...loaded, version: 4 })
      const { loadArticle, saveDraft } = useEditorForm(loaded.uuid)
      await loadArticle()
      await saveDraft('內容')
      expect(editorService.updateArticle).toHaveBeenCalledWith(
        loaded.uuid,
        expect.objectContaining({ version: 3 }),
      )
    })

    it('存檔成功後改用回應的新 version，可連續存檔', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      vi.mocked(editorService.updateArticle)
        .mockResolvedValueOnce({ ...loaded, version: 4 })
        .mockResolvedValueOnce({ ...loaded, version: 5 })
      const { version, loadArticle, saveDraft } = useEditorForm(loaded.uuid)
      await loadArticle()
      await saveDraft('第一次')
      expect(version.value).toBe(4)
      await saveDraft('第二次')
      expect(vi.mocked(editorService.updateArticle).mock.calls[1]![1]).toEqual(
        expect.objectContaining({ version: 4 }),
      )
      expect(version.value).toBe(5)
    })

    it('新建文章 payload 不帶 version；建立成功後記住回應的 version，第二次存檔帶上', async () => {
      vi.mocked(editorService.createArticle).mockResolvedValue({ ...loaded, version: 0 })
      vi.mocked(editorService.updateArticle).mockResolvedValue({ ...loaded, version: 1 })
      const { version, saveDraft } = useEditorForm()
      await saveDraft('第一次')
      expect(vi.mocked(editorService.createArticle).mock.calls[0]![0]).not.toHaveProperty('version')
      expect(version.value).toBe(0)
      await saveDraft('第二次')
      expect(editorService.updateArticle).toHaveBeenCalledWith(
        loaded.uuid,
        expect.objectContaining({ version: 0 }),
      )
    })

    it('狀態轉換（送審）成功後改用回應的新 version', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      vi.mocked(myArticlesService.submitForReview).mockResolvedValue({ version: 7 })
      const { version, loadArticle, submitForReview } = useEditorForm(loaded.uuid)
      await loadArticle()
      await submitForReview()
      expect(version.value).toBe(7)
    })

    it('送審回應沒有 version 時保留原 version', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      vi.mocked(myArticlesService.submitForReview).mockResolvedValue(undefined)
      const { version, loadArticle, submitForReview } = useEditorForm(loaded.uuid)
      await loadArticle()
      await submitForReview()
      expect(version.value).toBe(3)
    })

    it('存檔被 409 拒絕時 version 不變、dirty 保留', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      vi.mocked(editorService.updateArticle).mockRejectedValue(
        Object.assign(new Error('conflict'), { status: 409, code: 'A0208' }),
      )
      const { title, version, isDirty, loadArticle, saveDraft } = useEditorForm(loaded.uuid)
      await loadArticle()
      title.value = '我的修改'
      await expect(saveDraft('內容')).rejects.toThrow('conflict')
      expect(version.value).toBe(3)
      expect(isDirty.value).toBe(true)
    })

    it('重新載入（loadArticle）取得最新 version 並重置 dirty', async () => {
      vi.mocked(editorService.getArticleForEdit)
        .mockResolvedValueOnce(loaded)
        .mockResolvedValueOnce({ ...loaded, version: 9, title: '別處改的標題' })
      const { title, version, isDirty, loadArticle } = useEditorForm(loaded.uuid)
      await loadArticle()
      title.value = '我的修改'
      expect(isDirty.value).toBe(true)
      await loadArticle()
      expect(version.value).toBe(9)
      expect(title.value).toBe('別處改的標題')
      expect(isDirty.value).toBe(false)
    })
  })
})
