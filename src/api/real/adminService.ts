import apiClient from '../apiClient'
import type { EditorArticle, MyArticle, PageResult } from '../../types/editor'

export const adminService = {
  async getPendingArticles(page: number, size: number): Promise<PageResult<MyArticle>> {
    return apiClient.get<unknown, PageResult<MyArticle>>(
      '/api/admin/articles/pending',
      { params: { page, size } }
    )
  },

  async getPendingCount(): Promise<number> {
    try {
      const result = await adminService.getPendingArticles(1, 1)
      return result.total
    } catch (error) {
      console.error('Failed to get pending count:', error)
      return 0
    }
  },

  async publishArticle(uuid: string): Promise<EditorArticle> {
    return apiClient.post<unknown, EditorArticle>(`/api/v1/articles/${uuid}/publish`)
  },

  async rejectArticle(uuid: string, reason: string): Promise<EditorArticle> {
    return apiClient.post<unknown, EditorArticle>(`/api/v1/articles/${uuid}/reject`, { reason })
  },
}
