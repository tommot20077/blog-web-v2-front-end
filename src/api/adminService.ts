import type { EditorArticle, MyArticle, PageResult } from '../types/editor'

export const adminService = {
  async getPendingArticles(page: number, size: number): Promise<PageResult<MyArticle>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.getPendingArticles(page, size)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.getPendingArticles(page, size)
  },

  async getPendingCount(): Promise<number> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.getPendingCount()
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.getPendingCount()
  },

  async publishArticle(uuid: string): Promise<EditorArticle> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.publishArticle(uuid)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.publishArticle(uuid)
  },

  async rejectArticle(uuid: string, reason: string): Promise<EditorArticle> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.rejectArticle(uuid, reason)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.rejectArticle(uuid, reason)
  },
}
