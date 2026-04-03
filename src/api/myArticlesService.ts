import apiClient from './apiClient'
import type { MyArticle, ArticleStatusFilter, PageResult } from '../types/editor'

export const myArticlesService = {
  async getMyArticles(
    status: ArticleStatusFilter,
    page: number,
    size: number
  ): Promise<PageResult<MyArticle>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getMyArticlesMock } = await import('./mock/myArticlesMockService')
      return getMyArticlesMock(status, page, size)
    }
    const params: Record<string, unknown> = { page, size }
    if (status !== 'ALL') params.status = status
    return apiClient.get<unknown, PageResult<MyArticle>>('/api/v1/articles/me', { params })
  },

  async deleteArticle(uuid: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { deleteMyArticleMock } = await import('./mock/myArticlesMockService')
      return deleteMyArticleMock(uuid)
    }
    return apiClient.delete<unknown, void>(`/api/v1/articles/${uuid}`)
  },

  async submitForReview(uuid: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { submitForReviewMock } = await import('./mock/myArticlesMockService')
      return submitForReviewMock(uuid)
    }
    return apiClient.post<unknown, void>(`/api/v1/articles/${uuid}/submit`)
  },
}
