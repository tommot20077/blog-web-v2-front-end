export type { ArticleItem, ArticleDetailItem } from './real/articleService'
import type { ArticleItem, ArticleDetailItem } from './real/articleService'
import type { PageResult } from '../types/editor'

export const articleService = {
  async getArticles(page: number, size: number, category: string, keyword: string): Promise<PageResult<ArticleItem>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { articleService: svc } = await import('./mock/articleService')
      return svc.getArticles(page, size, category, keyword)
    }
    const { articleService: svc } = await import('./real/articleService')
    return svc.getArticles(page, size, category, keyword)
  },

  async getArticleByUuid(uuid: string): Promise<ArticleDetailItem | null> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { articleService: svc } = await import('./mock/articleService')
      return svc.getArticleByUuid(uuid)
    }
    const { articleService: svc } = await import('./real/articleService')
    return svc.getArticleByUuid(uuid)
  },

  async getArticleBySlug(slug: string): Promise<ArticleDetailItem | null> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { articleService: svc } = await import('./mock/articleService')
      return svc.getArticleBySlug(slug)
    }
    const { articleService: svc } = await import('./real/articleService')
    return svc.getArticleBySlug(slug)
  },
}
