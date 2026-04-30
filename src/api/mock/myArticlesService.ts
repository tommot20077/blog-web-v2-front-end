import { getMyArticlesMock, deleteMyArticleMock, submitForReviewMock } from './myArticlesMockService'

export const myArticlesService = {
  getMyArticles: getMyArticlesMock,
  deleteArticle: deleteMyArticleMock,
  submitForReview: submitForReviewMock,
}
