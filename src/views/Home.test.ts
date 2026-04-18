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

  it('renders trending section (data-testid="trending-root")', () => {
    const { container } = renderWithRouter(Home)
    expect(container.querySelector('[data-testid="trending-root"]')).toBeInTheDocument()
  })

  it('renders latest articles section (data-testid="latest-root")', () => {
    const { container } = renderWithRouter(Home)
    expect(container.querySelector('[data-testid="latest-root"]')).toBeInTheDocument()
  })

  it('renders hot tags section (data-testid="hot-tags-root")', () => {
    const { container } = renderWithRouter(Home)
    expect(container.querySelector('[data-testid="hot-tags-root"]')).toBeInTheDocument()
  })

  it('does not render zone entry section', () => {
    const { container } = renderWithRouter(Home)
    expect(container.querySelector('[data-testid="zone-entry-root"]')).not.toBeInTheDocument()
  })
})
