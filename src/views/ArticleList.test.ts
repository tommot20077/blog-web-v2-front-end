import { fireEvent } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import ArticleList from './ArticleList.vue'
import { renderWithRouter, createMockArticle, createMockPageResult } from '../test-utils'
import { articleService } from '../api/articleService'
import { categoryService } from '../api/categoryService'
import { tagService } from '../api/tagService'

vi.mock('../api/tagService', () => ({
  tagService: { getHotTags: vi.fn() },
}))

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
const mockGetHotTags = vi.mocked(tagService.getHotTags)

// 伺服器端查詢的預設參數（SEC-04 第 2 段：篩選／排序／分頁全交給後端，size = PER_PAGE = 12）
const baseFilters = { tags: [], categorySlugs: [], authorUuids: [], sort: 'latest' }
let ioCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

function buildArticles(count: number, overrides: Record<string, unknown> = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockArticle({ uuid: `article-${i + 1}`, title: `文章標題 ${i + 1}`, ...overrides }),
  )
}

describe('ArticleList 頁面', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
    ioCallback = null
    vi.stubGlobal('IntersectionObserver', function (this: any, cb: any) {
      ioCallback = cb
      this.observe = vi.fn()
      this.disconnect = vi.fn()
      this.unobserve = vi.fn()
    })
    localStorage.clear()
    mockGetArticles.mockReset()
    mockGetHotTags.mockResolvedValue([])
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

      expect(mockGetArticles).toHaveBeenLastCalledWith(1, 12, '全部', '', { ...baseFilters, categorySlugs: ['backend'] })
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

  it('Pages 模式下點頁碼 2 → 向後端請求第 2 頁（伺服器端分頁）', async () => {
    mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(12), { total: 25, pages: 3 }))
    const { getByText } = renderWithRouter(ArticleList)
    await flushPromises()
    await fireEvent.click(getByText('Pages'))
    await flushPromises()

    await fireEvent.click(getByText('2'))
    await flushPromises()

    expect(mockGetArticles).toHaveBeenLastCalledWith(2, 12, '全部', '', baseFilters)
    expect(getByText('2').closest('button')).toHaveClass('active')
  })

  it('點文章卡片上的 tag → 以 slug 送後端，active filters 以名稱顯示', async () => {
    const articles = buildArticles(6, { tags: ['Vue 3', 'TDD'], tagRefs: [{ name: 'Vue 3', slug: 'vue-3' }, { name: 'TDD', slug: 'tdd' }] })
    mockGetArticles.mockResolvedValue(createMockPageResult(articles))
    const { container } = renderWithRouter(ArticleList)
    await flushPromises()

    const vuePill = Array.from(container.querySelectorAll('.mini-tag')).find(
      el => el.textContent?.includes('Vue 3'),
    ) as HTMLElement
    await fireEvent.click(vuePill)
    await flushPromises()

    expect(mockGetArticles).toHaveBeenLastCalledWith(1, 12, '全部', '', { ...baseFilters, tags: ['vue-3'] })
    const activeFilters = container.querySelector('.art-active-filters')
    expect(activeFilters?.textContent).toContain('#Vue 3')
    expect(activeFilters?.textContent).not.toContain('vue-3')
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

  it('Active Filters 顯示已選 tag 並可刪除 → 移除後以空 tags 重新請求', async () => {
    const articles = buildArticles(6, { tags: ['Vue'], tagRefs: [{ name: 'Vue', slug: 'vue' }] })
    mockGetArticles.mockResolvedValue(createMockPageResult(articles))
    const { container } = renderWithRouter(ArticleList)
    await flushPromises()

    await fireEvent.click(container.querySelector('.mini-tag') as HTMLElement)
    await flushPromises()
    await fireEvent.click(container.querySelector('.art-af button') as HTMLElement)
    await flushPromises()

    expect(container.querySelector('.art-af')).toBeNull()
    expect(mockGetArticles).toHaveBeenLastCalledWith(1, 12, '全部', '', baseFilters)
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

  describe('伺服器端篩選／排序／分頁（SEC-04 第 2 段）', () => {
    it('掛載後只請求第 1 頁、size=12（不再 size=1000 拉全量）', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(12), { total: 30, pages: 3 }))
      renderWithRouter(ArticleList)
      await flushPromises()

      expect(mockGetArticles).toHaveBeenCalledTimes(1)
      expect(mockGetArticles).toHaveBeenCalledWith(1, 12, '全部', '', baseFilters)
    })

    it('日期區間 → publishedWithinDays；Any 時不帶', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(2)))
      const { getByText } = renderWithRouter(ArticleList)
      await flushPromises()

      await fireEvent.click(getByText('Last 30'))
      await flushPromises()
      expect(mockGetArticles).toHaveBeenLastCalledWith(1, 12, '全部', '', { ...baseFilters, publishedWithinDays: 30 })

      await fireEvent.click(getByText('Any'))
      await flushPromises()
      expect(mockGetArticles).toHaveBeenLastCalledWith(1, 12, '全部', '', baseFilters)
      expect(mockGetArticles.mock.calls.at(-1)![4]).not.toHaveProperty('publishedWithinDays')
    })

    it('排序 → sort 參數（popular / commented）', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(2)))
      const { getByText } = renderWithRouter(ArticleList)
      await flushPromises()

      await fireEvent.click(getByText('Popular'))
      await flushPromises()
      expect(mockGetArticles).toHaveBeenLastCalledWith(1, 12, '全部', '', { ...baseFilters, sort: 'popular' })

      await fireEvent.click(getByText('Most commented'))
      await flushPromises()
      expect(mockGetArticles).toHaveBeenLastCalledWith(1, 12, '全部', '', { ...baseFilters, sort: 'commented' })
    })

    it('不在瀏覽器端重排：照後端回傳順序顯示', async () => {
      const items = [
        createMockArticle({ uuid: 'x1', title: '舊但後端排前面', viewCount: 1, publishedAt: '2020-01-01' }),
        createMockArticle({ uuid: 'x2', title: '新但後端排後面', viewCount: 999, publishedAt: '2026-01-01' }),
      ]
      mockGetArticles.mockResolvedValue(createMockPageResult(items))
      const { getAllByRole } = renderWithRouter(ArticleList)
      await flushPromises()

      expect(getAllByRole('article').map(a => a.querySelector('h4')?.textContent)).toEqual(['舊但後端排前面', '新但後端排後面'])
    })

    it('頁數與總數取自回應的 pages／total（而非當頁筆數）', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(12), { total: 30, pages: 3 }))
      const { getByText, queryByText, container } = renderWithRouter(ArticleList)
      await flushPromises()
      await fireEvent.click(getByText('Pages'))
      await flushPromises()

      expect(getByText('3')).toBeInTheDocument()
      expect(queryByText('4')).not.toBeInTheDocument()
      expect(container.querySelector('.art-tb-count')?.textContent).toContain('30')
    })

    it('infinite：sentinel 進入視窗 → 請求下一頁並 append，以 uuid 去重', async () => {
      const page1 = buildArticles(12)
      const page2 = [...buildArticles(12).slice(10, 12), ...Array.from({ length: 10 }, (_, i) =>
        createMockArticle({ uuid: `p2-${i}`, title: `第二頁 ${i}` }))]
      mockGetArticles.mockResolvedValueOnce(createMockPageResult(page1, { total: 22, pages: 2 }))
      mockGetArticles.mockResolvedValueOnce(createMockPageResult(page2, { total: 22, pages: 2, current: 2 }))
      const { getAllByRole } = renderWithRouter(ArticleList)
      await flushPromises()
      expect(getAllByRole('article')).toHaveLength(12)

      ioCallback!([{ isIntersecting: true }])
      await flushPromises()

      expect(mockGetArticles).toHaveBeenLastCalledWith(2, 12, '全部', '', baseFilters)
      expect(getAllByRole('article')).toHaveLength(22)
    })

    it('infinite：已載入筆數 >= total 後不再請求', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(5), { total: 5, pages: 1 }))
      renderWithRouter(ArticleList)
      await flushPromises()

      ioCallback!([{ isIntersecting: true }])
      await flushPromises()

      expect(mockGetArticles).toHaveBeenCalledTimes(1)
    })

    it('infinite：載入下一頁進行中，重複觸發不會重複請求', async () => {
      const d = deferred<ReturnType<typeof createMockPageResult<ReturnType<typeof createMockArticle>>>>()
      mockGetArticles.mockResolvedValueOnce(createMockPageResult(buildArticles(12), { total: 30, pages: 3 }))
      mockGetArticles.mockReturnValueOnce(d.promise)
      renderWithRouter(ArticleList)
      await flushPromises()

      ioCallback!([{ isIntersecting: true }])
      ioCallback!([{ isIntersecting: true }])
      await flushPromises()

      expect(mockGetArticles).toHaveBeenCalledTimes(2)
    })

    it('篩選變更 → 清空已載入、回第 1 頁、重新請求', async () => {
      mockGetArticles.mockResolvedValueOnce(createMockPageResult(buildArticles(12), { total: 24, pages: 2 }))
      mockGetArticles.mockResolvedValueOnce(createMockPageResult(
        Array.from({ length: 12 }, (_, i) => createMockArticle({ uuid: `p2-${i}`, title: `第二頁 ${i}` })), { total: 24, pages: 2 }))
      mockGetArticles.mockResolvedValueOnce(createMockPageResult(
        [createMockArticle({ uuid: 'fresh', title: '排序後的文章' })], { total: 1, pages: 1 }))
      const { getByText, getAllByRole } = renderWithRouter(ArticleList)
      await flushPromises()
      ioCallback!([{ isIntersecting: true }])
      await flushPromises()
      expect(getAllByRole('article')).toHaveLength(24)

      await fireEvent.click(getByText('Popular'))
      await flushPromises()

      expect(mockGetArticles).toHaveBeenLastCalledWith(1, 12, '全部', '', { ...baseFilters, sort: 'popular' })
      expect(getAllByRole('article')).toHaveLength(1)
    })

    it('過期回應被丟棄：較早送出的請求較晚回來，不覆蓋最新結果', async () => {
      const slow = deferred<ReturnType<typeof createMockPageResult<ReturnType<typeof createMockArticle>>>>()
      mockGetArticles.mockReturnValueOnce(slow.promise)
      mockGetArticles.mockResolvedValueOnce(createMockPageResult([createMockArticle({ uuid: 'new', title: '最新結果' })]))
      const { getByText, queryByText } = renderWithRouter(ArticleList)
      await flushPromises()

      await fireEvent.click(getByText('Popular'))
      await flushPromises()
      slow.resolve(createMockPageResult([createMockArticle({ uuid: 'old', title: '過期結果' })]))
      await flushPromises()

      expect(getByText('最新結果')).toBeInTheDocument()
      expect(queryByText('過期結果')).not.toBeInTheDocument()
    })

    it('過期的「載入下一頁」回應在篩選變更後被丟棄', async () => {
      const slowMore = deferred<ReturnType<typeof createMockPageResult<ReturnType<typeof createMockArticle>>>>()
      mockGetArticles.mockResolvedValueOnce(createMockPageResult(buildArticles(12), { total: 30, pages: 3 }))
      mockGetArticles.mockReturnValueOnce(slowMore.promise)
      mockGetArticles.mockResolvedValueOnce(createMockPageResult([createMockArticle({ uuid: 'fresh', title: '新篩選結果' })]))
      const { getByText, queryByText } = renderWithRouter(ArticleList)
      await flushPromises()
      ioCallback!([{ isIntersecting: true }])
      await fireEvent.click(getByText('Popular'))
      await flushPromises()
      slowMore.resolve(createMockPageResult([createMockArticle({ uuid: 'stale', title: '過期下一頁' })], { total: 30, pages: 3 }))
      await flushPromises()

      expect(getByText('新篩選結果')).toBeInTheDocument()
      expect(queryByText('過期下一頁')).not.toBeInTheDocument()
    })
  })

  describe('左欄 Tags（熱門標籤）與 #15 連結 slug', () => {
    it('取自 tagService.getHotTags(12)，顯示名稱、連結用 slug（名稱 Vue 3 → /tags/vue-3）', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(1)))
      mockGetHotTags.mockResolvedValue([
        { uuid: 't1', name: 'Vue 3', slug: 'vue-3', articleCount: 9 },
        { uuid: 't2', name: 'TDD', slug: 'tdd', articleCount: 3 },
      ])
      const { container } = renderWithRouter(ArticleList)
      await flushPromises()

      expect(mockGetHotTags).toHaveBeenCalledWith(12)
      const links = Array.from(container.querySelectorAll('.art-tag-grid a')) as HTMLAnchorElement[]
      expect(links.map(a => a.textContent?.trim())).toEqual(['Vue 3', 'TDD'])
      expect(links.map(a => a.getAttribute('href'))).toEqual(['/tags/vue-3', '/tags/tdd'])
    })

    it('不再由已載入文章推導標籤：沒有熱門標籤時不顯示 Tags 區塊', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(3, { tags: ['Vue'] })))
      mockGetHotTags.mockResolvedValue([])
      const { queryByText } = renderWithRouter(ArticleList)
      await flushPromises()

      expect(queryByText('Tags')).not.toBeInTheDocument()
    })
  })

  describe('作者篩選 UI 暫時移除（W4F-b 換上 AuthorMultiSelect）', () => {
    it('不再顯示以 nickname 推導的 Author 區塊', async () => {
      mockGetArticles.mockResolvedValue(createMockPageResult(buildArticles(3, { authorNickname: 'Yuan' })))
      const { queryByText } = renderWithRouter(ArticleList)
      await flushPromises()

      expect(queryByText('Author')).not.toBeInTheDocument()
    })
  })
})
