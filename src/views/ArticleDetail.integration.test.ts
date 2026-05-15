import { ref } from 'vue'
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
      categories: [],
      liked: false,
      bookmarked: false,
    })
  })

  it('掛載後以 uuid 呼叫 getArticleByUuid', async () => {
    await renderWithRouterAsync(ArticleDetail, {}, '/articles/article-uuid-1')
    await flushPromises()
    expect(articleService.getArticleByUuid).toHaveBeenCalledWith('article-uuid-1')
  })
})
