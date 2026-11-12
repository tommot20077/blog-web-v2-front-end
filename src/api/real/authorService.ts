import apiClient from '../apiClient'

/** GET /api/v1/authors 的項目（作者下拉選單） */
export interface AuthorSearchItem {
  uuid: string
  nickname: string
  avatarUrl: string | null
  publishedArticleCount: number
}

export interface PublicProfileStats {
  publishedArticleCount: number
  totalViewCount: number
  totalLikeCount: number
}

/**
 * GET /api/v1/users/{uuid}/profile 的回應（公開作者頁）。
 * socialLinks 的值是「帳號名稱（handle）」不是網址；github／twitter／linkedin 恆存在，未填為 null。
 */
export interface PublicProfile {
  uuid: string
  nickname: string
  avatarUrl: string | null
  bio: string | null
  location: string | null
  website: string | null
  socialLinks: Record<string, string | null>
  joinedAt: string
  stats: PublicProfileStats
}

/** 「作者不存在」：後端對不存在／已刪除／未驗證／停權一律回 HTTP 404 + A0101，彼此不可區分 */
function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const e = error as { status?: number; code?: string }
  return e.status === 404 || e.code === 'A0101'
}

export const authorService = {
  async searchAuthors(keyword: string): Promise<AuthorSearchItem[]> {
    const params: Record<string, string> = {}
    if (keyword) params.keyword = keyword
    return apiClient.get<unknown, AuthorSearchItem[]>('/api/v1/authors', { params })
  },

  /** 不存在 → null；其他失敗（5xx、網路）向上拋出，呼叫端不可把它誤判成「找不到」 */
  async getProfile(uuid: string): Promise<PublicProfile | null> {
    try {
      return await apiClient.get<unknown, PublicProfile>(`/api/v1/users/${encodeURIComponent(uuid)}/profile`)
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  },
}
