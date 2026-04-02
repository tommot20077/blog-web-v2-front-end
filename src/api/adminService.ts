import apiClient from './apiClient'
import type { EditorArticle } from '../types/editor'

export const adminService = {
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
