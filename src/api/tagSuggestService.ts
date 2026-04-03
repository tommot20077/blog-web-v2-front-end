import apiClient from './apiClient'
import type { TagSuggestion } from '../types/editor'

export const tagSuggestService = {
  async suggestTags(query: string): Promise<TagSuggestion[]> {
    if (!query.trim()) return []

    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { suggestTagsMock } = await import('./mock/tagSuggestMockService')
      return suggestTagsMock(query)
    }
    try {
      return await apiClient.get<unknown, TagSuggestion[]>('/api/v1/tags/suggest', { params: { q: query } })
    } catch (error) {
      console.error('Failed to suggest tags:', error)
      return []
    }
  },
}
