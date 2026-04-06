import apiClient from './apiClient'
import { useAuthStore } from '../stores/auth'
import type { SearchParams, SearchResult } from '../types/search'
import type { PageResult } from '../types/editor'
import { mapPageResult } from './utils'
import type { BackendPageResult } from './utils'

export const searchService = {
  async search(params: SearchParams): Promise<PageResult<SearchResult>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { searchSearchMock } = await import('./mock/searchMockService')
      return searchSearchMock(params)
    }
    try {
      const raw = await apiClient.get<unknown, BackendPageResult<SearchResult>>('/api/v1/search', {
        params,
      })
      return mapPageResult(raw, (item) => item)
    } catch (error) {
      console.error('Failed to search:', error)
      return { records: [], total: 0, size: params.size ?? 10, current: params.page ?? 1, pages: 0 }
    }
  },

  async suggest(q: string): Promise<string[]> {
    if (!q) return []
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { searchSuggestMock } = await import('./mock/searchMockService')
      return searchSuggestMock(q)
    }
    try {
      return await apiClient.get<unknown, string[]>('/api/v1/search/suggest', { params: { q } })
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      return []
    }
  },

  async getHistory(): Promise<string[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getSearchHistoryMock } = await import('./mock/searchMockService')
      return getSearchHistoryMock()
    }
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return []
    try {
      return await apiClient.get<unknown, string[]>('/api/v1/search/history')
    } catch (error) {
      console.error('Failed to fetch search history:', error)
      return []
    }
  },

  async clearHistory(): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { clearSearchHistoryMock } = await import('./mock/searchMockService')
      return clearSearchHistoryMock()
    }
    try {
      return await apiClient.delete<unknown, void>('/api/v1/search/history')
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  },
}
