import { ref } from 'vue'
import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createPinia, setActivePinia } from 'pinia'
import EditorView from './EditorView.vue'
import { editorService } from '../api/editorService'
import { myArticlesService } from '../api/myArticlesService'
import { createMockEditorArticle } from '../test-utils/factories'

// ── Mock vue-router ──────────────────────────────────────────────────────────
const mockRouterReplace = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useRoute: () => ({ params: {} }),
  onBeforeRouteLeave: vi.fn(),
  onBeforeRouteUpdate: vi.fn(),
}))

// ── Mock 相依模組 ────────────────────────────────────────────────────────────
vi.mock('../api/editorService')
vi.mock('../api/categoryService')
vi.mock('../api/myArticlesService')
vi.mock('../api/fileService')
vi.mock('../api/tagSuggestService')

const mockShowToast = vi.fn()
vi.mock('../composables/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    toasts: { value: [] },
    removeToast: vi.fn(),
    TOAST_TYPE: { SUCCESS: 'success', ERROR: 'error', WARNING: 'warning', INFO: 'info' },
  }),
}))

const { mockSetContent } = vi.hoisted(() => ({ mockSetContent: vi.fn() }))

vi.mock('../composables/useMarkdownEditor', () => ({
  useMarkdownEditor: vi.fn(() => ({
    editorView: ref(null),
    markdownContent: ref(''),
    wrapSelection: vi.fn(),
    insertText: vi.fn(),
    prefixLines: vi.fn(),
    setContent: mockSetContent,
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}))

vi.mock('../composables/useMarkdownRenderer', () => ({
  useMarkdownRenderer: vi.fn((content) => ({
    renderedHtml: ref(`<p>${content.value}</p>`),
    isReady: ref(true),
  })),
}))

// ── 共用測試資料 ─────────────────────────────────────────────────────────────
function renderEditor(props: Record<string, unknown> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return render(EditorView, {
    props,
    global: { plugins: [pinia] },
  })
}

// ── 測試套件 ─────────────────────────────────────────────────────────────────
describe('EditorView Integration', () => {
  beforeEach(() => {
    vi.mocked(mockShowToast).mockReset?.()
    mockRouterReplace.mockReset()
    mockSetContent.mockClear()
  })

  // ── 新建模式 ──────────────────────────────────────────────────────────────
  describe('新建模式（無 uuid）', () => {
    it('渲染標題輸入框', async () => {
      renderEditor()
      expect(screen.getByTestId('editor-title-input')).toBeInTheDocument()
    })

    it('渲染「儲存草稿」按鈕', () => {
      renderEditor()
      expect(screen.getByTestId('editor-save-btn')).toBeInTheDocument()
    })

    it('渲染「送出審核」按鈕', () => {
      renderEditor()
      expect(screen.getByTestId('editor-publish-btn')).toBeInTheDocument()
    })

    it('點擊「儲存草稿」後呼叫 editorService.createArticle', async () => {
      const mockArticle = createMockEditorArticle()
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const user = userEvent.setup()
      renderEditor()

      await user.type(screen.getByTestId('editor-title-input'), '測試文章')
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => {
        expect(editorService.createArticle).toHaveBeenCalled()
      })
    })

    it('儲存成功後呼叫 showToast 顯示成功訊息', async () => {
      const mockArticle = createMockEditorArticle()
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('草稿已儲存', 'success')
      })
    })
  })

  // ── 編輯模式 ──────────────────────────────────────────────────────────────
  describe('編輯模式（帶 uuid）', () => {
    it('掛載後呼叫 getArticleForEdit 並填入標題', async () => {
      const mockArticle = createMockEditorArticle({
        uuid: 'edit-uuid',
        title: '已有文章標題',
        content: '# Hello',
      })
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)

      renderEditor({ uuid: 'edit-uuid' })

      await waitFor(() => {
        expect(editorService.getArticleForEdit).toHaveBeenCalledWith('edit-uuid')
      })
      await waitFor(() => {
        const titleInput = screen.getByTestId('editor-title-input') as HTMLInputElement
        expect(titleInput.value).toBe('已有文章標題')
      })
    })

    it('點擊「儲存草稿」後呼叫 updateArticle 而非 createArticle', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'edit-uuid', title: '舊標題' })
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)
      vi.mocked(editorService.updateArticle).mockResolvedValue({
        ...mockArticle,
        title: '新標題',
      })

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })

      await waitFor(() => {
        expect(screen.getByTestId('editor-title-input')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => {
        expect(editorService.updateArticle).toHaveBeenCalledWith('edit-uuid', expect.any(Object))
        expect(editorService.createArticle).not.toHaveBeenCalled()
      })
    })
  })

  // ── 儲存後路由更新 ────────────────────────────────────────────────────────
  describe('儲存後路由更新', () => {
    it('新建模式儲存草稿後 router.replace 呼叫帶 /editor/{uuid}', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'new-uuid-123' })
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/editor/new-uuid-123')
      })
    })

    it('有 uuid prop 時儲存草稿不呼叫 router.replace', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'edit-uuid' })
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)
      vi.mocked(editorService.updateArticle).mockResolvedValue(mockArticle)

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })

      await waitFor(() => screen.getByTestId('editor-title-input'))
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => {
        expect(editorService.updateArticle).toHaveBeenCalled()
      })
      expect(mockRouterReplace).not.toHaveBeenCalled()
    })

    it('載入既有文章期間停用儲存與送審，避免空白初始 state 覆蓋文章', async () => {
      vi.mocked(editorService.getArticleForEdit).mockReturnValue(new Promise(() => {}))

      renderEditor({ uuid: 'edit-uuid' })

      expect(screen.getByTestId('editor-save-btn')).toBeDisabled()
      expect(screen.getByTestId('editor-publish-btn')).toBeDisabled()
    })
  })

  // ── 送出審核 ───────────────────────────────────────────────────────────────
  describe('送出審核', () => {
    it('先儲存再送出審核', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'new-uuid' })
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)
      vi.mocked(myArticlesService.submitForReview).mockResolvedValue(undefined)

      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-publish-btn'))

      await waitFor(() => {
        expect(editorService.createArticle).toHaveBeenCalled()
        expect(myArticlesService.submitForReview).toHaveBeenCalledWith('new-uuid')
      })
    })

    it('saveDraft 失敗時不呼叫 submitForReview', async () => {
      vi.mocked(editorService.createArticle).mockRejectedValue(new Error('網路錯誤'))
      vi.mocked(myArticlesService.submitForReview).mockResolvedValue(undefined)

      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-publish-btn'))

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('儲存失敗', 'error')
      })
      expect(myArticlesService.submitForReview).not.toHaveBeenCalled()
    })

    it('成功時只顯示一次成功 toast（已送出審核）', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'new-uuid' })
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)
      vi.mocked(myArticlesService.submitForReview).mockResolvedValue(undefined)

      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-publish-btn'))

      await waitFor(() => {
        expect(myArticlesService.submitForReview).toHaveBeenCalled()
      })

      const successCalls = mockShowToast.mock.calls.filter(([, type]) => type === 'success')
      expect(successCalls).toHaveLength(1)
      expect(successCalls[0][0]).toBe('已送出審核')
    })
  })

  // ── B2：樂觀鎖衝突（409 / A0208） ─────────────────────────────────────────
  describe('B2：存檔衝突提示', () => {
    const CONFLICT_MESSAGE = '這篇文章已在其他地方被修改。重新載入會捨棄你目前未儲存的內容。'
    const loaded = createMockEditorArticle({ uuid: 'edit-uuid', title: '原標題', content: '原內容', version: 3 })
    const conflict = () => Object.assign(new Error('文章已被其他人修改'), { status: 409, code: 'A0208' })

    // happy-dom 沒有實作 window.confirm，以 stubGlobal 提供（與 EditorMetaSidebar.test.ts 同做法）
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('存檔 payload 帶載入時的 version，成功後以回應的新 version 連續存檔', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      vi.mocked(editorService.updateArticle)
        .mockResolvedValueOnce({ ...loaded, version: 4 })
        .mockResolvedValueOnce({ ...loaded, version: 5 })

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })
      await waitFor(() => expect(screen.getByTestId('editor-save-btn')).toBeEnabled())

      await user.click(screen.getByTestId('editor-save-btn'))
      await waitFor(() => expect(editorService.updateArticle).toHaveBeenCalledTimes(1))
      await waitFor(() => expect(screen.getByTestId('editor-save-btn')).toBeEnabled())
      await user.click(screen.getByTestId('editor-save-btn'))
      await waitFor(() => expect(editorService.updateArticle).toHaveBeenCalledTimes(2))

      const calls = vi.mocked(editorService.updateArticle).mock.calls
      expect(calls[0]![1]).toEqual(expect.objectContaining({ version: 3 }))
      expect(calls[1]![1]).toEqual(expect.objectContaining({ version: 4 }))
    })

    it('收到 A0208 時出現確認提示（含警語）', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      vi.mocked(editorService.updateArticle).mockRejectedValue(conflict())
      const confirmSpy = vi.fn().mockReturnValue(false)
      vi.stubGlobal('confirm', confirmSpy)

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })
      await waitFor(() => expect(screen.getByTestId('editor-save-btn')).toBeEnabled())
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => expect(confirmSpy).toHaveBeenCalledWith(CONFLICT_MESSAGE))
      expect(mockShowToast).not.toHaveBeenCalledWith('草稿已儲存', 'success')
    })

    it('選「重新載入」：重抓最新內容、取代本機內容、重置 dirty，之後存檔帶新 version', async () => {
      const latest = { ...loaded, title: '別處改的標題', content: '別處改的內容', version: 9 }
      vi.mocked(editorService.getArticleForEdit)
        .mockResolvedValueOnce(loaded)
        .mockResolvedValueOnce(latest)
      vi.mocked(editorService.updateArticle)
        .mockRejectedValueOnce(conflict())
        .mockResolvedValueOnce({ ...latest, version: 10 })
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })
      await waitFor(() => expect(screen.getByTestId('editor-save-btn')).toBeEnabled())
      await user.clear(screen.getByTestId('editor-title-input'))
      await user.type(screen.getByTestId('editor-title-input'), '我的修改')
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => expect(editorService.getArticleForEdit).toHaveBeenCalledTimes(2))
      await waitFor(() => expect(screen.getByTestId('editor-title-input')).toHaveValue('別處改的標題'))
      expect(mockSetContent).toHaveBeenLastCalledWith('別處改的內容')

      await user.click(screen.getByTestId('editor-save-btn'))
      await waitFor(() => expect(editorService.updateArticle).toHaveBeenCalledTimes(2))
      expect(vi.mocked(editorService.updateArticle).mock.calls[1]![1]).toEqual(
        expect.objectContaining({ version: 9, title: '別處改的標題' }),
      )
    })

    it('選「取消」：不重抓、本機內容保持不變', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      vi.mocked(editorService.updateArticle).mockRejectedValue(conflict())
      const confirmSpy = vi.fn().mockReturnValue(false)
      vi.stubGlobal('confirm', confirmSpy)

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })
      await waitFor(() => expect(screen.getByTestId('editor-save-btn')).toBeEnabled())
      await user.clear(screen.getByTestId('editor-title-input'))
      await user.type(screen.getByTestId('editor-title-input'), '我的修改')
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => expect(confirmSpy).toHaveBeenCalled())
      expect(editorService.getArticleForEdit).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('editor-title-input')).toHaveValue('我的修改')
      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('其他地方被修改'), 'error')
    })

    it('送出審核途中的儲存遇到 A0208 也提示，且不送審', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      vi.mocked(editorService.updateArticle).mockRejectedValue(conflict())
      vi.mocked(myArticlesService.submitForReview).mockResolvedValue({ version: 10 })
      const confirmSpy = vi.fn().mockReturnValue(false)
      vi.stubGlobal('confirm', confirmSpy)

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })
      await waitFor(() => expect(screen.getByTestId('editor-publish-btn')).toBeEnabled())
      await user.click(screen.getByTestId('editor-publish-btn'))

      await waitFor(() => expect(confirmSpy).toHaveBeenCalledWith(CONFLICT_MESSAGE))
      expect(myArticlesService.submitForReview).not.toHaveBeenCalled()
    })

    it('一般儲存失敗仍顯示「儲存失敗」，不跳衝突提示', async () => {
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(loaded)
      vi.mocked(editorService.updateArticle).mockRejectedValue(new Error('網路錯誤'))
      const confirmSpy = vi.fn().mockReturnValue(true)
      vi.stubGlobal('confirm', confirmSpy)

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })
      await waitFor(() => expect(screen.getByTestId('editor-save-btn')).toBeEnabled())
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('儲存失敗', 'error'))
      expect(confirmSpy).not.toHaveBeenCalled()
    })
  })
})
