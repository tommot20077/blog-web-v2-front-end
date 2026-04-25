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

  it('掛載後以 page=1, size=6 呼叫 getArticles', async () => {
    renderWithRouter(ArticleList)
    await flushPromises()
    expect(articleService.getArticles).toHaveBeenCalledWith(1, 6, '全部', '')
  })
})
