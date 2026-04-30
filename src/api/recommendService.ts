export type { RecommendArticleResponse } from './real/recommendService'
import type { RecommendArticleResponse } from './real/recommendService'

export const recommendService = {
  async getTrending(period: string = '7d', limit: number = 10): Promise<RecommendArticleResponse[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { recommendService: svc } = await import('./mock/recommendService')
      return svc.getTrending(period, limit)
    }
    const { recommendService: svc } = await import('./real/recommendService')
    return svc.getTrending(period, limit)
  },

  async getRelatedArticles(articleUuid: string): Promise<RecommendArticleResponse[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { recommendService: svc } = await import('./mock/recommendService')
      return svc.getRelatedArticles(articleUuid)
    }
    const { recommendService: svc } = await import('./real/recommendService')
    return svc.getRelatedArticles(articleUuid)
  },
}
