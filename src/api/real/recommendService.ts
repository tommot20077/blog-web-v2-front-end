import apiClient from '../apiClient'

export interface RecommendArticleResponse {
  uuid: string
  title: string
  slug: string
  summary: string
  authorNickname: string
  viewCount: number
  likeCount: number
  publishedAt: string
  tags: string[]
  // backend 尚未提供，先在 interface 上保留為 optional；mock 會給 picsum URL
  coverImageUrl?: string | null
}

interface BackendRecommend {
  uuid: string
  title: string
  slug: string
  summary: string
  authorNickname: string
  tagNames: string[]
  viewCount: number
  likeCount: number
  publishedAt: string
}

function mapBackendRecommend(raw: BackendRecommend): RecommendArticleResponse {
  return {
    uuid: raw.uuid,
    title: raw.title,
    slug: raw.slug,
    summary: raw.summary,
    authorNickname: raw.authorNickname,
    viewCount: raw.viewCount,
    likeCount: raw.likeCount,
    publishedAt: raw.publishedAt,
    tags: raw.tagNames,
    coverImageUrl: null,
  }
}

export const recommendService = {
  async getTrending(period: string = '7d', limit: number = 10): Promise<RecommendArticleResponse[]> {
    try {
      const data = await apiClient.get<unknown, BackendRecommend[]>('/api/v1/recommend/trending', {
        params: { period, limit },
      })
      return data.map(mapBackendRecommend)
    } catch (error) {
      console.error('Fetch trending articles failed:', error)
      return []
    }
  },

  async getRelatedArticles(articleUuid: string): Promise<RecommendArticleResponse[]> {
    try {
      const data = await apiClient.get<unknown, BackendRecommend[]>(`/api/v1/recommend/related/${articleUuid}`)
      return data.map(mapBackendRecommend)
    } catch (error) {
      console.error('Fetch related articles failed:', error)
      return []
    }
  },
}
