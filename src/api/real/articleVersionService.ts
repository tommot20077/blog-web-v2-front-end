import apiClient from '../apiClient'
import type { ArticleStatus } from '../../types/editor'

export type VersionType = 'AUTO' | 'MANUAL'

export interface VersionSummaryResponse {
  uuid: string
  type: VersionType
  createdAt: string
  authorId: number
  contentLength: number
  note?: string | null
}

export interface VersionDetailResponse {
  uuid: string
  type: VersionType
  createdAt: string
  authorId: number
  note?: string | null
  title: string
  slug: string
  content: string
  status: ArticleStatus
  summary?: string | null
  categoryId?: number | null
  coverImageUrl?: string | null
  tags?: string[] | null
}

export interface ArticleVersion {
  id: number
  uuid: string
  articleId: number
  authorId: number
  type: VersionType
  title: string
  slug: string
  content: string
  status: ArticleStatus
  createdAt: string
  note?: string | null
  summary?: string | null
  categoryId?: number | null
  coverImageUrl?: string | null
  tags?: string[] | null
}

export interface VersionPageResponse {
  records: VersionSummaryResponse[]
  total: number
  current: number
  size: number
  pages: number
}

export interface ListArticleVersionsParams {
  type?: VersionType
  page?: number
  size?: number
}

export interface CreateManualVersionRequest {
  note?: string | null
}

export const articleVersionService = {
  async list(
    articleUuid: string,
    params: ListArticleVersionsParams = {},
  ): Promise<VersionPageResponse> {
    return apiClient.get<unknown, VersionPageResponse>(
      `/api/v1/articles/${articleUuid}/versions`,
      { params },
    )
  },

  async getDetail(articleUuid: string, versionUuid: string): Promise<VersionDetailResponse> {
    return apiClient.get<unknown, VersionDetailResponse>(
      `/api/v1/articles/${articleUuid}/versions/${versionUuid}`,
    )
  },

  async createManual(
    articleUuid: string,
    request: CreateManualVersionRequest,
  ): Promise<ArticleVersion> {
    return apiClient.post<unknown, ArticleVersion>(
      `/api/v1/articles/${articleUuid}/versions/manual`,
      request,
    )
  },

  async delete(articleUuid: string, versionUuid: string): Promise<void> {
    await apiClient.delete(`/api/v1/articles/${articleUuid}/versions/${versionUuid}`)
  },

  async promote(articleUuid: string, versionUuid: string): Promise<ArticleVersion> {
    return apiClient.post<unknown, ArticleVersion>(
      `/api/v1/articles/${articleUuid}/versions/${versionUuid}/promote`,
    )
  },

  async restore(articleUuid: string, versionUuid: string): Promise<void> {
    await apiClient.post(`/api/v1/articles/${articleUuid}/versions/${versionUuid}/restore`)
  },
}
