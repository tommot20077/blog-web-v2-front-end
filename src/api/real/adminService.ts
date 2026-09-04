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
import type { SearchIndexStatus } from '../../types/search'

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

  /**
   * 取得完整分類清單（含 description、sortOrder），不收窄後端欄位。
   * 供 admin 分類管理頁使用；一般編輯器仍應使用 categoryService.getCategories()。
   */
  async getCategoriesFull(): Promise<CategoryResponse[]> {
    return apiClient.get<unknown, CategoryResponse[]>('/api/v1/categories')
  },

  /**
   * 取得完整標籤清單（含 color、icon、description、usageCount），不收窄後端欄位。
   * 供 admin 標籤管理頁使用；一般呼叫端仍應使用 tagService.getAllTags()。
   */
  async getTagsFull(): Promise<AdminTagResponse[]> {
    return apiClient.get<unknown, AdminTagResponse[]>('/api/v1/tags/all')
  },

  /**
   * 取得搜尋索引狀態（文件數、最後重建時間、健康狀態）。
   * ES 不可達時後端回傳 healthy=false、documentCount=null，本方法原樣映射，不吞錯。
   */
  async getSearchStatus(): Promise<SearchIndexStatus> {
    return apiClient.get<unknown, SearchIndexStatus>('/api/v1/admin/search/status')
  },
}
