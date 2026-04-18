import { computed, ref } from 'vue'
import { render, screen, fireEvent } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import ArticleDetail from './ArticleDetail.vue'
import { createTestRouter, createMockArticleDetail } from '../test-utils'
import { articleService } from '../api/articleService'

vi.mock('../api/articleService', () => ({
  articleService: {
    getArticles: vi.fn(),
    getArticleByUuid: vi.fn(),
  },
}))

vi.mock('../composables/useMarkdownRenderer', () => ({
  useMarkdownRenderer: vi.fn((content: { value: string }) => ({
    renderedHtml: computed(() => `<p>${content.value}</p>`),
    isReady: ref(true),
  })),
}))

vi.mock('../composables/useWordCount', () => ({
  useWordCount: vi.fn(() => ({
    wordCount: computed(() => 100),
    characterCount: computed(() => 500),
    readingTimeMinutes: computed(() => 3),
  })),
}))

async function renderArticleDetail() {
  const router = createTestRouter('/articles/test-uuid')
  await router.isReady()
  const result = render(ArticleDetail, {
    global: { plugins: [router] },
  })
  return { ...result, router }
}

describe('ArticleDetail 頁面', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('載入中顯示「萃取文章細節中...」', async () => {
    vi.mocked(articleService.getArticleByUuid).mockReturnValue(new Promise(() => {}))

    await renderArticleDetail()

    expect(screen.getByText('萃取文章細節中...')).toBeInTheDocument()
  })

  it('成功載入後顯示文章標題、日期、觀看次數與標籤', async () => {
    const mockArticle = createMockArticleDetail({
      title: '我的測試文章',
      publishedAt: '2026-03-21',
      viewCount: 42,
      tags: ['Vue', 'TypeScript'],
    })
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

    await renderArticleDetail()
    await flushPromises()

    expect(screen.getByText('我的測試文章')).toBeInTheDocument()
    expect(screen.getByText('2026-03-21')).toBeInTheDocument()
    expect(screen.getByText('42 觀看次數')).toBeInTheDocument()
    expect(screen.getByText('# Vue')).toBeInTheDocument()
    expect(screen.getByText('# TypeScript')).toBeInTheDocument()
  })

  it('找不到文章時顯示 404 畫面', async () => {
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(null)

    await renderArticleDetail()
    await flushPromises()

    expect(screen.getByText(/找不到該篇文章（404）/)).toBeInTheDocument()
    expect(screen.getByText('🏜️')).toBeInTheDocument()
  })

  it('有瀏覽歷史時，點擊「回列表」呼叫 router.back()', async () => {
    const mockArticle = createMockArticleDetail()
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

    const { router } = await renderArticleDetail()
    await flushPromises()

    const backSpy = vi.spyOn(router, 'back')
    Object.defineProperty(window.history, 'length', { value: 3, writable: true, configurable: true })

    await fireEvent.click(screen.getByText('回列表'))

    expect(backSpy).toHaveBeenCalled()
  })

  it('無瀏覽歷史時，點擊「回列表」導向 /articles', async () => {
    const mockArticle = createMockArticleDetail()
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

    const { router } = await renderArticleDetail()
    await flushPromises()

    const pushSpy = vi.spyOn(router, 'push')
    Object.defineProperty(window.history, 'length', { value: 1, writable: true, configurable: true })

    await fireEvent.click(screen.getByText('回列表'))

    expect(pushSpy).toHaveBeenCalledWith('/articles')
  })

  it('404 頁面點擊「返回列表頁面」導向 /articles', async () => {
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(null)

    const { router } = await renderArticleDetail()
    await flushPromises()

    const pushSpy = vi.spyOn(router, 'push')

    await fireEvent.click(screen.getByText('返回列表頁面'))

    expect(pushSpy).toHaveBeenCalledWith('/articles')
  })

  describe('文章標頭 UI 增強', () => {
    it('有封面圖時顯示 img 元素', async () => {
      const mockArticle = createMockArticleDetail({
        coverImageUrl: 'https://example.com/cover.jpg',
      })
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      const { container } = await renderArticleDetail()
      await flushPromises()

      const img = container.querySelector('[data-testid="article-cover-image"]')
      expect(img).toBeInTheDocument()
    })

    it('coverImageUrl 為 null 時不顯示封面圖', async () => {
      const mockArticle = createMockArticleDetail({ coverImageUrl: null })
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      const { container } = await renderArticleDetail()
      await flushPromises()

      const coverImg = container.querySelector('[data-testid="article-cover-image"]')
      expect(coverImg).not.toBeInTheDocument()
    })

    it('顯示作者暱稱', async () => {
      const mockArticle = createMockArticleDetail({ authorNickname: 'Yuan' })
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      await renderArticleDetail()
      await flushPromises()

      expect(screen.getByText('Yuan')).toBeInTheDocument()
    })

    it('動態閱讀時間使用 useWordCount 回傳值（mock 回傳 3 分鐘）', async () => {
      const mockArticle = createMockArticleDetail()
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      await renderArticleDetail()
      await flushPromises()

      expect(screen.getByText('約 3 分鐘閱讀時間')).toBeInTheDocument()
    })

    it('顯示讚數', async () => {
      const mockArticle = createMockArticleDetail({ likeCount: 42 })
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      const { container } = await renderArticleDetail()
      await flushPromises()

      const likeEl = container.querySelector('[data-testid="like-count"]')
      expect(likeEl).toBeInTheDocument()
      expect(likeEl?.textContent).toContain('42')
    })

    it('顯示留言數', async () => {
      const mockArticle = createMockArticleDetail({ commentCount: 7 })
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      const { container } = await renderArticleDetail()
      await flushPromises()

      const commentEl = container.querySelector('[data-testid="comment-count"]')
      expect(commentEl).toBeInTheDocument()
      expect(commentEl?.textContent).toContain('7')
    })

    it('顯示分類標籤', async () => {
      const mockArticle = createMockArticleDetail({ categories: ['Frontend', 'Vue'] })
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      await renderArticleDetail()
      await flushPromises()

      expect(screen.getByText('Frontend')).toBeInTheDocument()
      expect(screen.getByText('Vue')).toBeInTheDocument()
    })
  })

  describe('返回頂部按鈕', () => {
    it('點擊返回頂部按鈕呼叫 window.scrollTo({ top: 0 })', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      const mockArticle = createMockArticleDetail({ title: '測試文章' })
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      await renderArticleDetail()
      await flushPromises()

      // 找到 article footer 內的返回頂部按鈕（與 E2E 的 'article footer button' 相同定位）
      const endText = screen.getByText('END OF ARTICLE.')
      const footer = endText.closest('footer')!
      const scrollBtn = footer.querySelector('button')!
      expect(scrollBtn).toBeTruthy()

      await fireEvent.click(scrollBtn)

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })
  })
})
