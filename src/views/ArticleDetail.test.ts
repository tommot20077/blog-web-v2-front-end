import { computed, ref } from 'vue'
import { render, screen, fireEvent } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import ArticleDetail from './ArticleDetail.vue'
import { createTestRouter, createMockArticleDetail } from '../test-utils'
import { articleService } from '../api/articleService'
import type { ArticleCategory } from '../api/real/articleService'

const { mockUsePersistedReadingProgress } = vi.hoisted(() => ({
  mockUsePersistedReadingProgress: vi.fn(),
}))

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

vi.mock('../composables/useArticleLike', () => ({
  useArticleLike: vi.fn((_uuid: unknown, initial: { liked: boolean; likeCount: number }) => ({
    liked: ref(initial.liked),
    likeCount: ref(initial.likeCount),
    isPending: ref(false),
    toggle: vi.fn(),
  })),
}))

vi.mock('../composables/useArticleBookmark', () => ({
  useArticleBookmark: vi.fn((_uuid: unknown, initial: { bookmarked: boolean }) => ({
    bookmarked: ref(initial.bookmarked),
    isPending: ref(false),
    toggle: vi.fn(),
  })),
}))

vi.mock('../composables/usePersistedReadingProgress', () => ({
  usePersistedReadingProgress: mockUsePersistedReadingProgress,
}))

vi.mock('../composables/useComments', () => ({
  useComments: vi.fn(() => ({
    list: ref([]),
    totalCommentCount: ref(0),
    totalTopLevels: ref(0),
    page: ref(1),
    sort: ref('newest'),
    isLoading: ref(false),
    fetchPage: vi.fn(),
    post: vi.fn(),
    reply: vi.fn(),
    edit: vi.fn(),
    remove: vi.fn(),
  })),
}))

vi.mock('../composables/useRelatedArticles', () => ({
  useRelatedArticles: vi.fn(() => ({
    articles: ref([]),
    isLoading: ref(false),
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
    mockUsePersistedReadingProgress.mockClear()
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

    const { container } = await renderArticleDetail()
    await flushPromises()

    expect(container.querySelector('[data-testid="article-title"]')).toHaveTextContent('我的測試文章')
    expect(container.querySelector('[data-testid="article-date"]')).toHaveTextContent('2026-03-21')
    expect(screen.getByText('42 觀看次數')).toBeInTheDocument()
    const tagsEl = container.querySelector('[data-testid="article-tags"]')
    expect(tagsEl).toBeInTheDocument()
    expect(tagsEl?.textContent).toContain('Vue')
    expect(tagsEl?.textContent).toContain('TypeScript')
  })

  it('找不到文章時直接顯示「找不到這一頁。」而不依賴路由跳轉', async () => {
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(null)

    const { getByText } = await renderArticleDetail()
    await flushPromises()

    expect(getByText('找不到這一頁。')).toBeInTheDocument()
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

  it('找不到文章時不顯示文章內容，只顯示載入中動畫', async () => {
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(null)

    const { container } = await renderArticleDetail()
    // 在載入中狀態，不應該看到文章 root
    let articleRoot = container.querySelector('[data-testid="article-root"]')
    expect(articleRoot).not.toBeInTheDocument()

    // watchEffect 會觸發重導，不會顯示文章內容
    await flushPromises()
    articleRoot = container.querySelector('[data-testid="article-root"]')
    expect(articleRoot).not.toBeInTheDocument()
  })

  it('將文章 UUID 與本地閱讀進度傳入持久化 composable', async () => {
    const mockArticle = createMockArticleDetail({ uuid: 'article-uuid' })
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

    await renderArticleDetail()
    await flushPromises()

    expect(mockUsePersistedReadingProgress).toHaveBeenCalledOnce()
    const [uuidRef, progressRef] = mockUsePersistedReadingProgress.mock.calls[0]
    expect(uuidRef.value).toBe('article-uuid')
    expect(progressRef.value).toBe(0)
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

      const { container } = await renderArticleDetail()
      await flushPromises()

      const authorEl = container.querySelector('[data-testid="article-author"]')
      expect(authorEl).toBeInTheDocument()
      expect(authorEl?.textContent).toContain('Yuan')
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

      const likeEl = container.querySelector('[data-testid="article-like-footer-count"]')
      expect(likeEl).toBeInTheDocument()
      expect(likeEl?.textContent).toContain('42')
    })

    it('文章已收藏時 action rail 顯示 active bookmark', async () => {
      const mockArticle = createMockArticleDetail({ bookmarked: true })
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      const { container } = await renderArticleDetail()
      await flushPromises()

      const bookmarkBtn = container.querySelector('[data-testid="article-bookmark-action-bar"]')
      expect(bookmarkBtn).toBeInTheDocument()
      expect(bookmarkBtn).toHaveClass('active')
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
      const categories: ArticleCategory[] = [
        { uuid: 'cat-1', name: 'Frontend', slug: 'frontend' },
        { uuid: 'cat-2', name: 'Vue', slug: 'vue' },
      ]
      const mockArticle = createMockArticleDetail({ categories })
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      await renderArticleDetail()
      await flushPromises()

      expect(screen.getByText('Frontend')).toBeInTheDocument()
      expect(screen.getByText('Vue')).toBeInTheDocument()
    })

    it('article-root data-testid 存在', async () => {
      const mockArticle = createMockArticleDetail()
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      const { container } = await renderArticleDetail()
      await flushPromises()

      expect(container.querySelector('[data-testid="article-root"]')).toBeInTheDocument()
    })

    it('article-body data-testid 存在且含有渲染內容', async () => {
      const mockArticle = createMockArticleDetail({ content: 'hello world' })
      vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

      const { container } = await renderArticleDetail()
      await flushPromises()

      const bodyEl = container.querySelector('[data-testid="article-body"]')
      expect(bodyEl).toBeInTheDocument()
      expect(bodyEl?.innerHTML).toContain('hello world')
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
