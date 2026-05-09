import { flushPromises } from '@vue/test-utils'
import { renderWithRouterAsync } from '../test-utils'
import AuthorView from './AuthorView.vue'
import { articleService } from '../api/articleService'
import { createMockArticle, createMockPageResult } from '../test-utils'

vi.mock('../api/articleService', () => ({
  articleService: { getArticles: vi.fn() },
}))

describe('AuthorView', () => {
  beforeEach(() => {
    vi.mocked(articleService.getArticles).mockResolvedValue(
      createMockPageResult([
        createMockArticle({ authorNickname: 'Yuan Luca' }),
        createMockArticle({ authorNickname: 'Yuan Luca', uuid: 'a2' }),
      ]),
    )
  })

  it('顯示作者 handle 標題', async () => {
    const { container } = await renderWithRouterAsync(AuthorView, {}, '/author/yuanluca')
    await flushPromises()
    const heading = container.querySelector('[data-testid="author-name"]')
    expect(heading).toBeInTheDocument()
  })

  it('顯示作者文章列表', async () => {
    const { container } = await renderWithRouterAsync(AuthorView, {}, '/author/yuanluca')
    await flushPromises()
    expect(container.querySelector('[data-testid="author-articles"]')).toBeInTheDocument()
  })
})
