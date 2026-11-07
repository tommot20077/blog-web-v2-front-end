import apiClient from '../apiClient'
import { useAuthStore } from '../../stores/auth'
import { SEARCH_SORT_VALUES } from '../../types/search'
import type { SearchParams, SearchResult } from '../../types/search'
import type { PageResult } from '../../types/editor'
import { mapPageResult } from '../utils'
import type { BackendPageResult } from '../utils'

/** 只送後端接受的 sort；非白名單值（例如舊型別的 date／popularity）會讓整個請求被 400 拒絕，故直接丟棄 */
function toRequestParams(params: SearchParams): SearchParams {
  const { sort, ...rest } = params
  return sort !== undefined && SEARCH_SORT_VALUES.includes(sort) ? { ...rest, sort } : rest
}

export const searchService = {
  async search(params: SearchParams): Promise<PageResult<SearchResult>> {
    try {
      const raw = await apiClient.get<unknown, BackendPageResult<SearchResult>>('/api/v1/search', {
        params: toRequestParams(params),
      })
      return mapPageResult(raw, (item) => item)
    } catch (error) {
      console.error('Failed to search:', error)
      return { records: [], total: 0, size: params.size ?? 10, current: params.page ?? 1, pages: 0 }
    }
  },

  async suggest(q: string): Promise<string[]> {
    if (!q) return []
    try {
      return await apiClient.get<unknown, string[]>('/api/v1/search/suggest', { params: { q } })
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      return []
    }
  },

  async getHistory(): Promise<string[]> {
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
    try {
      return await apiClient.delete<unknown, void>('/api/v1/search/history')
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  },
}
