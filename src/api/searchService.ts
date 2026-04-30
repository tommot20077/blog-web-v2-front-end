import type { SearchParams, SearchResult } from '../types/search'
import type { PageResult } from '../types/editor'

export const searchService = {
  async search(params: SearchParams): Promise<PageResult<SearchResult>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { searchService: svc } = await import('./mock/searchService')
      return svc.search(params)
    }
    const { searchService: svc } = await import('./real/searchService')
    return svc.search(params)
  },

  async suggest(q: string): Promise<string[]> {
    if (!q) return []
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { searchService: svc } = await import('./mock/searchService')
      return svc.suggest(q)
    }
    const { searchService: svc } = await import('./real/searchService')
    return svc.suggest(q)
  },

  async getHistory(): Promise<string[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { searchService: svc } = await import('./mock/searchService')
      return svc.getHistory()
    }
    const { searchService: svc } = await import('./real/searchService')
    return svc.getHistory()
  },

  async clearHistory(): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { searchService: svc } = await import('./mock/searchService')
      return svc.clearHistory()
    }
    const { searchService: svc } = await import('./real/searchService')
    return svc.clearHistory()
  },
}
