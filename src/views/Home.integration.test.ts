import { flushPromises } from '@vue/test-utils'
import { renderWithRouter } from '../test-utils'
import Home from './Home.vue'
import { articleService } from '../api/articleService'
import { recommendService } from '../api/recommendService'
import { tagService } from '../api/tagService'

vi.mock('../api/articleService', () => ({ articleService: { getArticles: vi.fn() } }))
vi.mock('../api/recommendService', () => ({ recommendService: { getTrending: vi.fn() } }))
vi.mock('../api/tagService', () => ({ tagService: { getHotTags: vi.fn() } }))
vi.mock('../composables/useHeadSetup', () => ({ useHeadSetup: vi.fn() }))

describe('Home Integration', () => {
  beforeEach(() => {
    vi.mocked(articleService.getArticles).mockResolvedValue({ records: [], total: 0, size: 6, current: 1, pages: 0 })
    vi.mocked(recommendService.getTrending).mockResolvedValue([])
    vi.mocked(tagService.getHotTags).mockResolvedValue([])
  })

  it('掛載後呼叫三個服務', async () => {
    renderWithRouter(Home)
    await flushPromises()
    expect(articleService.getArticles).toHaveBeenCalled()
    expect(recommendService.getTrending).toHaveBeenCalled()
    expect(tagService.getHotTags).toHaveBeenCalled()
  })

  it('getArticles 使用 page=1, size=6（對齊後端 page/size）', async () => {
    renderWithRouter(Home)
    await flushPromises()
    expect(articleService.getArticles).toHaveBeenCalledWith(1, 6, '全部', '')
  })
})
