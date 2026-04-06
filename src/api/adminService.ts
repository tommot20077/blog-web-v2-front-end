import apiClient from './apiClient'
import { mapPageResult } from './utils'
import type { BackendPageResult } from './utils'
import type {
  EditorArticle,
  MyArticle,
  PendingArticle,
  PageResult,
  ArticleStatus,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryResponse,
  UpdateTagRequest,
} from '../types/editor'

interface BackendPendingArticle {
  uuid: string
  title: string
  summary: string
  coverImageUrl: string | null
  status: ArticleStatus
  tags: { id: string; name: string; slug: string }[]
  rejectReason: string | null
  createdAt: string
  updatedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  authorNickname: string
}

function mapPendingArticle(raw: BackendPendingArticle): PendingArticle {
  return {
    uuid: raw.uuid,
    title: raw.title,
    summary: raw.summary,
    coverImageUrl: raw.coverImageUrl,
    status: raw.status,
    tags: raw.tags.map(t => t.name),
    rejectReason: raw.rejectReason,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    viewCount: raw.viewCount,
    likeCount: raw.likeCount,
    commentCount: raw.commentCount,
    authorNickname: raw.authorNickname,
  }
}

export const adminService = {
  async getPendingArticles(page: number, size: number): Promise<PageResult<PendingArticle>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getPendingArticlesMock } = await import('./mock/adminMockService')
      return getPendingArticlesMock(page, size)
    }
    try {
      const data = await apiClient.get<unknown, BackendPageResult<BackendPendingArticle>>(
        '/api/v1/admin/articles/pending',
        { params: { page, size } }
      )
      return mapPageResult(data, mapPendingArticle)
    } catch (error) {
      console.error('Failed to fetch pending articles:', error)
      return { records: [], total: 0, current: page, size, pages: 0 }
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

  async createCategory(data: CreateCategoryRequest): Promise<CategoryResponse> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { createCategoryMock } = await import('./mock/adminMockService')
      return createCategoryMock(data)
    }
    return apiClient.post<unknown, CategoryResponse>('/api/v1/admin/categories', data)
  },

  async updateCategory(uuid: string, data: UpdateCategoryRequest): Promise<CategoryResponse> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { updateCategoryMock } = await import('./mock/adminMockService')
      return updateCategoryMock(uuid, data)
    }
    return apiClient.put<unknown, CategoryResponse>(`/api/v1/admin/categories/${uuid}`, data)
  },

  async deleteCategory(uuid: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { deleteCategoryMock } = await import('./mock/adminMockService')
      return deleteCategoryMock(uuid)
    }
    return apiClient.delete<unknown, void>(`/api/v1/admin/categories/${uuid}`)
  },

  async updateTag(id: string, data: UpdateTagRequest): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { updateTagMock } = await import('./mock/adminMockService')
      return updateTagMock(id, data)
    }
    return apiClient.put<unknown, void>(`/api/v1/admin/tags/${id}`, data)
  },

  async deleteTag(id: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { deleteTagMock } = await import('./mock/adminMockService')
      return deleteTagMock(id)
    }
    return apiClient.delete<unknown, void>(`/api/v1/admin/tags/${id}`)
  },

  async reindex(): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { reindexMock } = await import('./mock/adminMockService')
      return reindexMock()
    }
    return apiClient.post<unknown, void>('/api/v1/admin/search/reindex')
  },
}
