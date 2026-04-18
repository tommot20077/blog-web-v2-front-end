import { ref, nextTick } from 'vue'
import { createHighlighter } from 'shiki'
import { fromHighlighter } from '@shikijs/markdown-it'
import { useMarkdownRenderer } from './useMarkdownRenderer'

vi.mock('shiki', () => ({
  createHighlighter: vi.fn(),
}))

vi.mock('@shikijs/markdown-it', () => ({
  fromHighlighter: vi.fn(),
}))

// 全域靜音 console.error，避免 Shiki mock 的非同步噪音
// 個別測試需要驗證 console.error 時再自行處理
const originalConsoleError = console.error
beforeAll(() => {
  console.error = vi.fn()
})
afterAll(() => {
  console.error = originalConsoleError
})

beforeEach(() => {
  vi.mocked(createHighlighter).mockResolvedValue({} as any)
  vi.mocked(fromHighlighter).mockReturnValue((_md: unknown) => {})
  vi.mocked(console.error).mockClear()
})

describe('useMarkdownRenderer', () => {
  it('基礎 Markdown 渲染：# Hello 應產生 <h1> 標籤', () => {
    const content = ref('# Hello')
    const { renderedHtml } = useMarkdownRenderer(content)

    expect(renderedHtml.value).toContain('<h1>')
    expect(renderedHtml.value).toContain('Hello')
  })

  it('XSS 防護：<script> 標籤應被移除', () => {
    const content = ref("<script>alert('xss')</script>")
    const { renderedHtml } = useMarkdownRenderer(content)

    expect(renderedHtml.value).not.toContain('<script>')
    expect(renderedHtml.value).not.toContain('</script>')
  })

  it('允許的 HTML 標籤：iframe 應被保留', () => {
    const content = ref('<iframe src="https://example.com"></iframe>')
    const { renderedHtml } = useMarkdownRenderer(content)

    expect(renderedHtml.value).toContain('<iframe')
    expect(renderedHtml.value).toContain('</iframe>')
  })

  it('任務清單：含 checkbox input', () => {
    const content = ref('- [x] done\n- [ ] todo')
    const { renderedHtml } = useMarkdownRenderer(content)

    expect(renderedHtml.value).toContain('<input')
    expect(renderedHtml.value).toContain('type="checkbox"')
    expect(renderedHtml.value).toContain('checked')
  })

  it('初始狀態：isReady 為 false（Shiki 尚未載入）', () => {
    const content = ref('hello')
    const { isReady } = useMarkdownRenderer(content)

    expect(isReady.value).toBe(false)
  })

  it('Shiki 載入失敗時 graceful degradation：isReady 仍變為 true，console.error 被呼叫', async () => {
    vi.mocked(createHighlighter).mockRejectedValueOnce(new Error('load failed'))

    const content = ref('# test')
    const { isReady, renderedHtml } = useMarkdownRenderer(content)

    // 等待非同步 initShiki 完成
    await vi.waitFor(() => {
      expect(isReady.value).toBe(true)
    })

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Shiki 載入失敗'),
      expect.any(Error),
    )
    // 即使 Shiki 失敗，仍有無高亮的渲染結果
    expect(renderedHtml.value).toContain('<h1>')
  })

  it('內容變更時自動重新渲染', async () => {
    const content = ref('# First')
    const { renderedHtml } = useMarkdownRenderer(content)

    expect(renderedHtml.value).toContain('First')

    content.value = '## Second'
    await nextTick()

    expect(renderedHtml.value).toContain('<h2>')
    expect(renderedHtml.value).toContain('Second')
    expect(renderedHtml.value).not.toContain('First')
  })

  it('空字串不會 crash', () => {
    const content = ref('')
    const { renderedHtml } = useMarkdownRenderer(content)

    expect(renderedHtml.value).toBe('')
  })
})
