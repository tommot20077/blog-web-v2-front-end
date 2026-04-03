import { render } from '@testing-library/vue'
import EditorPane from './EditorPane.vue'

// useMarkdownEditor 依賴 CodeMirror，在 happy-dom 環境下 mock 掉
vi.mock('../../composables/useMarkdownEditor', () => ({
  useMarkdownEditor: vi.fn(() => ({
    editorView: { value: null },
    markdownContent: { value: '' },
    wrapSelection: vi.fn(),
    insertText: vi.fn(),
    prefixLines: vi.fn(),
    setContent: vi.fn(),
  })),
}))

import { useMarkdownEditor } from '../../composables/useMarkdownEditor'

describe('EditorPane', () => {
  beforeEach(() => {
    vi.mocked(useMarkdownEditor).mockReturnValue({
      editorView: { value: null } as ReturnType<typeof useMarkdownEditor>['editorView'],
      markdownContent: { value: '' } as ReturnType<typeof useMarkdownEditor>['markdownContent'],
      wrapSelection: vi.fn(),
      insertText: vi.fn(),
      prefixLines: vi.fn(),
      setContent: vi.fn(),
    })
  })

  it('渲染 container div 給 CodeMirror 掛載', () => {
    const { container } = render(EditorPane)
    const editorContainer = container.querySelector('[data-testid="editor-container"]')
    expect(editorContainer).toBeInTheDocument()
  })

  it('掛載時呼叫 useMarkdownEditor', () => {
    render(EditorPane)
    expect(useMarkdownEditor).toHaveBeenCalled()
  })

  it('expose wrapSelection 方法', () => {
    const { baseElement } = render(EditorPane)
    expect(baseElement).toBeInTheDocument()
    // EditorPane expose wrapSelection，透過 templateRef 呼叫
    expect(vi.mocked(useMarkdownEditor).mock.results[0].value.wrapSelection).toBeDefined()
  })

  it('expose insertText 方法', () => {
    render(EditorPane)
    expect(vi.mocked(useMarkdownEditor).mock.results[0].value.insertText).toBeDefined()
  })

  it('expose prefixLines 方法', () => {
    render(EditorPane)
    expect(vi.mocked(useMarkdownEditor).mock.results[0].value.prefixLines).toBeDefined()
  })

  it('expose markdownContent ref', () => {
    render(EditorPane)
    expect(vi.mocked(useMarkdownEditor).mock.results[0].value.markdownContent).toBeDefined()
  })
})
