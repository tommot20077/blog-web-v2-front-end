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
})
