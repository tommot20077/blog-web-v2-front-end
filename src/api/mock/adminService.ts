import {
  createCategoryMock,
  deleteCategoryMock,
  deleteTagMock,
  getPendingArticlesMock,
  getPendingCountMock,
  publishArticleMock,
  reindexSearchMock,
  rejectArticleMock,
  updateCategoryMock,
  updateTagMock,
} from './adminMockService'

export const adminService = {
  getPendingArticles: getPendingArticlesMock,
  getPendingCount: getPendingCountMock,
  publishArticle: publishArticleMock,
  rejectArticle: rejectArticleMock,
  createCategory: createCategoryMock,
  updateCategory: updateCategoryMock,
  deleteCategory: deleteCategoryMock,
  updateTag: updateTagMock,
  deleteTag: deleteTagMock,
  reindexSearch: reindexSearchMock,
}
