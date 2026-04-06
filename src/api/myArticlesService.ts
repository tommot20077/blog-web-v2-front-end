import apiClient from './apiClient'
import { mapPageResult } from './utils'
import type { BackendPageResult } from './utils'
import type { MyArticle, ArticleStatusFilter, PageResult, ArticleStatus } from '../types/editor'

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
  return { ...raw, tags: raw.tags.map(t => t.name) }
}

export const myArticlesService = {
  async getMyArticles(
    status: ArticleStatusFilter,
    page: number,
    size: number
  ): Promise<PageResult<MyArticle>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getMyArticlesMock } = await import('./mock/myArticlesMockService')
      return getMyArticlesMock(status, page, size)
    }
    const params: Record<string, unknown> = { page, size }
    if (status !== 'ALL') params.status = status
    const data = await apiClient.get<unknown, BackendPageResult<BackendMyArticle>>('/api/v1/articles/me', { params })
    return mapPageResult(data, mapMyArticle)
  },

  async deleteArticle(uuid: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { deleteMyArticleMock } = await import('./mock/myArticlesMockService')
      return deleteMyArticleMock(uuid)
    }
    return apiClient.delete<unknown, void>(`/api/v1/articles/${uuid}`)
  },

  async submitForReview(uuid: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { submitForReviewMock } = await import('./mock/myArticlesMockService')
      return submitForReviewMock(uuid)
    }
    return apiClient.post<unknown, void>(`/api/v1/articles/${uuid}/submit`)
  },
}
