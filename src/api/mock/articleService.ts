import { getArticlesMock, getArticleByUuidMock, getArticleBySlugMock } from './articleMockService'

export const articleService = {
  getArticles: getArticlesMock,
  getArticleByUuid: getArticleByUuidMock,
  getArticleBySlug: getArticleBySlugMock,
}
