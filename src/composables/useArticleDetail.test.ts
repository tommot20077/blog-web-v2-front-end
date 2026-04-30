import { useArticleDetail } from './useArticleDetail'
import { flushPromises } from '@vue/test-utils'
import { articleService } from '../api/articleService'
import { createMockArticleDetail } from '../test-utils'

vi.mock('../api/articleService', () => ({
  articleService: {
    getArticleByUuid: vi.fn(),
  },
}))

describe('useArticleDetail', () => {
  it('初始 isLoading 為 true', () => {
    vi.mocked(articleService.getArticleByUuid).mockReturnValue(new Promise(() => {}))

    const { isLoading } = useArticleDetail('test-uuid')

    expect(isLoading.value).toBe(true)
  })

  it('fetchArticle 成功後 article 有值、isLoading 為 false', async () => {
    const mockArticle = createMockArticleDetail({ uuid: 'test-uuid', title: '測試文章' })
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(mockArticle)

    const { article, isLoading, fetchArticle } = useArticleDetail('test-uuid')

    await fetchArticle()
    await flushPromises()

    expect(article.value).toEqual(mockArticle)
    expect(isLoading.value).toBe(false)
  })

  it('API 回傳 null 時 article 為 null、isLoading 為 false', async () => {
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue(null)

    const { article, isLoading, fetchArticle } = useArticleDetail('not-exist')

    await fetchArticle()
    await flushPromises()

    expect(article.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('API 拋出例外時 article 為 null、isLoading 為 false，且 console.error 被呼叫', async () => {
    vi.mocked(articleService.getArticleByUuid).mockRejectedValue(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { article, isLoading, fetchArticle } = useArticleDetail('error-uuid')

    await fetchArticle()
    await flushPromises()

    expect(article.value).toBeNull()
    expect(isLoading.value).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('Error loading article details', expect.any(Error))
  })
})
