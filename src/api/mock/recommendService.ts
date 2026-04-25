import { getTrendingMock, getRelatedArticlesMock } from './recommendMockService'

export const recommendService = {
  getTrending: (_period: string = '7d', limit: number = 10) => getTrendingMock(limit),
  getRelatedArticles: getRelatedArticlesMock,
}
