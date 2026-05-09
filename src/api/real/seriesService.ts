import apiClient from '../apiClient'
import type { BackendPageResult } from '../utils'
import type { ArticleStatus } from '../../types/editor'

export interface Series {
  id: number
  uuid: string
  title: string
  slug: string
  description?: string | null
  coverImageUrl?: string | null
  authorId: number
  articleCount: number
  createdAt: string
  updatedAt: string
}

export interface AuthorSummary {
  uuid?: string
  nickname?: string
  avatarUrl?: string | null
}

export interface TagSummary {
  id: string
  name: string
  slug: string
}

export interface ArticleSummary {
  uuid: string
  title: string
  summary?: string | null
  coverImageUrl?: string | null
  authorUuid?: string
  authorNickname?: string
  status: ArticleStatus
  viewCount: number
  createdAt: string
  updatedAt: string
  slug: string
  likeCount: number
  commentCount: number
  publishedAt?: string | null
  tags?: TagSummary[]
  rejectReason?: string | null
  liked?: boolean
  bookmarked?: boolean
  lastReadProgress?: number | null
  seriesUuid?: string | null
  seriesTitle?: string | null
  seriesPosition?: number | null
}

export interface MyProgress {
  readCount: number
  totalCount: number
  nextUnreadArticleUuid?: string | null
}

export interface SeriesSummary {
  uuid: string
  title: string
  slug: string
  description?: string | null
  coverImageUrl?: string | null
  author?: AuthorSummary | null
  articleCount: number
  createdAt: string
  updatedAt: string
}

export interface SeriesDetail {
  uuid: string
  title: string
  slug: string
  description?: string | null
  coverImageUrl?: string | null
  author?: AuthorSummary | null
  articleCount: number
  createdAt: string
  updatedAt: string
  articles: ArticleSummary[]
  myProgress?: MyProgress | null
}

export interface ListSeriesRequest {
  page?: number
  size?: number
}

export interface CreateSeriesRequest {
  title: string
  slug: string
  description?: string | null
  coverImageUrl?: string | null
}

export interface UpdateSeriesRequest {
  title?: string
  slug?: string
  description?: string | null
  coverImageUrl?: string | null
}

export interface AddArticleToSeriesRequest {
  position: number
}

export const seriesService = {
  async list(params: ListSeriesRequest = {}): Promise<BackendPageResult<SeriesSummary>> {
    return apiClient.get<unknown, BackendPageResult<SeriesSummary>>('/api/v1/series', { params })
  },

  async get(slug: string): Promise<SeriesDetail> {
    return apiClient.get<unknown, SeriesDetail>(`/api/v1/series/${slug}`)
  },

  async create(request: CreateSeriesRequest): Promise<Series> {
    return apiClient.post<unknown, Series>('/api/v1/series', request)
  },

  async update(uuid: string, request: UpdateSeriesRequest): Promise<Series> {
    return apiClient.put<unknown, Series>(`/api/v1/series/${uuid}`, request)
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/api/v1/series/${uuid}`)
  },

  async addArticle(uuid: string, articleUuid: string, request: AddArticleToSeriesRequest): Promise<void> {
    await apiClient.put(`/api/v1/series/${uuid}/articles/${articleUuid}`, request)
  },

  async removeArticle(uuid: string, articleUuid: string): Promise<void> {
    await apiClient.delete(`/api/v1/series/${uuid}/articles/${articleUuid}`)
  },
}
