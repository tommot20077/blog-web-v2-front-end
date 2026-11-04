import { flushPromises } from '@vue/test-utils'
import { renderWithRouter, createMockPageResult } from '../test-utils'
import ArticleList from './ArticleList.vue'
import { articleService } from '../api/articleService'
import { categoryService } from '../api/categoryService'
import { tagService } from '../api/tagService'

vi.mock('../api/articleService', () => ({ articleService: { getArticles: vi.fn() } }))
vi.mock('../api/categoryService', () => ({ categoryService: { getCategories: vi.fn() } }))
vi.mock('../api/tagService', () => ({ tagService: { getHotTags: vi.fn() } }))

describe('ArticleList Integration', () => {
  beforeEach(() => {
    vi.mocked(articleService.getArticles).mockResolvedValue(createMockPageResult([], { total: 0, pages: 1 }))
    vi.mocked(categoryService.getCategories).mockResolvedValue([])
    vi.mocked(tagService.getHotTags).mockResolvedValue([])
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal('IntersectionObserver', function (this: any) {
      this.observe = vi.fn(); this.disconnect = vi.fn(); this.unobserve = vi.fn()
    })
  })

  it('掛載後只請求第 1 頁（size=12，伺服器端篩選；尚未選任何條件時各篩選為空）', async () => {
    renderWithRouter(ArticleList)
    await flushPromises()
    expect(articleService.getArticles).toHaveBeenCalledWith(
      1, 12, '全部', '', { tags: [], categorySlugs: [], authorUuids: [], sort: 'latest' },
    )
  })
})
