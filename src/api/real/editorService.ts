import apiClient from '../apiClient'
import type { ArticleFormData, EditorArticle } from '../../types/editor'

export const editorService = {
  async createArticle(data: ArticleFormData): Promise<EditorArticle> {
    return apiClient.post<unknown, EditorArticle>('/api/v1/articles', data)
  },

  async updateArticle(uuid: string, data: ArticleFormData): Promise<EditorArticle> {
    return apiClient.put<unknown, EditorArticle>(`/api/v1/articles/${uuid}`, data)
  },

  async getArticleForEdit(uuid: string): Promise<EditorArticle | null> {
    try {
      return await apiClient.get<unknown, EditorArticle>(`/api/v1/articles/${uuid}`)
    } catch (error) {
      console.error('Failed to fetch article for edit:', error)
      return null
    }
  },
}
