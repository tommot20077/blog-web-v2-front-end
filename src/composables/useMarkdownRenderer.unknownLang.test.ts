/**
 * 未載入語言（```c、```mermaid、```diff ...）不得讓 render 拋錯。
 * 此檔不 mock Shiki：使用真實 highlighter，重現「Shiki 就緒後 md.render 拋錯」的症狀。
 */
import { ref, nextTick } from 'vue'
import { useMarkdownRenderer } from './useMarkdownRenderer'

const UNKNOWN = ['c', 'mermaid', 'diff']

describe('useMarkdownRenderer 未知語言', () => {
  it.each(UNKNOWN)('```%s 區塊在 Shiki 就緒後仍渲染成功並保留程式碼文字', async (lang) => {
    const markdown = ref(`前言\n\n\`\`\`${lang}\nint main_${lang}(void) { return 0; }\n\`\`\`\n`)
    const { renderedHtml, isReady } = useMarkdownRenderer(markdown)

    await vi.waitFor(() => expect(isReady.value).toBe(true), { timeout: 5000 })
    await nextTick()

    expect(renderedHtml.value).toContain('前言')
    expect(renderedHtml.value).toContain(`main_${lang}`)
  })

  it('內容由 A 切到含未知語言的 B 後，renderedHtml 是 B 而非停在 A', async () => {
    const markdown = ref('# 文章A\n\n純文字')
    const { renderedHtml, isReady } = useMarkdownRenderer(markdown)
    await vi.waitFor(() => expect(isReady.value).toBe(true), { timeout: 5000 })

    markdown.value = '# 文章B\n\n```mermaid\ngraph TD; X_node-->Y;\n```\n'
    await nextTick()

    expect(renderedHtml.value).toContain('文章B')
    expect(renderedHtml.value).not.toContain('文章A')
    expect(renderedHtml.value).toContain('X_node')
  })

  it('highlighter 渲染仍失敗時退回無高亮渲染並 console.warn，不停在舊內容', async () => {
    const markdown = ref('# 文章A')
    const { renderedHtml, isReady } = useMarkdownRenderer(markdown)
    await vi.waitFor(() => expect(isReady.value).toBe(true), { timeout: 5000 })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // 強制 Shiki 版 md 失敗：未知語言 + 破壞 fallback 無法在此模擬，改用會讓 md.render 拋錯的輸入替身
    const MarkdownIt = (await import('markdown-it')).default
    const spy = vi.spyOn(MarkdownIt.prototype, 'render').mockImplementationOnce(() => {
      throw new Error('boom')
    })
    markdown.value = '# 文章B'
    await nextTick()
    spy.mockRestore()

    expect(renderedHtml.value).toContain('文章B')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
