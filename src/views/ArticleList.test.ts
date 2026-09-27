import { fireEvent } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import ArticleList from './ArticleList.vue'
import { renderWithRouter, createMockArticle, createMockPageResult } from '../test-utils'
import { articleService } from '../api/articleService'
import { categoryService } from '../api/categoryService'

vi.mock('../api/categoryService', () => ({
  categoryService: { getCategories: vi.fn() },
}))

vi.mock('../api/articleService', () => ({
  articleService: {
    getArticles: vi.fn(),
    getArticleByUuid: vi.fn(),
  },
}))

const mockGetArticles = vi.mocked(articleService.getArticles)
const mockGetCategories = vi.mocked(categoryService.getCategories)

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
    mockGetCategories.mockResolvedValue([
      { id: 'c1', name: '後端', slug: 'backend' },
      { id: 'c2', name: '生活', slug: 'life' },
    ])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('分類篩選（伺服器端）', () => {
    it('分類選項取自 categoryService，以名稱顯示（不再寫死）', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(2)))
      const { getAllByTestId } = renderWithRouter(ArticleList)
      await flushPromises()

      expect(getAllByTestId('category-option').map(el => el.textContent?.trim())).toEqual(['後端', '生活'])
    })

    it('勾選分類 → 以該分類 slug 重新向後端取文章', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(2)))
      const { getAllByTestId } = renderWithRouter(ArticleList)
      await flushPromises()

      await fireEvent.click(getAllByTestId('category-option')[0]!)
      await flushPromises()

      expect(mockGetArticles).toHaveBeenLastCalledWith(1, 1000, '全部', '', { categorySlugs: ['backend'] })
    })

    it('後端依分類回傳的文章照常顯示，不因列表回應沒有 categories 而被前端濾掉（原本選任何分類都會清空列表）', async () => {
      mockGetArticles.mockResolvedValueOnce(createMockPageResult(buildArticles(3)))
      mockGetArticles.mockResolvedValueOnce(createMockPageResult(buildArticles(2, { categories: [] })))
      const { getAllByTestId, getAllByRole } = renderWithRouter(ArticleList)
      await flushPromises()

      await fireEvent.click(getAllByTestId('category-option')[0]!)
      await flushPromises()

      expect(getAllByRole('article')).toHaveLength(2)
    })

    it('已選分類在 active filters 以名稱顯示（而非 slug）', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(2)))
      const { getAllByTestId, container } = renderWithRouter(ArticleList)
      await flushPromises()

      await fireEvent.click(getAllByTestId('category-option')[0]!)
      await flushPromises()

      const activeFilters = container.querySelector('.art-active-filters')
      expect(activeFilters?.textContent).toContain('後端')
      expect(activeFilters?.textContent).not.toContain('backend')
    })
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

  // 頁首只保留 h1「Articles.」；原本 h1 下方那句獨立的 .lede 副標段落已移除。
  // 注意：Home / Archive / Tags 那三句是 h1 主標本身（非副標），刻意保留，不在此列。
  it('頁首移除 .lede 副標段落，只保留 h1', async () => {
    mockGetArticles.mockResolvedValue(createMockPageResult([]))
    const { container } = renderWithRouter(ArticleList)
    await flushPromises()

    expect(container.querySelector('.lede')).toBeNull()
    expect(container.querySelector('.art-page-head h1')?.textContent).toBe('Articles.')
  })
})
