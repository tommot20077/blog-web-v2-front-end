import apiClient from './apiClient'
import type { ArticleFormData, EditorArticle } from '../types/editor'

export const editorService = {
  async createArticle(data: ArticleFormData): Promise<EditorArticle> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { createArticleMock } = await import('./mock/editorMockService')
      return createArticleMock(data)
    }
    return apiClient.post<unknown, EditorArticle>('/api/v1/articles', data)
  },

  async updateArticle(uuid: string, data: ArticleFormData): Promise<EditorArticle> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { updateArticleMock } = await import('./mock/editorMockService')
      return updateArticleMock(uuid, data)
    }
    return apiClient.put<unknown, EditorArticle>(`/api/v1/articles/${uuid}`, data)
  },

  async getArticleForEdit(uuid: string): Promise<EditorArticle | null> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getArticleForEditMock } = await import('./mock/editorMockService')
      return getArticleForEditMock(uuid)
    }
    try {
      return await apiClient.get<unknown, EditorArticle>(`/api/v1/articles/${uuid}`)
    } catch (error) {
      console.error('Failed to fetch article for edit:', error)
      return null
    }
  },
}
