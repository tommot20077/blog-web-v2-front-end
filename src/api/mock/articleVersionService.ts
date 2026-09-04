import { listArticleVersionsMock, restoreArticleVersionMock } from './articleVersionMockService'

export const articleVersionService = {
  list: listArticleVersionsMock,
  restore: restoreArticleVersionMock,
}
