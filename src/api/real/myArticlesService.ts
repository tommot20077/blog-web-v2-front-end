import apiClient from '../apiClient'
import { mapPageResult } from '../utils'
import type { BackendPageResult } from '../utils'
import type { MyArticle, ArticleStatusFilter, PageResult, ArticleStatus } from '../../types/editor'

interface BackendMyArticle {
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
}

function mapMyArticle(raw: BackendMyArticle): MyArticle {
  return { ...raw, tags: raw.tags.map((t) => t.name) }
}

export const myArticlesService = {
  async getMyArticles(status: ArticleStatusFilter, page: number, size: number): Promise<PageResult<MyArticle>> {
    const params: Record<string, unknown> = { page, size }
    if (status !== 'ALL') params.status = status
    try {
      const data = await apiClient.get<unknown, BackendPageResult<BackendMyArticle>>('/api/v1/articles/me', { params })
      return mapPageResult(data, mapMyArticle)
    } catch (error) {
      console.error('Failed to fetch my articles:', error)
      return { records: [], total: 0, current: page, size, pages: 0 }
    }
  },

  async deleteArticle(uuid: string): Promise<void> {
    return apiClient.delete<unknown, void>(`/api/v1/articles/${uuid}`)
  },

  async submitForReview(uuid: string): Promise<void> {
    return apiClient.post<unknown, void>(`/api/v1/articles/${uuid}/submit`)
  },
}
