import { flushPromises } from '@vue/test-utils'
import { renderWithRouter, createMockPageResult } from '../test-utils'
import ArticleList from './ArticleList.vue'
import { articleService } from '../api/articleService'
import { categoryService } from '../api/categoryService'

vi.mock('../api/articleService', () => ({ articleService: { getArticles: vi.fn() } }))
vi.mock('../api/categoryService', () => ({ categoryService: { getCategories: vi.fn() } }))

describe('ArticleList Integration', () => {
  beforeEach(() => {
    vi.mocked(articleService.getArticles).mockResolvedValue(createMockPageResult([], { total: 0, pages: 1 }))
    vi.mocked(categoryService.getCategories).mockResolvedValue([])
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal('IntersectionObserver', function (this: any) {
      this.observe = vi.fn(); this.disconnect = vi.fn(); this.unobserve = vi.fn()
    })
  })

  it('掛載後一次性取得所有文章（size=1000；尚未選分類時不帶分類篩選）', async () => {
    renderWithRouter(ArticleList)
    await flushPromises()
    expect(articleService.getArticles).toHaveBeenCalledWith(1, 1000, '全部', '', { categorySlugs: [] })
  })
})
