import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createPinia, setActivePinia } from 'pinia'
import EditorView from './EditorView.vue'
import { editorService } from '../api/editorService'
import { categoryService } from '../api/categoryService'
import { fileService } from '../api/fileService'
import { articleVersionService } from '../api/real/articleVersionService'
import type { VersionSummaryResponse, VersionDetailResponse } from '../api/real/articleVersionService'
import { useMarkdownEditor } from '../composables/useMarkdownEditor'
import { createMockEditorArticle } from '../test-utils/factories'
import type { FileUploadResponse } from '../types/editor'

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
vi.mock('../api/fileService')
vi.mock('../api/real/articleVersionService')

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

function mockUploadResponse(overrides: Partial<FileUploadResponse> = {}): FileUploadResponse {
  return {
    id: 'file-1',
    url: 'https://cdn.example.com/a.png',
    width: 100,
    height: 100,
    size: 1024,
    usageType: 'ARTICLE_CONTENT',
    ...overrides,
  }
}

// 讓 useMarkdownEditor mock 的 insertText/setContent 實際模擬 CodeMirror 語意：
// insertText = 於游標（此處末端）插入；setContent = 整份文件覆寫。
// 讓圖片上傳流程（依賴 markdownContent 讀寫）可在測試中被驗證。
function setupMarkdownEditorMock(initialContent = '') {
  const content = ref(initialContent)
  const insertText = vi.fn((text: string) => { content.value += text })
  const setContent = vi.fn((text: string) => { content.value = text })
  vi.mocked(useMarkdownEditor).mockReturnValue({
    editorView: ref(null),
    markdownContent: content,
    wrapSelection: vi.fn(),
    insertText,
    prefixLines: vi.fn(),
    setContent,
    undo: vi.fn(),
    redo: vi.fn(),
  })
  return { content, insertText, setContent }
}

function makeDragEvent(type: string, files: File[]): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', {
    configurable: true,
    value: {
      types: files.length > 0 ? ['Files'] : [],
      files,
    },
  })
  return event
}

