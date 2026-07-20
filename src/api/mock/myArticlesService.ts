import { getMyArticlesMock, deleteMyArticleMock, submitForReviewMock, withdrawArticleMock } from './myArticlesMockService'

export const myArticlesService = {
  getMyArticles: getMyArticlesMock,
  deleteArticle: deleteMyArticleMock,
  submitForReview: submitForReviewMock,
  withdrawArticle: withdrawArticleMock,
}
