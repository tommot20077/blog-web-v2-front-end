import type { BackendPageResult } from './utils'
import type { BookmarkArticleSummary } from './real/bookmarkService'

export type { BookmarkArticleSummary }

export interface BookmarkService {
  bookmark(articleUuid: string): Promise<void>
  unbookmark(articleUuid: string): Promise<void>
  getMyBookmarks(page: number, size: number): Promise<BackendPageResult<BookmarkArticleSummary>>
}

export const bookmarkService: BookmarkService = {
  async bookmark(articleUuid) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { bookmarkService: svc } = await import('./mock/bookmarkService')
      return svc.bookmark(articleUuid)
    }
    const { bookmarkService: svc } = await import('./real/bookmarkService')
    return svc.bookmark(articleUuid)
  },

  async unbookmark(articleUuid) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { bookmarkService: svc } = await import('./mock/bookmarkService')
      return svc.unbookmark(articleUuid)
    }
    const { bookmarkService: svc } = await import('./real/bookmarkService')
    return svc.unbookmark(articleUuid)
  },

  async getMyBookmarks(page, size) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { bookmarkService: svc } = await import('./mock/bookmarkService')
      return svc.getMyBookmarks(page, size)
    }
    const { bookmarkService: svc } = await import('./real/bookmarkService')
    return svc.getMyBookmarks(page, size)
  },
}
