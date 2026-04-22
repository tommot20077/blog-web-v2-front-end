import type { MyArticle, ArticleStatusFilter, PageResult } from '../types/editor'

export const myArticlesService = {
  async getMyArticles(status: ArticleStatusFilter, page: number, size: number): Promise<PageResult<MyArticle>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { myArticlesService: svc } = await import('./mock/myArticlesService')
      return svc.getMyArticles(status, page, size)
    }
    const { myArticlesService: svc } = await import('./real/myArticlesService')
    return svc.getMyArticles(status, page, size)
  },

  async deleteArticle(uuid: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { myArticlesService: svc } = await import('./mock/myArticlesService')
      return svc.deleteArticle(uuid)
    }
    const { myArticlesService: svc } = await import('./real/myArticlesService')
    return svc.deleteArticle(uuid)
  },

  async submitForReview(uuid: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { myArticlesService: svc } = await import('./mock/myArticlesService')
      return svc.submitForReview(uuid)
    }
    const { myArticlesService: svc } = await import('./real/myArticlesService')
    return svc.submitForReview(uuid)
  },
}
