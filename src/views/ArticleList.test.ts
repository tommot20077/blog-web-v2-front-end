import { fireEvent, waitFor } from '@testing-library/vue'
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

function buildArticles(count: number) {
  return Array.from({ length: count }, (_, i) =>
    createMockArticle({ uuid: `article-${i + 1}`, title: `文章標題 ${i + 1}` }),
  )
}

describe('ArticleList 頁面', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
    // IntersectionObserver 必須用 function 宣告（非箭頭函式）才能被 new 呼叫
    vi.stubGlobal('IntersectionObserver', function (this: any) {
      this.observe = vi.fn()
      this.disconnect = vi.fn()
      this.unobserve = vi.fn()
    })
  })

  it('初始載入顯示 loading 動畫', async () => {
    // 讓 getArticles 永遠不 resolve，保持 loading 狀態
    mockGetArticles.mockReturnValue(new Promise(() => {}))

    const { container } = renderWithRouter(ArticleList)

    await flushPromises()

    // loading 狀態顯示 animate-bounce 的圓點 div
    const bounceDots = container.querySelectorAll('[class*="animate-bounce"]')
    expect(bounceDots.length).toBeGreaterThanOrEqual(3)
  })

  it('載入完成顯示文章卡片', async () => {
    const articles = buildArticles(6)
    mockGetArticles.mockResolvedValue(createMockPageResult(articles))

    const { getAllByRole } = renderWithRouter(ArticleList)

    await flushPromises()

    const cards = getAllByRole('article')
    expect(cards).toHaveLength(6)
  })

  it('空結果顯示「沒有找到符合條件的文章。」', async () => {
    mockGetArticles.mockResolvedValue(
      createMockPageResult([], { total: 0, pages: 0 }),
    )

    const { getByText } = renderWithRouter(ArticleList)

    await flushPromises()

    expect(getByText('沒有找到符合條件的文章。')).toBeInTheDocument()
  })

  it('Grid 模式多頁時顯示分頁器按鈕', async () => {
    const articles = buildArticles(6)
    mockGetArticles.mockResolvedValue(
      createMockPageResult(articles, { total: 50, pages: 9 }),
    )

    const { getByText } = renderWithRouter(ArticleList)

    await flushPromises()

    // 應顯示頁碼按鈕與前後箭頭
    expect(getByText('←')).toBeInTheDocument()
    expect(getByText('→')).toBeInTheDocument()
    expect(getByText('1')).toBeInTheDocument()
    expect(getByText('9')).toBeInTheDocument()
  })

  it('點擊第 2 頁按鈕後以 page=2 呼叫 getArticles', async () => {
    const articles = buildArticles(6)
    mockGetArticles.mockResolvedValue(
      createMockPageResult(articles, { total: 50, pages: 9 }),
    )

    const { getByText } = renderWithRouter(ArticleList)

    await flushPromises()

    // 初始 onMounted 呼叫一次
    expect(mockGetArticles).toHaveBeenCalledTimes(1)

    await fireEvent.click(getByText('2'))

    // 點擊第 2 頁後應該再呼叫一次，page=2, size=6
    expect(mockGetArticles).toHaveBeenCalledTimes(2)
    expect(mockGetArticles).toHaveBeenLastCalledWith(2, 6, '全部', '')
  })

  it('第一頁時上一頁按鈕 disabled', async () => {
    const articles = buildArticles(6)
    mockGetArticles.mockResolvedValue(
      createMockPageResult(articles, { total: 50, pages: 9 }),
    )

    const { getByText } = renderWithRouter(ArticleList)

    await flushPromises()

    const prevButton = getByText('←').closest('button')!
    expect(prevButton).toBeDisabled()
  })

  it('點擊分類過濾後以正確的 category 呼叫 getArticles', async () => {
    const articles = buildArticles(6)
    mockGetArticles.mockResolvedValue(
      createMockPageResult(articles, { total: 50, pages: 9 }),
    )

    const { getByText } = renderWithRouter(ArticleList)

    await flushPromises()

    // 點擊 FilterBar 的 Frontend 分類按鈕
    await fireEvent.click(getByText('Frontend'))

    await waitFor(() => {
      expect(mockGetArticles).toHaveBeenLastCalledWith(1, 6, 'Frontend', '')
    })
  })

  it('輸入關鍵字並按 Enter 後以正確 keyword 呼叫 getArticles', async () => {
    const articles = buildArticles(3)
    mockGetArticles.mockResolvedValue(createMockPageResult(articles))

    const { getByPlaceholderText } = renderWithRouter(ArticleList)

    await flushPromises()

    const searchInput = getByPlaceholderText('搜尋文章...')
    await fireEvent.update(searchInput, '前端開發')
    await fireEvent.keyUp(searchInput, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockGetArticles).toHaveBeenLastCalledWith(1, 6, '全部', '前端開發')
    })
  })

  it('切換 List 模式後分頁器消失', async () => {
    const articles = buildArticles(6)
    mockGetArticles.mockResolvedValue(
      createMockPageResult(articles, { total: 50, pages: 9 }),
    )

    const { getByTitle, queryByText } = renderWithRouter(ArticleList)

    await flushPromises()

    // 切換為 list 模式
    await fireEvent.click(getByTitle('無限捲動清單模式'))

    await flushPromises()

    // 分頁器的箭頭按鈕應該消失
    expect(queryByText('←')).not.toBeInTheDocument()
    expect(queryByText('→')).not.toBeInTheDocument()
  })
})
