import { ref } from 'vue'
import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createPinia, setActivePinia } from 'pinia'
import EditorView from './EditorView.vue'
import { editorService } from '../api/editorService'
import { categoryService } from '../api/categoryService'
import { myArticlesService } from '../api/myArticlesService'
import { createMockEditorArticle, createMockCategoryOption } from '../test-utils/factories'

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

vi.mock('splitpanes', () => ({
  Splitpanes: { name: 'Splitpanes', template: '<div class="splitpanes"><slot /></div>' },
  Pane: { name: 'Pane', template: '<div class="pane"><slot /></div>' },
}))

vi.mock('../composables/useMarkdownEditor', () => ({
  useMarkdownEditor: vi.fn(() => ({
    editorView: ref(null),
    markdownContent: ref(''),
    wrapSelection: vi.fn(),
    insertText: vi.fn(),
    prefixLines: vi.fn(),
    setContent: vi.fn(),
  })),
}))

vi.mock('../composables/useMarkdownRenderer', () => ({
  useMarkdownRenderer: vi.fn((content) => ({
    renderedHtml: ref(`<p>${content.value}</p>`),
    isReady: ref(true),
  })),
}))

// ── 共用測試資料 ─────────────────────────────────────────────────────────────
const mockCategories = [
  createMockCategoryOption({ id: 'cat-1', name: 'Vue', slug: 'vue' }),
  createMockCategoryOption({ id: 'cat-2', name: 'React', slug: 'react' }),
]

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
    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories)
  })

  // ── 新建模式 ──────────────────────────────────────────────────────────────
  describe('新建模式（無 uuid）', () => {
    it('渲染標題輸入框', async () => {
      renderEditor()
      expect(screen.getByPlaceholderText(/標題/)).toBeInTheDocument()
    })

    it('渲染「儲存草稿」按鈕', () => {
      renderEditor()
      expect(screen.getByText(/儲存草稿/)).toBeInTheDocument()
    })

    it('渲染「送出審核」按鈕', () => {
      renderEditor()
      expect(screen.getByText(/送出審核/)).toBeInTheDocument()
    })

    it('顯示字數計數', () => {
      renderEditor()
      expect(screen.getByText(/0\s*字/)).toBeInTheDocument()
    })

    it('掛載後載入分類列表', async () => {
      renderEditor()
      await waitFor(() => {
        expect(categoryService.getCategories).toHaveBeenCalled()
      })
    })

    it('點擊「儲存草稿」後呼叫 editorService.createArticle', async () => {
      const mockArticle = createMockEditorArticle()
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const user = userEvent.setup()
      renderEditor()

      await user.type(screen.getByPlaceholderText(/標題/), '測試文章')
      await user.click(screen.getByText(/儲存草稿/))

      await waitFor(() => {
        expect(editorService.createArticle).toHaveBeenCalled()
      })
    })

    it('儲存成功後呼叫 showToast 顯示成功訊息', async () => {
      const mockArticle = createMockEditorArticle()
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByText(/儲存草稿/))

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
        const titleInput = screen.getByPlaceholderText(/標題/) as HTMLInputElement
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
        expect(screen.getByPlaceholderText(/標題/)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/儲存草稿/))

      await waitFor(() => {
        expect(editorService.updateArticle).toHaveBeenCalledWith('edit-uuid', expect.any(Object))
        expect(editorService.createArticle).not.toHaveBeenCalled()
      })
    })
  })

  // ── 工具列互動 ─────────────────────────────────────────────────────────────
  describe('工具列', () => {
    it('渲染工具列', () => {
      renderEditor()
      // 工具列含有粗體按鈕
      expect(screen.getByTitle(/粗體/)).toBeInTheDocument()
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
      await user.click(screen.getByText(/送出審核/))

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
      await user.click(screen.getByText(/送出審核/))

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
      await user.click(screen.getByText(/送出審核/))

      await waitFor(() => {
        expect(myArticlesService.submitForReview).toHaveBeenCalled()
      })

      const successCalls = mockShowToast.mock.calls.filter(([, type]) => type === 'success')
      expect(successCalls).toHaveLength(1)
      expect(successCalls[0][0]).toBe('已送出審核')
    })
  })
})
