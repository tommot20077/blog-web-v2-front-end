import apiClient from '../apiClient'
import type { BackendPageResult } from '../utils'
import type { ArticleStatus } from '../../types/editor'

export interface BookmarkTagSummary {
  id: string
  name: string
  slug: string
}

export interface BookmarkArticleSummary {
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
  tags?: BookmarkTagSummary[]
  rejectReason?: string | null
  liked?: boolean
  bookmarked?: boolean
  lastReadProgress?: number | null
  seriesUuid?: string | null
  seriesTitle?: string | null
  seriesPosition?: number | null
}

export const bookmarkService = {
  async bookmark(articleUuid: string): Promise<void> {
    await apiClient.post(`/api/v1/articles/${articleUuid}/bookmark`)
  },

  async unbookmark(articleUuid: string): Promise<void> {
    await apiClient.delete(`/api/v1/articles/${articleUuid}/bookmark`)
  },

  async getMyBookmarks(page: number, size: number): Promise<BackendPageResult<BookmarkArticleSummary>> {
    return apiClient.get<unknown, BackendPageResult<BookmarkArticleSummary>>('/api/v1/users/me/bookmarks', {
      params: { page, size },
    })
  },
}
