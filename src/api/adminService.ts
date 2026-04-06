import apiClient from './apiClient'
import type { EditorArticle, MyArticle, PageResult } from '../types/editor'

export const adminService = {
  async getPendingArticles(page: number, size: number): Promise<PageResult<MyArticle>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getPendingArticlesMock } = await import('./mock/adminMockService')
      return getPendingArticlesMock(page, size)
    }
    return apiClient.get<unknown, PageResult<MyArticle>>(
      '/api/v1/admin/articles/pending',
      { params: { page, size } }
    )
  },

  async getPendingCount(): Promise<number> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getPendingCountMock } = await import('./mock/adminMockService')
      return getPendingCountMock()
    }
    try {
      return await apiClient.get<unknown, number>('/api/v1/admin/articles/pending')
    } catch (error) {
      console.error('Failed to get pending count:', error)
      return 0
    }
  },

  async publishArticle(uuid: string): Promise<EditorArticle> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { publishArticleMock } = await import('./mock/adminMockService')
      return publishArticleMock(uuid)
    }
    return apiClient.post<unknown, EditorArticle>(`/api/v1/articles/${uuid}/publish`)
  },

  async rejectArticle(uuid: string, reason: string): Promise<EditorArticle> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { rejectArticleMock } = await import('./mock/adminMockService')
      return rejectArticleMock(uuid, reason)
    }
    return apiClient.post<unknown, EditorArticle>(`/api/v1/articles/${uuid}/reject`, { reason })
  },
}
