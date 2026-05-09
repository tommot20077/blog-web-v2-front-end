import apiClient from '../apiClient'
import type { BackendPageResult } from '../utils'

export interface BookmarkArticleSummary {
  uuid: string
  title: string
  summary?: string | null
  coverImageUrl?: string | null
  authorUuid?: string
  authorNickname?: string
  status?: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  publishedAt?: string | null
  slug?: string
  bookmarked?: boolean
  lastReadProgress?: number | null
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
