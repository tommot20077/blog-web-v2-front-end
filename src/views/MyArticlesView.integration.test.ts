import { flushPromises } from '@vue/test-utils'
import { renderWithRouter, createMockPageResult, createMockMyArticle } from '../test-utils'
import MyArticlesView from './MyArticlesView.vue'
import { myArticlesService } from '../api/myArticlesService'

vi.mock('../api/myArticlesService')
vi.mock('../composables/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

describe('MyArticlesView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(myArticlesService.getMyArticles).mockResolvedValue(
      createMockPageResult([createMockMyArticle({ status: 'DRAFT' })])
    )
    vi.mocked(myArticlesService.deleteArticle).mockResolvedValue(undefined)
    vi.mocked(myArticlesService.submitForReview).mockResolvedValue(undefined)
  })

  it('掛載後以 status=ALL, page=1, size=10 呼叫 getMyArticles', async () => {
    renderWithRouter(MyArticlesView, {}, '/my-articles')
    await flushPromises()
    expect(myArticlesService.getMyArticles).toHaveBeenCalledWith('ALL', 1, 10)
  })
})
