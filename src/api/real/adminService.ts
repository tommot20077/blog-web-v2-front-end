import apiClient from '../apiClient'
import type {
  AdminTagResponse,
  CategoryResponse,
  CreateCategoryRequest,
  EditorArticle,
  MyArticle,
  PageResult,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from '../../types/editor'

export const adminService = {
  async getPendingArticles(page: number, size: number): Promise<PageResult<MyArticle>> {
    return apiClient.get<unknown, PageResult<MyArticle>>(
      '/api/v1/admin/articles/pending',
      { params: { page, size } }
    )
  },

  async getPendingCount(): Promise<number> {
    try {
      const page = await this.getPendingArticles(1, 1)
      return page.total
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

  async createCategory(request: CreateCategoryRequest): Promise<CategoryResponse> {
    return apiClient.post<unknown, CategoryResponse>('/api/v1/admin/categories', request)
  },

  async updateCategory(uuid: string, request: UpdateCategoryRequest): Promise<CategoryResponse> {
    return apiClient.put<unknown, CategoryResponse>(`/api/v1/admin/categories/${uuid}`, request)
  },

  async deleteCategory(uuid: string): Promise<void> {
    return apiClient.delete<unknown, void>(`/api/v1/admin/categories/${uuid}`)
  },

  async updateTag(id: string, request: UpdateTagRequest): Promise<AdminTagResponse> {
    return apiClient.put<unknown, AdminTagResponse>(`/api/v1/admin/tags/${id}`, request)
  },

  async deleteTag(id: string): Promise<void> {
    return apiClient.delete<unknown, void>(`/api/v1/admin/tags/${id}`)
  },

  async reindexSearch(): Promise<void> {
    return apiClient.post<unknown, void>('/api/v1/admin/search/reindex')
  },
}
