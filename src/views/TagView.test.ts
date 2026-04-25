import { flushPromises } from '@vue/test-utils'
import { renderWithRouterAsync } from '../test-utils'
import TagView from './TagView.vue'
import { tagService } from '../api/tagService'
import { articleService } from '../api/articleService'
import { createMockArticle, createMockPageResult } from '../test-utils'

vi.mock('../api/tagService', () => ({
  tagService: {
    getHotTags: vi.fn(),
  },
}))
vi.mock('../api/articleService', () => ({
  articleService: { getArticles: vi.fn() },
}))

describe('TagView', () => {
  beforeEach(() => {
    vi.mocked(tagService.getHotTags).mockResolvedValue([
      { uuid: 't1', name: 'vue 3', slug: 'vue-3', articleCount: 22 },
      { uuid: 't2', name: 'tdd', slug: 'tdd', articleCount: 9 },
    ])
    vi.mocked(articleService.getArticles).mockResolvedValue(
      createMockPageResult([createMockArticle({ tags: ['vue 3', 'frontend'] })]),
    )
  })

  it('顯示 tag 名稱標題', async () => {
    const { container } = await renderWithRouterAsync(TagView, {}, '/tags/vue-3')
    await flushPromises()
    const title = container.querySelector('[data-testid="tag-title"]')
    expect(title).toBeInTheDocument()
    expect(title?.textContent).toMatch(/vue[\s-]3/)
  })

  it('顯示文章列表區域', async () => {
    const { container } = await renderWithRouterAsync(TagView, {}, '/tags/vue-3')
    await flushPromises()
    expect(container.querySelector('[data-testid="tag-articles"]')).toBeInTheDocument()
  })

  it('顯示相關標籤', async () => {
    const { container } = await renderWithRouterAsync(TagView, {}, '/tags/vue-3')
    await flushPromises()
    expect(container.querySelector('[data-testid="tag-related"]')).toBeInTheDocument()
  })
})
