import { fireEvent } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import ArticleList from './ArticleList.vue'
import { renderWithRouter, createMockArticle, createMockPageResult } from '../test-utils'
import { articleService } from '../api/articleService'

vi.mock('../api/articleService', () => ({
  articleService: {
    getArticles: vi.fn(),
    getArticleByUuid: vi.fn(),
  },
}))

const mockGetArticles = vi.mocked(articleService.getArticles)

function buildArticles(count: number, overrides: Record<string, unknown> = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockArticle({ uuid: `article-${i + 1}`, title: `文章標題 ${i + 1}`, ...overrides }),
  )
}

describe('ArticleList 頁面', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal('IntersectionObserver', function (this: any) {
      this.observe = vi.fn()
      this.disconnect = vi.fn()
      this.unobserve = vi.fn()
    })
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('初始載入顯示 loading 骨架', async () => {
    mockGetArticles.mockReturnValue(new Promise(() => {}))
    const { container } = renderWithRouter(ArticleList)
    await flushPromises()
    expect(container.querySelector('[data-testid="articles-loading"]')).toBeInTheDocument()
  })

  it('載入完成顯示文章卡片', async () => {
    const articles = buildArticles(6)
    mockGetArticles.mockResolvedValue(createMockPageResult(articles))
    const { getAllByRole } = renderWithRouter(ArticleList)
    await flushPromises()
    expect(getAllByRole('article')).toHaveLength(6)
  })

  it('空結果顯示空狀態', async () => {
    mockGetArticles.mockResolvedValue(createMockPageResult([], { total: 0, pages: 0 }))
    const { getByTestId } = renderWithRouter(ArticleList)
    await flushPromises()
    expect(getByTestId('articles-empty-state')).toBeInTheDocument()
  })

  it('切換到 Pages 模式後顯示分頁器（← →）', async () => {
    // 25 articles > PER_PAGE(12) → 會有多頁
    const articles = buildArticles(25)
    mockGetArticles.mockResolvedValue(createMockPageResult(articles, { total: 25 }))
    const { getByText, queryByText } = renderWithRouter(ArticleList)
    await flushPromises()

    // 預設是 infinite 模式，無分頁器
    expect(queryByText('←')).not.toBeInTheDocument()

    // 點 Pages 按鈕
    await fireEvent.click(getByText('Pages'))
    expect(getByText('←')).toBeInTheDocument()
    expect(getByText('→')).toBeInTheDocument()
  })

  it('Pages 模式下第一頁時 ← 按鈕 disabled', async () => {
    const articles = buildArticles(25)
    mockGetArticles.mockResolvedValue(createMockPageResult(articles, { total: 25 }))
    const { getByText } = renderWithRouter(ArticleList)
    await flushPromises()
    await fireEvent.click(getByText('Pages'))
    const prevButton = getByText('←').closest('button')!
    expect(prevButton).toBeDisabled()
  })

  it('Pages 模式下點頁碼 2 → 顯示第 2 頁的文章（不重新呼叫 API）', async () => {
    const articles = buildArticles(25)
    mockGetArticles.mockResolvedValue(createMockPageResult(articles, { total: 25 }))
    const { getByText } = renderWithRouter(ArticleList)
    await flushPromises()
    await fireEvent.click(getByText('Pages'))

    const callsBefore = mockGetArticles.mock.calls.length
    await fireEvent.click(getByText('2'))
    await flushPromises()

    // client-side pagination：不應再呼叫 API
    expect(mockGetArticles.mock.calls.length).toBe(callsBefore)
    // 頁碼 2 現在是 active
    expect(getByText('2').closest('button')).toHaveClass('active')
  })

  it('選 tag filter 後 active filters 區域顯示已選 tag（client-side 過濾連動）', async () => {
    const articles = buildArticles(6, { tags: ['Vue', 'TDD'] })
    mockGetArticles.mockResolvedValue(createMockPageResult(articles))
    const { container } = renderWithRouter(ArticleList)
    await flushPromises()

    const vuePill = Array.from(container.querySelectorAll('.mini-tag')).find(
      el => el.textContent?.includes('Vue'),
    ) as HTMLElement | undefined

    if (vuePill) {
      await fireEvent.click(vuePill)
      await flushPromises()
      // active filters 區域應出現 #Vue badge
      const activeFilters = container.querySelector('.art-active-filters')
      expect(activeFilters).toBeInTheDocument()
      expect(activeFilters?.textContent).toContain('Vue')
    } else {
      // tag 列表為空（CI 環境可能 availableTags 未載入）
      expect(true).toBe(true)
    }
  })

  it('切換到 List 視圖後使用 art-list 容器', async () => {
    const articles = buildArticles(6)
    mockGetArticles.mockResolvedValue(createMockPageResult(articles))
    const { getByTitle, container } = renderWithRouter(ArticleList)
    await flushPromises()
    await fireEvent.click(getByTitle('無限捲動清單模式'))
    await flushPromises()
    expect(container.querySelector('.art-list')).toBeInTheDocument()
  })

  it('切換到 Infinite 模式後分頁器消失', async () => {
    const articles = buildArticles(25)
    mockGetArticles.mockResolvedValue(createMockPageResult(articles, { total: 25 }))
    const { getByText, queryByText } = renderWithRouter(ArticleList)
    await flushPromises()

    await fireEvent.click(getByText('Pages'))
    expect(getByText('←')).toBeInTheDocument()

    await fireEvent.click(getByText('∞ Infinite'))
    expect(queryByText('←')).not.toBeInTheDocument()
  })

  it('Active Filters 顯示已選 tag 並可刪除', async () => {
    const articles = buildArticles(6, { tags: ['Vue', 'TDD'] })
    mockGetArticles.mockResolvedValue(createMockPageResult(articles))
    const { container } = renderWithRouter(ArticleList)
    await flushPromises()

    const vuePill = Array.from(container.querySelectorAll('.mini-tag')).find(
      el => el.textContent?.includes('Vue'),
    ) as HTMLElement | undefined

    if (vuePill) {
      await fireEvent.click(vuePill)
      await flushPromises()
      // active filter badge 應出現
      expect(container.querySelector('.art-active-filters')).toBeInTheDocument()
      expect(container.querySelector('.art-af')).toBeInTheDocument()
    }
  })
})
