import { createArticleMock, updateArticleMock, getArticleForEditMock } from './editorMockService'

export const editorService = {
  createArticle: createArticleMock,
  updateArticle: updateArticleMock,
  getArticleForEdit: getArticleForEditMock,
}
