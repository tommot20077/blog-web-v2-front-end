import { getPendingArticlesMock, getPendingCountMock, publishArticleMock, rejectArticleMock } from './adminMockService'

export const adminService = {
  getPendingArticles: getPendingArticlesMock,
  getPendingCount: getPendingCountMock,
  publishArticle: publishArticleMock,
  rejectArticle: rejectArticleMock,
}
