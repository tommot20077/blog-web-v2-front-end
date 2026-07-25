import { ref } from 'vue'
import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createPinia, setActivePinia } from 'pinia'
import EditorView from './EditorView.vue'
import { editorService } from '../api/editorService'
import { categoryService } from '../api/categoryService'
import { useMarkdownEditor } from '../composables/useMarkdownEditor'
import { createMockEditorArticle } from '../test-utils/factories'

// ── Mock vue-router ──────────────────────────────────────────────────────────
const mockRouterReplace = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useRoute: () => ({ params: {} }),
}))

// ── Mock API ──────────────────────────────────────────────────────────────────
vi.mock('../api/editorService')
vi.mock('../api/categoryService')
vi.mock('../api/myArticlesService')

// ── Mock useToast ─────────────────────────────────────────────────────────────
const mockShowToast = vi.fn()
vi.mock('../composables/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

// ── Mock useMarkdownEditor ────────────────────────────────────────────────────
vi.mock('../composables/useMarkdownEditor', () => ({
  useMarkdownEditor: vi.fn(() => ({
    editorView: ref(null),
    markdownContent: ref(''),
    wrapSelection: vi.fn(),
    insertText: vi.fn(),
    prefixLines: vi.fn(),
    setContent: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}))

// ── Mock useMarkdownRenderer ──────────────────────────────────────────────────
vi.mock('../composables/useMarkdownRenderer', () => ({
  useMarkdownRenderer: vi.fn((content: { value: string }) => ({
    renderedHtml: ref(`<p>${content.value}</p>`),
    isReady: ref(true),
  })),
}))

// ── Helper ────────────────────────────────────────────────────────────────────
function renderEditor(props: Record<string, unknown> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return render(EditorView, {
    props,
    global: { plugins: [pinia] },
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('EditorView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouterReplace.mockReset()
  })

  // ── Structure ────────────────────────────────────────────────────────────
  describe('structure', () => {
    it('category service 回傳 undefined 時仍以空陣列渲染 sidebar，不輸出 categories prop warning', async () => {
      vi.mocked(categoryService.getCategories).mockResolvedValue(undefined as never)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      renderEditor()
      await waitFor(() => {
        expect(screen.getByTestId('editor-root')).toBeInTheDocument()
      })

      const warningText = warnSpy.mock.calls.flat().join(' ')
      expect(warningText).not.toContain('Invalid prop: type check failed for prop "categories"')
      warnSpy.mockRestore()
    })

    it('renders editor-root', () => {
      renderEditor()
      expect(screen.getByTestId('editor-root')).toBeInTheDocument()
    })

    it('renders editor-title-input', () => {
      renderEditor()
      expect(screen.getByTestId('editor-title-input')).toBeInTheDocument()
    })

    it('renders editor-save-btn', () => {
      renderEditor()
      expect(screen.getByTestId('editor-save-btn')).toBeInTheDocument()
    })

    it('renders editor-publish-btn', () => {
      renderEditor()
      expect(screen.getByTestId('editor-publish-btn')).toBeInTheDocument()
    })

    it('renders editor-textarea (CodeMirror container)', () => {
      renderEditor()
      expect(screen.getByTestId('editor-textarea')).toBeInTheDocument()
    })

    it('renders editor-preview pane', () => {
      renderEditor()
      expect(screen.getByTestId('editor-preview')).toBeInTheDocument()
    })
  })

  // ── New mode ─────────────────────────────────────────────────────────────
  describe('new mode (no uuid)', () => {
    it('save-btn is enabled by default', () => {
      renderEditor()
      expect(screen.getByTestId('editor-save-btn')).not.toBeDisabled()
    })

    it('clicking save-btn calls editorService.createArticle', async () => {
      const mockArticle = createMockEditorArticle()
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const user = userEvent.setup()
      renderEditor()

      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => {
        expect(editorService.createArticle).toHaveBeenCalled()
      })
    })

    it('shows success toast after save', async () => {
      const mockArticle = createMockEditorArticle()
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('草稿已儲存', 'success')
      })
    })

    it('navigates to /editor/{uuid} after save in new mode', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'new-uuid-123' })
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/editor/new-uuid-123')
      })
    })

    it('clicking publish-btn triggers save then submitForReview', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'pub-uuid' })
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)

      const { myArticlesService } = await import('../api/myArticlesService')
      vi.mocked(myArticlesService.submitForReview).mockResolvedValue(undefined)

      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-publish-btn'))

      await waitFor(() => {
        expect(editorService.createArticle).toHaveBeenCalled()
        expect(myArticlesService.submitForReview).toHaveBeenCalledWith('pub-uuid')
      })
    })
  })

  // ── Edit mode ────────────────────────────────────────────────────────────
  describe('edit mode (with uuid)', () => {
    it('loads article and fills title input on mount', async () => {
      const mockArticle = createMockEditorArticle({
        uuid: 'edit-uuid',
        title: '現有文章標題',
        content: '# Hello',
      })
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)

      renderEditor({ uuid: 'edit-uuid' })

      await waitFor(() => {
        const titleInput = screen.getByTestId('editor-title-input') as HTMLInputElement
        expect(titleInput.value).toBe('現有文章標題')
      })
    })

    it('clicking save-btn calls updateArticle not createArticle', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'edit-uuid', title: '舊標題' })
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)
      vi.mocked(editorService.updateArticle).mockResolvedValue({ ...mockArticle, title: '新標題' })

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

  // ── Error handling ───────────────────────────────────────────────────────
  describe('error handling', () => {
    it('shows error toast when save fails', async () => {
      vi.mocked(editorService.createArticle).mockRejectedValue(new Error('network error'))

      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-save-btn'))

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('儲存失敗', 'error')
      })
    })
  })

  // ── Editor mode switching ───────────────────────────────────────────────
  describe('editor mode switching', () => {
    it('預設（localStorage 無值）render split：editor 與 preview 面板皆可見', () => {
      renderEditor()
      expect(screen.getByTestId('editor-textarea').style.display).not.toBe('none')
      expect(screen.getByTestId('editor-preview').style.display).not.toBe('none')
    })

    it("localStorage = 'write' → 只顯示編輯器，不顯示預覽", () => {
      localStorage.setItem('blog.edMode', 'write')
      renderEditor()
      expect(screen.getByTestId('editor-textarea').style.display).not.toBe('none')
      expect(screen.getByTestId('editor-preview').style.display).toBe('none')
    })

    it("localStorage = 'preview' → 只顯示預覽，不顯示編輯器", () => {
      localStorage.setItem('blog.edMode', 'preview')
      renderEditor()
      expect(screen.getByTestId('editor-textarea').style.display).toBe('none')
      expect(screen.getByTestId('editor-preview').style.display).not.toBe('none')
    })

    it("localStorage = 'split' → 兩個面板皆可見", () => {
      localStorage.setItem('blog.edMode', 'split')
      renderEditor()
      expect(screen.getByTestId('editor-textarea').style.display).not.toBe('none')
      expect(screen.getByTestId('editor-preview').style.display).not.toBe('none')
    })

    it('localStorage 為非法值 → 安全退回 split，不壞掉', () => {
      localStorage.setItem('blog.edMode', 'garbage')
      renderEditor()
      expect(screen.getByTestId('editor-root')).toBeInTheDocument()
      expect(screen.getByTestId('editor-textarea').style.display).not.toBe('none')
      expect(screen.getByTestId('editor-preview').style.display).not.toBe('none')
    })

    it('點擊 Write 段 → 只顯示編輯器並寫入 localStorage', async () => {
      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-mode-write'))

      expect(screen.getByTestId('editor-textarea').style.display).not.toBe('none')
      expect(screen.getByTestId('editor-preview').style.display).toBe('none')
      expect(localStorage.getItem('blog.edMode')).toBe('write')
    })

    it('點擊 Preview 段 → 只顯示預覽並寫入 localStorage', async () => {
      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-mode-preview'))

      expect(screen.getByTestId('editor-textarea').style.display).toBe('none')
      expect(screen.getByTestId('editor-preview').style.display).not.toBe('none')
      expect(localStorage.getItem('blog.edMode')).toBe('preview')
    })

    it('由 write 點擊 Split 段 → 兩面板恢復可見並寫入 localStorage', async () => {
      localStorage.setItem('blog.edMode', 'write')
      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-mode-split'))

      expect(screen.getByTestId('editor-textarea').style.display).not.toBe('none')
      expect(screen.getByTestId('editor-preview').style.display).not.toBe('none')
      expect(localStorage.getItem('blog.edMode')).toBe('split')
    })
  })

  // ── Word count unit switching ───────────────────────────────────────────
  describe('word count unit switching', () => {
    function mockMarkdownContent(text: string) {
      vi.mocked(useMarkdownEditor).mockReturnValue({
        editorView: ref(null),
        markdownContent: ref(text),
        wrapSelection: vi.fn(),
        insertText: vi.fn(),
        prefixLines: vi.fn(),
        setContent: vi.fn(),
        undo: vi.fn(),
        redo: vi.fn(),
      })
    }

    it("wordUnit = 'words' → 字數顯示採 wordCount（單詞數）", () => {
      mockMarkdownContent('hello world')
      localStorage.setItem('blog.settings.wordUnit', 'words')
      renderEditor()
      expect(screen.getByTestId('editor-word-count').textContent).toContain('2')
    })

    it("wordUnit = 'characters'（或未設定）→ 字數顯示採 characterCount（字元數）", () => {
      mockMarkdownContent('hello world')
      localStorage.setItem('blog.settings.wordUnit', 'characters')
      renderEditor()
      expect(screen.getByTestId('editor-word-count').textContent).toContain('10')
    })
  })
})
