import { flushPromises } from '@vue/test-utils'
import { renderWithRouterAsync } from '../test-utils'
import ArticleDetail from './ArticleDetail.vue'
import { articleService } from '../api/articleService'

vi.mock('../api/articleService', () => ({
  articleService: {
    getArticleByUuid: vi.fn(),
    getArticleBySlug: vi.fn(),
  },
}))

vi.mock('../composables/useMarkdownRenderer', () => ({
  useMarkdownRenderer: vi.fn(() => ({ renderedHtml: { value: '<p>content</p>' }, isReady: { value: true } })),
}))

vi.mock('../composables/useHeadSetup', () => ({ useHeadSetup: vi.fn() }))

describe('ArticleDetail Integration', () => {
  beforeEach(() => {
    vi.mocked(articleService.getArticleByUuid).mockResolvedValue({
      uuid: 'article-uuid-1',
      title: '測試文章',
      content: '# Hello',
      summary: '摘要',
      slug: 'test-article',
      authorNickname: 'Author',
      viewCount: 10,
      likeCount: 5,
      commentCount: 2,
      publishedAt: '2026-01-01',
      tags: ['Vue'],
      coverImageUrl: null,
    })
  })

  it('掛載後以 uuid 呼叫 getArticleByUuid', async () => {
    await renderWithRouterAsync(ArticleDetail, {}, '/articles/article-uuid-1')
    await flushPromises()
    expect(articleService.getArticleByUuid).toHaveBeenCalledWith('article-uuid-1')
  })
})
