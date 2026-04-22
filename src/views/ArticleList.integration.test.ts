import { fireEvent, waitFor } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { renderWithRouter, createMockPageResult } from '../test-utils'
import ArticleList from './ArticleList.vue'
import { articleService } from '../api/articleService'
import { searchService } from '../api/searchService'

vi.mock('../api/articleService', () => ({ articleService: { getArticles: vi.fn() } }))
vi.mock('../api/searchService', () => ({ searchService: { search: vi.fn() } }))

describe('ArticleList Integration', () => {
  beforeEach(() => {
    vi.mocked(articleService.getArticles).mockResolvedValue(createMockPageResult([], { total: 0, pages: 1 }))
    vi.mocked(searchService.search).mockResolvedValue(createMockPageResult([]))
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

  it('關鍵字搜尋改呼叫 searchService.search（keyword 不送往 getArticles）', async () => {
    const { getByTestId } = renderWithRouter(ArticleList)
    await flushPromises()

    const input = getByTestId('articles-search-input')
    await fireEvent.update(input, 'TypeScript')
    await fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(searchService.search).toHaveBeenCalledWith(expect.objectContaining({ q: 'TypeScript' }))
    })
    expect(vi.mocked(articleService.getArticles).mock.calls.every(call => call[3] === '')).toBe(true)
  })
})