function makePasteEvent(files: File[]): Event {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    configurable: true,
    value: {
      items: files.map(f => ({
        kind: 'file',
        type: f.type,
        getAsFile: () => f,
      })),
    },
  })
  return event
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

  // ── Task A：內文圖片上傳 ─────────────────────────────────────────────────
  describe('內文圖片上傳', () => {
    describe('工具列選檔上傳', () => {
      it('選擇單一圖片後呼叫 uploadFile("ARTICLE_CONTENT") 並插入 markdown', async () => {
        vi.mocked(fileService.uploadFile).mockResolvedValue(
          mockUploadResponse({ url: 'https://cdn.example.com/toolbar.png' }),
        )
        const { content } = setupMarkdownEditorMock()
        renderEditor()

        const toolbarInput = document.querySelector('[data-testid="toolbar-image-input"]') as HTMLInputElement
        const user = userEvent.setup()
        const file = new File(['a'], 'toolbar.png', { type: 'image/png' })
        await user.upload(toolbarInput, file)

        await waitFor(() => {
          expect(fileService.uploadFile).toHaveBeenCalledWith(file, 'ARTICLE_CONTENT')
          expect(content.value).toBe('![toolbar.png](https://cdn.example.com/toolbar.png)')
        })
      })

      it('上傳期間先插入「上傳中」佔位文字', async () => {
        let resolveUpload: (v: FileUploadResponse) => void = () => {}
        vi.mocked(fileService.uploadFile).mockImplementation(
          () => new Promise((resolve) => { resolveUpload = resolve }),
        )
        const { content } = setupMarkdownEditorMock()
        renderEditor()

        const toolbarInput = document.querySelector('[data-testid="toolbar-image-input"]') as HTMLInputElement
        const user = userEvent.setup()
        await user.upload(toolbarInput, new File(['a'], 'pending.png', { type: 'image/png' }))

        await waitFor(() => expect(content.value).toContain('上傳中'))
        resolveUpload(mockUploadResponse({ url: 'https://cdn.example.com/pending.png' }))

        await waitFor(() => {
          expect(content.value).toBe('![pending.png](https://cdn.example.com/pending.png)')
        })
      })

      it('多檔選擇時依序上傳並依序插入（先選的先完成插入）', async () => {
        let resolveFirst: (v: FileUploadResponse) => void = () => {}
        vi.mocked(fileService.uploadFile)
          .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
          .mockResolvedValueOnce(mockUploadResponse({ url: 'https://cdn.example.com/b.png' }))
        const { content } = setupMarkdownEditorMock()
        renderEditor()

        const toolbarInput = document.querySelector('[data-testid="toolbar-image-input"]') as HTMLInputElement
        const user = userEvent.setup()
        await user.upload(toolbarInput, [
          new File(['a'], 'a.png', { type: 'image/png' }),
          new File(['b'], 'b.png', { type: 'image/png' }),
        ])

        // 第二個檔案應等第一個完成才開始上傳（sequential，非並行競態）
        await waitFor(() => expect(content.value).toContain('上傳中'))
        expect(fileService.uploadFile).toHaveBeenCalledTimes(1)

        resolveFirst(mockUploadResponse({ url: 'https://cdn.example.com/a.png' }))

        await waitFor(() => {
          expect(fileService.uploadFile).toHaveBeenCalledTimes(2)
          expect(content.value).toContain('a.png')
          expect(content.value).toContain('b.png')
        })
        expect(content.value.indexOf('a.png')).toBeLessThan(content.value.indexOf('b.png'))
      })

      it('上傳失敗時顯示錯誤 toast，且不留下壞掉的佔位文字', async () => {
        vi.mocked(fileService.uploadFile).mockRejectedValue(new Error('上傳逾時'))
        const { content } = setupMarkdownEditorMock()
        renderEditor()

        const toolbarInput = document.querySelector('[data-testid="toolbar-image-input"]') as HTMLInputElement
        const user = userEvent.setup()
        await user.upload(toolbarInput, new File(['a'], 'bad.png', { type: 'image/png' }))

        await waitFor(() => {
          expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('上傳逾時'), 'error')
        })
        expect(content.value).not.toContain('![')
        expect(content.value).not.toContain('上傳中')
      })
    })

    describe('拖曳上傳', () => {
      it('拖曳檔案進入編輯器區域時顯示遮罩提示', async () => {
        setupMarkdownEditorMock()
        renderEditor()
        const pane = screen.getByTestId('editor-textarea')

        pane.dispatchEvent(makeDragEvent('dragenter', [new File(['a'], 'a.png', { type: 'image/png' })]))

        await waitFor(() => {
          expect(screen.getByTestId('editor-drop-overlay')).toBeInTheDocument()
        })
      })

      it('dragleave 後遮罩消失，且不觸發上傳', async () => {
        setupMarkdownEditorMock()
        renderEditor()
        const pane = screen.getByTestId('editor-textarea')
        const file = new File(['a'], 'a.png', { type: 'image/png' })

        pane.dispatchEvent(makeDragEvent('dragenter', [file]))
        await waitFor(() => expect(screen.getByTestId('editor-drop-overlay')).toBeInTheDocument())

        pane.dispatchEvent(makeDragEvent('dragleave', [file]))
        await waitFor(() => expect(screen.queryByTestId('editor-drop-overlay')).not.toBeInTheDocument())

        expect(fileService.uploadFile).not.toHaveBeenCalled()
      })

      it('放開拖放的圖片後呼叫 uploadFile 並插入 markdown，遮罩隱藏', async () => {
        vi.mocked(fileService.uploadFile).mockResolvedValue(
          mockUploadResponse({ url: 'https://cdn.example.com/photo.png' }),
        )
        const { content } = setupMarkdownEditorMock()
        renderEditor()
        const pane = screen.getByTestId('editor-textarea')
        const file = new File(['a'], 'photo.png', { type: 'image/png' })

        pane.dispatchEvent(makeDragEvent('dragenter', [file]))
        pane.dispatchEvent(makeDragEvent('drop', [file]))

        await waitFor(() => {
          expect(fileService.uploadFile).toHaveBeenCalledWith(file, 'ARTICLE_CONTENT')
          expect(content.value).toBe('![photo.png](https://cdn.example.com/photo.png)')
        })
        expect(screen.queryByTestId('editor-drop-overlay')).not.toBeInTheDocument()
      })

      it('拖放非圖片檔案時忽略，不呼叫 uploadFile', async () => {
        setupMarkdownEditorMock()
        renderEditor()
        const pane = screen.getByTestId('editor-textarea')
        const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })

        pane.dispatchEvent(makeDragEvent('drop', [file]))
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(fileService.uploadFile).not.toHaveBeenCalled()
      })
    })

    describe('貼上上傳', () => {
      it('貼上剪貼簿圖片會上傳並插入 markdown', async () => {
        vi.mocked(fileService.uploadFile).mockResolvedValue(
          mockUploadResponse({ url: 'https://cdn.example.com/clip.png' }),
        )
        const { content } = setupMarkdownEditorMock()
        renderEditor()
        const pane = screen.getByTestId('editor-textarea')
        const file = new File(['a'], 'clip.png', { type: 'image/png' })

        pane.dispatchEvent(makePasteEvent([file]))

        await waitFor(() => {
          expect(fileService.uploadFile).toHaveBeenCalledWith(file, 'ARTICLE_CONTENT')
          expect(content.value).toBe('![clip.png](https://cdn.example.com/clip.png)')
        })
      })

      it('貼上非圖片檔案時忽略，不呼叫 uploadFile', async () => {
        setupMarkdownEditorMock()
        renderEditor()
        const pane = screen.getByTestId('editor-textarea')
        const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })

        pane.dispatchEvent(makePasteEvent([file]))
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(fileService.uploadFile).not.toHaveBeenCalled()
      })
    })
  })

  // ── Task B：版本還原接線 ─────────────────────────────────────────────────
  describe('版本還原接線', () => {
    const restoredVersion: VersionSummaryResponse = {
      uuid: 'v-1',
      type: 'MANUAL',
      createdAt: '2026-07-20T10:00:00Z',
      authorId: 1,
      contentLength: 100,
      note: '還原前快照',
    }
    const versionDetail: VersionDetailResponse = {
      uuid: 'v-1',
      type: 'MANUAL',
      createdAt: '2026-07-20T10:00:00Z',
      authorId: 1,
      note: '還原前快照',
      title: '還原後的標題',
      slug: 'restored-title',
      content: '# 還原後的內容',
      status: 'DRAFT',
      summary: '還原後的摘要',
      categoryId: null,
      coverImageUrl: null,
      tags: ['Vue'],
    }

    async function restoreThroughUi(user: ReturnType<typeof userEvent.setup>) {
      await waitFor(() => {
        expect(screen.getByTestId('editor-title-input')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /History/ }))
      await waitFor(() => expect(screen.getByRole('button', { name: /Restore/ })).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: /Restore/ }))
    }

    beforeEach(() => {
      vi.mocked(articleVersionService.list).mockResolvedValue({
        records: [restoredVersion], total: 1, current: 1, size: 20, pages: 1,
      })
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('還原成功後呼叫 getDetail(articleUuid, versionUuid) 取得完整內容', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'edit-uuid' })
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)
      vi.mocked(articleVersionService.restore).mockResolvedValue(undefined)
      vi.mocked(articleVersionService.getDetail).mockResolvedValue(versionDetail)
      setupMarkdownEditorMock()

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })

      await restoreThroughUi(user)

      await waitFor(() => {
        expect(articleVersionService.restore).toHaveBeenCalledWith('edit-uuid', 'v-1')
        expect(articleVersionService.getDetail).toHaveBeenCalledWith('edit-uuid', 'v-1')
      })
    })

    it('取得完整內容後套用到編輯器狀態（title 與 content 真的變了）', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'edit-uuid', title: '還原前標題' })
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)
      vi.mocked(articleVersionService.restore).mockResolvedValue(undefined)
      vi.mocked(articleVersionService.getDetail).mockResolvedValue(versionDetail)
      const { setContent } = setupMarkdownEditorMock()

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })

      await restoreThroughUi(user)

      await waitFor(() => {
        const titleInput = screen.getByTestId('editor-title-input') as HTMLInputElement
        expect(titleInput.value).toBe('還原後的標題')
        expect(setContent).toHaveBeenCalledWith('# 還原後的內容')
      })
    })

    it('套用還原內容後顯示成功提示', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'edit-uuid' })
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)
      vi.mocked(articleVersionService.restore).mockResolvedValue(undefined)
      vi.mocked(articleVersionService.getDetail).mockResolvedValue(versionDetail)
      setupMarkdownEditorMock()

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })

      await restoreThroughUi(user)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('還原'), 'success')
      })
    })

    it('getDetail 失敗時顯示錯誤提示，且明確提醒畫面可能與伺服器不一致', async () => {
      const mockArticle = createMockEditorArticle({ uuid: 'edit-uuid' })
      vi.mocked(editorService.getArticleForEdit).mockResolvedValue(mockArticle)
      vi.mocked(articleVersionService.restore).mockResolvedValue(undefined)
      vi.mocked(articleVersionService.getDetail).mockRejectedValue(new Error('網路錯誤'))
      const { setContent } = setupMarkdownEditorMock()

      const user = userEvent.setup()
      renderEditor({ uuid: 'edit-uuid' })

      // 掛載時 loadArticle() 會先以原內容呼叫一次 setContent（既有行為，與還原無關）
      await waitFor(() => expect(setContent).toHaveBeenCalledTimes(1))

      await restoreThroughUi(user)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.stringMatching(/不一致/),
          'error',
        )
      })
      // getDetail 失敗代表沒有可套用的新內容，setContent 不應該再被多呼叫一次
      expect(setContent).toHaveBeenCalledTimes(1)
    })
  })

  // ── 工具列樣式對接（改用設計系統 .ed-topbar / .ed-btn 等 class） ─────────
  describe('toolbar styling（design system 對接）', () => {
    it('工具列容器使用 .ed-topbar，動作按鈕群包在 .ed-actions 內', () => {
      renderEditor()
      const saveBtn = screen.getByTestId('editor-save-btn')
      expect(saveBtn.closest('.ed-topbar')).toBeInTheDocument()
      expect(saveBtn.closest('.ed-actions')).toBeInTheDocument()
    })

    it('儲存草稿按鈕帶 ed-btn，但不帶 primary（次要層級）', () => {
      renderEditor()
      const saveBtn = screen.getByTestId('editor-save-btn')
      expect(saveBtn).toHaveClass('ed-btn')
      expect(saveBtn).not.toHaveClass('primary')
    })

    it('送出審核按鈕帶 ed-btn primary（主要層級，與儲存草稿有視覺區隔）', () => {
      renderEditor()
      const publishBtn = screen.getByTestId('editor-publish-btn')
      expect(publishBtn).toHaveClass('ed-btn')
      expect(publishBtn).toHaveClass('primary')
    })

    it('Focus 按鈕預設帶 ed-btn，不帶 primary，也不帶作用態 btn--active', () => {
      renderEditor()
      const focusBtn = screen.getByTestId('editor-focus-btn')
      expect(focusBtn).toHaveClass('ed-btn')
      expect(focusBtn).not.toHaveClass('primary')
      expect(focusBtn).not.toHaveClass('btn--active')
    })

    it('開啟 focus mode 後，Focus 按鈕帶上 btn--active 作用態', async () => {
      const user = userEvent.setup()
      renderEditor()
      await user.click(screen.getByTestId('editor-focus-btn'))
      expect(screen.getByTestId('editor-focus-btn')).toHaveClass('btn--active')
    })

    it('標題輸入框使用 .ed-title-input（取代手刻的 .editor-title-input）', () => {
      renderEditor()
      expect(screen.getByTestId('editor-title-input')).toHaveClass('ed-title-input')
    })

    it('字數顯示帶 .ed-status，且不含自動儲存用的 .dot（自動儲存尚未實作，不可造假訊號）', () => {
      renderEditor()
      const wordCount = screen.getByTestId('editor-word-count')
      expect(wordCount).toHaveClass('ed-status')
      expect(wordCount.querySelector('.dot')).not.toBeInTheDocument()
    })

    it('全部既有 data-testid 仍可被選取到（防止改版打斷既有測試的選擇器）', async () => {
      const mockArticle = createMockEditorArticle()
      vi.mocked(editorService.createArticle).mockResolvedValue(mockArticle)
      renderEditor()

      expect(screen.getByTestId('editor-root')).toBeInTheDocument()
      expect(screen.getByTestId('editor-title-input')).toBeInTheDocument()
      expect(screen.getByTestId('editor-word-count')).toBeInTheDocument()
      expect(screen.getByTestId('editor-mode-toggle')).toBeInTheDocument()
      expect(screen.getByTestId('editor-mode-write')).toBeInTheDocument()
      expect(screen.getByTestId('editor-mode-split')).toBeInTheDocument()
      expect(screen.getByTestId('editor-mode-preview')).toBeInTheDocument()
      expect(screen.getByTestId('editor-save-btn')).toBeInTheDocument()
      expect(screen.getByTestId('editor-publish-btn')).toBeInTheDocument()
      expect(screen.getByTestId('editor-focus-btn')).toBeInTheDocument()
      expect(screen.getByTestId('editor-textarea')).toBeInTheDocument()
      expect(screen.getByTestId('editor-preview')).toBeInTheDocument()
    })

    it('全檔不再使用死 class btn--ghost / btn--primary（含浮動 focus bar 的按鈕）', () => {
      const source = readFileSync('src/views/EditorView.vue', 'utf8')
      expect(source).not.toMatch(/btn--ghost/)
      expect(source).not.toMatch(/btn--primary/)
    })

    it('死掉的手刻 class（.editor-meta / .editor-word-count / .editor-title-input）不再出現於檔案中', () => {
      const source = readFileSync('src/views/EditorView.vue', 'utf8')
      expect(source).not.toContain('class="editor-meta"')
      expect(source).not.toContain('class="editor-word-count"')
      expect(source).not.toContain('class="editor-title-input"')
      expect(source).not.toContain('.editor-meta {')
      expect(source).not.toContain('.editor-word-count {')
      expect(source).not.toContain('.editor-title-input {')
    })
  })
})
