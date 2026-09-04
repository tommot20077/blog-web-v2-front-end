import { mount } from '@vue/test-utils'
import { defineComponent, shallowRef, type ShallowRef } from 'vue'
import { EditorView } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
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
  languages: [{ name: 'heavy-language-data-sentinel' }],
}))

vi.mock('@lezer/highlight', () => ({
  classHighlighter: {},
}))

// ── tests ──────────────────────────────────────────────────────────────────

type MarkdownEditorState = ReturnType<typeof useMarkdownEditor> & {
  containerRef: ShallowRef<HTMLElement | null>
}

function mountHarness(initialContainer: HTMLElement | null = null) {
  const state = {} as MarkdownEditorState
  const Wrapper = defineComponent({
    setup() {
      const containerRef = shallowRef<HTMLElement | null>(initialContainer)
      Object.assign(state, { containerRef, ...useMarkdownEditor(containerRef) })
      return state
    },
    template: '<div />',
  })

  const wrapper = mount(Wrapper)
  return { wrapper, state }
}

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
    const { state } = mountHarness()
    expect(state.editorView.value).toBeNull()
  })

  it('提供 markdownContent ref（初始為空字串）', () => {
    const { state } = mountHarness()
    expect(state.markdownContent.value).toBe('')
  })

  it('editorView 初始為 null', () => {
    const { state } = mountHarness()
    expect(state.editorView.value).toBeNull()
  })

  it('不把完整 CodeMirror language-data 傳進 markdown editor chunk', () => {
    const container = document.createElement('div')

    mountHarness(container)

    expect(markdown).toHaveBeenCalledWith({ codeLanguages: [] })
  })

  it('提供 wrapSelection 方法', () => {
    const { state } = mountHarness()
    expect(typeof state.wrapSelection).toBe('function')
  })

  it('提供 insertText 方法', () => {
    const { state } = mountHarness()
    expect(typeof state.insertText).toBe('function')
  })

  it('提供 prefixLines 方法', () => {
    const { state } = mountHarness()
    expect(typeof state.prefixLines).toBe('function')
  })

  it('提供 replaceRange 方法', () => {
    const { state } = mountHarness()
    expect(typeof state.replaceRange).toBe('function')
  })

  it('提供 setContent 方法', () => {
    const { state } = mountHarness()
    expect(typeof state.setContent).toBe('function')
  })

  it('提供 undo 方法', () => {
    const { state } = mountHarness()
    expect(typeof state.undo).toBe('function')
  })

  it('提供 redo 方法', () => {
    const { state } = mountHarness()
    expect(typeof state.redo).toBe('function')
  })

  describe('undo — EditorView 存在時', () => {
    it('呼叫 CodeMirror undo command', async () => {
      const { undo: cmUndo } = await import('@codemirror/commands')
      const container = document.createElement('div')
      const { state } = mountHarness(container)
      state.undo()
      expect(cmUndo).toHaveBeenCalled()
    })
  })

  describe('redo — EditorView 存在時', () => {
    it('呼叫 CodeMirror redo command', async () => {
      const { redo: cmRedo } = await import('@codemirror/commands')
      const container = document.createElement('div')
      const { state } = mountHarness(container)
      state.redo()
      expect(cmRedo).toHaveBeenCalled()
    })
  })

  describe('wrapSelection — EditorView 存在時', () => {
    it('呼叫 editorView.dispatch', () => {
      const container = document.createElement('div')
      const { state } = mountHarness(container)
      state.wrapSelection('**', '**')
      expect(mockDispatch).toHaveBeenCalled()
    })
  })

  describe('insertText — EditorView 存在時', () => {
    it('呼叫 editorView.dispatch', () => {
      const container = document.createElement('div')
      const { state } = mountHarness(container)
      state.insertText('## 標題\n\n')
      expect(mockDispatch).toHaveBeenCalled()
    })
  })

  describe('replaceRange — EditorView 存在時', () => {
    it('以局部 range 取代命中的文字，游標留在取代後文字之後（不整份覆寫、不把游標帶到文末）', () => {
      const container = document.createElement('div')
      const { state } = mountHarness(container)

      const replaced = state.replaceRange('initial', '![a.png](url)')

      expect(replaced).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: { from: 0, to: 7, insert: '![a.png](url)' },
        selection: { anchor: 13 },
      })
      expect(state.markdownContent.value).toBe('![a.png](url) content')
    })

    it('文件中找不到目標文字時不 dispatch，回傳 false', () => {
      const container = document.createElement('div')
      const { state } = mountHarness(container)

      const replaced = state.replaceRange('不存在的佔位文字', 'x')

      expect(replaced).toBe(false)
      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })

  describe('prefixLines — EditorView 存在時', () => {
    it('呼叫 editorView.dispatch', () => {
      const container = document.createElement('div')
      const { state } = mountHarness(container)
      state.prefixLines('> ')
      expect(mockDispatch).toHaveBeenCalled()
    })
  })
})
