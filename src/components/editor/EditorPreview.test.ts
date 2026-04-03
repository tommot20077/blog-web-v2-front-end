import { ref } from 'vue'
import { render, screen } from '@testing-library/vue'
import EditorPreview from './EditorPreview.vue'

vi.mock('../../composables/useMarkdownRenderer', () => ({
  useMarkdownRenderer: vi.fn(),
}))

import { useMarkdownRenderer } from '../../composables/useMarkdownRenderer'

describe('EditorPreview', () => {
  beforeEach(() => {
    vi.mocked(useMarkdownRenderer).mockImplementation((content) => ({
      renderedHtml: ref(`<p>${content.value}</p>`),
      isReady: ref(true),
    }))
  })

  it('渲染 content prop 對應的 HTML', () => {
    render(EditorPreview, { props: { content: 'Hello World' } })
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('使用 useMarkdownRenderer 渲染', () => {
    render(EditorPreview, { props: { content: '# 標題' } })
    expect(useMarkdownRenderer).toHaveBeenCalled()
  })

  it('content 為空時渲染空內容', () => {
    const { container } = render(EditorPreview, { props: { content: '' } })
    const preview = container.querySelector('[data-testid="preview-content"]')
    expect(preview).toBeInTheDocument()
  })

  it('有 prose class 的容器', () => {
    const { container } = render(EditorPreview, { props: { content: '測試' } })
    const preview = container.querySelector('.prose')
    expect(preview).toBeInTheDocument()
  })
})
