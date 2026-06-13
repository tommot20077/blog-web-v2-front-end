import { getArticlesMock, getArticleByUuidMock, getArticleBySlugMock, getArchiveMock } from './articleMockService'

export const articleService = {
  getArticles: getArticlesMock,
  getArticleByUuid: getArticleByUuidMock,
  getArticleBySlug: getArticleBySlugMock,
  getArchive: getArchiveMock,
}
