import { flushPromises } from '@vue/test-utils'
import { renderWithRouter, createMockPageResult } from '../test-utils'
import ArticleList from './ArticleList.vue'
import { articleService } from '../api/articleService'

vi.mock('../api/articleService', () => ({ articleService: { getArticles: vi.fn() } }))

describe('ArticleList Integration', () => {
  beforeEach(() => {
    vi.mocked(articleService.getArticles).mockResolvedValue(createMockPageResult([], { total: 0, pages: 1 }))
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal('IntersectionObserver', function (this: any) {
      this.observe = vi.fn(); this.disconnect = vi.fn(); this.unobserve = vi.fn()
    })
  })

  it('掛載後一次性取得所有文章（client-side filter 模式，size=1000）', async () => {
    renderWithRouter(ArticleList)
    await flushPromises()
    expect(articleService.getArticles).toHaveBeenCalledWith(1, 1000, '全部', '')
  })
})
