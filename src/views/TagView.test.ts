import { flushPromises } from '@vue/test-utils'
import { renderWithRouterAsync } from '../test-utils'
import TagView from './TagView.vue'
import { tagService } from '../api/tagService'
import { articleService } from '../api/articleService'
import { createMockArticle, createMockPageResult } from '../test-utils'

vi.mock('../api/tagService', () => ({
  tagService: {
    getHotTags: vi.fn(),
    getTagBySlug: vi.fn(),
    followTag: vi.fn(),
    unfollowTag: vi.fn(),
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
    vi.mocked(tagService.getTagBySlug).mockResolvedValue({
      uuid: 't1', name: 'vue 3', slug: 'vue-3', color: '', icon: '',
      description: '', usageCount: 22, followed: false,
    })
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

  it('getTagBySlug 回 followed=false → FollowButton 顯示 + Follow', async () => {
    const { container } = await renderWithRouterAsync(TagView, {}, '/tags/vue-3')
    await flushPromises()
    const btn = container.querySelector('[data-testid="tag-follow-btn"]')
    expect(btn).toBeInTheDocument()
    expect(btn?.textContent).toContain('Follow')
    expect(btn?.classList.contains('active')).toBe(false)
    expect(btn?.getAttribute('aria-pressed')).toBe('false')
  })

  it('getTagBySlug 回 followed=true → FollowButton 顯示 Following + active', async () => {
    vi.mocked(tagService.getTagBySlug).mockResolvedValue({
      uuid: 't1', name: 'vue 3', slug: 'vue-3', color: '', icon: '',
      description: '', usageCount: 22, followed: true,
    })

    const { container } = await renderWithRouterAsync(TagView, {}, '/tags/vue-3')
    await flushPromises()
    const btn = container.querySelector('[data-testid="tag-follow-btn"]')
    expect(btn).toBeInTheDocument()
    expect(btn?.textContent).toContain('Following')
    expect(btn?.classList.contains('active')).toBe(true)
    expect(btn?.getAttribute('aria-pressed')).toBe('true')
  })
})
