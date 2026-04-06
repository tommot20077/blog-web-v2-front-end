import { shallowRef } from 'vue'
import { EditorView } from '@codemirror/view'
import { useMarkdownEditor } from './useMarkdownEditor'

// ── mock CodeMirror 6 ──────────────────────────────────────────────────────
// happy-dom 缺少 MutationObserver 等 DOM API，CM6 無法實例化
// 測試 Vue 層邏輯（reactive sync、wrapSelection 等），不測試 CM6 內部
const mockDispatch = vi.fn()
const mockState = {
  doc: { toString: () => 'initial content', length: 15 },
  selection: { main: { from: 0, to: 7 } },
}

vi.mock('@codemirror/view', () => ({
  EditorView: vi.fn().mockImplementation(() => ({
    state: mockState,
    dispatch: mockDispatch,
    destroy: vi.fn(),
    dom: document.createElement('div'),
  })),
  lineNumbers: vi.fn(() => ({})),
  highlightActiveLine: vi.fn(() => ({})),
  lineWrapping: {},
  keymap: { of: vi.fn(() => ({})) },
}))

vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: vi.fn(() => ({ doc: { toString: () => '' } })),
  },
  Compartment: vi.fn().mockImplementation(() => ({
    of: vi.fn((ext) => ext),
    reconfigure: vi.fn((ext) => ({ effects: [ext] })),
  })),
}))

vi.mock('@codemirror/commands', () => ({
  history: vi.fn(() => ({})),
  undo: vi.fn(),
  redo: vi.fn(),
  defaultKeymap: [],
  historyKeymap: [],
  indentWithTab: {},
}))

vi.mock('@codemirror/lang-markdown', () => ({
  markdown: vi.fn(() => ({})),
}))

vi.mock('@codemirror/language', () => ({
  defaultHighlightStyle: {},
  syntaxHighlighting: vi.fn(() => ({})),
  indentOnInput: vi.fn(() => ({})),
}))

vi.mock('@codemirror/language-data', () => ({
  languages: [],
}))

vi.mock('@lezer/highlight', () => ({
  classHighlighter: {},
}))

// ── tests ──────────────────────────────────────────────────────────────────

describe('useMarkdownEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // mockReset: true 會清除 mockImplementation，每次測試前需重新設定
    // 必須用 function 而非 arrow function，否則 new EditorView() 會報錯
    vi.mocked(EditorView).mockImplementation(function () {
      return {
        state: mockState,
        dispatch: mockDispatch,
        destroy: vi.fn(),
        dom: document.createElement('div'),
      } as unknown as EditorView
    })
  })

  it('containerRef 為 null 時不建立 EditorView', () => {
    const containerRef = shallowRef<HTMLElement | null>(null)
    const { editorView } = useMarkdownEditor(containerRef)
    expect(editorView.value).toBeNull()
  })

  it('提供 markdownContent ref（初始為空字串）', () => {
    const containerRef = shallowRef<HTMLElement | null>(null)
    const { markdownContent } = useMarkdownEditor(containerRef)
    expect(markdownContent.value).toBe('')
  })

  it('editorView 初始為 null', () => {
    const containerRef = shallowRef<HTMLElement | null>(null)
    const { editorView } = useMarkdownEditor(containerRef)
    expect(editorView.value).toBeNull()
  })

  it('提供 wrapSelection 方法', () => {
    const containerRef = shallowRef<HTMLElement | null>(null)
    const { wrapSelection } = useMarkdownEditor(containerRef)
    expect(typeof wrapSelection).toBe('function')
  })

  it('提供 insertText 方法', () => {
    const containerRef = shallowRef<HTMLElement | null>(null)
    const { insertText } = useMarkdownEditor(containerRef)
    expect(typeof insertText).toBe('function')
  })

  it('提供 prefixLines 方法', () => {
    const containerRef = shallowRef<HTMLElement | null>(null)
    const { prefixLines } = useMarkdownEditor(containerRef)
    expect(typeof prefixLines).toBe('function')
  })

  it('提供 setContent 方法', () => {
    const containerRef = shallowRef<HTMLElement | null>(null)
    const { setContent } = useMarkdownEditor(containerRef)
    expect(typeof setContent).toBe('function')
  })

  it('提供 undo 方法', () => {
    const containerRef = shallowRef<HTMLElement | null>(null)
    const { undo } = useMarkdownEditor(containerRef)
    expect(typeof undo).toBe('function')
  })

  it('提供 redo 方法', () => {
    const containerRef = shallowRef<HTMLElement | null>(null)
    const { redo } = useMarkdownEditor(containerRef)
    expect(typeof redo).toBe('function')
  })

  describe('undo — EditorView 存在時', () => {
    it('呼叫 CodeMirror undo command', async () => {
      const { undo: cmUndo } = await import('@codemirror/commands')
      const container = document.createElement('div')
      const containerRef = shallowRef<HTMLElement | null>(container)
      const { undo } = useMarkdownEditor(containerRef)
      containerRef.value = container
      undo()
      expect(cmUndo).toHaveBeenCalled()
    })
  })

  describe('redo — EditorView 存在時', () => {
    it('呼叫 CodeMirror redo command', async () => {
      const { redo: cmRedo } = await import('@codemirror/commands')
      const container = document.createElement('div')
      const containerRef = shallowRef<HTMLElement | null>(container)
      const { redo } = useMarkdownEditor(containerRef)
      containerRef.value = container
      redo()
      expect(cmRedo).toHaveBeenCalled()
    })
  })

  describe('wrapSelection — EditorView 存在時', () => {
    it('呼叫 editorView.dispatch', () => {
      const container = document.createElement('div')
      const containerRef = shallowRef<HTMLElement | null>(container)
      const { wrapSelection } = useMarkdownEditor(containerRef)
      // 手動觸發 containerRef 更新以讓 EditorView 初始化
      containerRef.value = container
      wrapSelection('**', '**')
      expect(mockDispatch).toHaveBeenCalled()
    })
  })

  describe('insertText — EditorView 存在時', () => {
    it('呼叫 editorView.dispatch', () => {
      const container = document.createElement('div')
      const containerRef = shallowRef<HTMLElement | null>(container)
      const { insertText } = useMarkdownEditor(containerRef)
      containerRef.value = container
      insertText('## 標題\n\n')
      expect(mockDispatch).toHaveBeenCalled()
    })
  })

  describe('prefixLines — EditorView 存在時', () => {
    it('呼叫 editorView.dispatch', () => {
      const container = document.createElement('div')
      const containerRef = shallowRef<HTMLElement | null>(container)
      const { prefixLines } = useMarkdownEditor(containerRef)
      containerRef.value = container
      prefixLines('> ')
      expect(mockDispatch).toHaveBeenCalled()
    })
  })
})
