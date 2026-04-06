import { waitFor } from '@testing-library/vue'
import { renderWithRouter } from '../test-utils'
import Home from './Home.vue'
import { recommendService } from '../api/recommendService'
import { articleService } from '../api/articleService'
import { tagService } from '../api/tagService'

// mock services
vi.mock('../api/recommendService', () => ({
  recommendService: {
    getTrending: vi.fn(),
  },
}))

vi.mock('../api/articleService', () => ({
  articleService: {
    getArticles: vi.fn(),
  },
}))

vi.mock('../api/tagService', () => ({
  tagService: {
    getHotTags: vi.fn(),
  },
}))

// mock useHeadSetup — 避免 @unhead/vue 在測試環境出問題
vi.mock('../composables/useHeadSetup', () => ({
  useHeadSetup: vi.fn(),
}))

describe('Home 頁面', () => {
  beforeEach(() => {
    vi.mocked(recommendService.getTrending).mockResolvedValue([]);
    vi.mocked(articleService.getArticles).mockResolvedValue({
      records: [], total: 0, size: 6, current: 1, pages: 0,
    });
    vi.mocked(tagService.getHotTags).mockResolvedValue([]);
  })

  it('首頁包含 sr-only h1 標籤，供螢幕閱讀器與爬蟲使用', () => {
    const { container } = renderWithRouter(Home)
    const h1 = container.querySelector('h1.sr-only')
    expect(h1).toBeInTheDocument()
  })

  it('sr-only h1 包含部落格站名', () => {
    const { container } = renderWithRouter(Home)
    const h1 = container.querySelector('h1.sr-only')
    expect(h1?.textContent).toContain('MY BLOG WEB.')
  })

  it('顯示「最新發布」標題', () => {
    const { getByText } = renderWithRouter(Home)
    expect(getByText('最新發布')).toBeInTheDocument()
  })

  it('顯示「熱門文章」標題', () => {
    const { getByText } = renderWithRouter(Home)
    expect(getByText('熱門文章')).toBeInTheDocument()
  })

  it('顯示「主題專區」標題', () => {
    const { getByText } = renderWithRouter(Home)
    expect(getByText('主題專區')).toBeInTheDocument()
  })

  it('顯示「熱門標籤」標題', () => {
    const { getByText } = renderWithRouter(Home)
    expect(getByText('熱門標籤')).toBeInTheDocument()
  })

  it('「查看全部文章 →」連結指向 /articles', () => {
    const { getByText } = renderWithRouter(Home)
    const link = getByText('查看全部文章 →')
    expect(link.closest('a')).toHaveAttribute('href', '/articles')
  })

  it('顯示 3 個主題專區卡片', async () => {
    const { getByText } = renderWithRouter(Home)
    await waitFor(() => {
      expect(getByText('技術')).toBeInTheDocument()
    })
    expect(getByText('旅遊')).toBeInTheDocument()
    expect(getByText('攝影')).toBeInTheDocument()
  })
})
