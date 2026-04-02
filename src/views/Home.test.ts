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

describe('Home 頁面', () => {
  beforeEach(() => {
    vi.mocked(recommendService.getTrending).mockResolvedValue([]);
    vi.mocked(articleService.getArticles).mockResolvedValue({
      records: [], total: 0, size: 6, current: 1, pages: 0,
    });
    vi.mocked(tagService.getHotTags).mockResolvedValue([]);
  })

  it('渲染 HeroMarquee 元件', () => {
    const { getByRole } = renderWithRouter(Home)
    expect(getByRole('heading', { level: 1 })).toBeInTheDocument()
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
