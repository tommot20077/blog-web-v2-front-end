import apiClient from '../apiClient'
import type { TagSuggestion } from '../../types/editor'

export const tagSuggestService = {
  async suggestTags(query: string, limit: number = 10): Promise<TagSuggestion[]> {
    if (!query.trim()) return []
    try {
      const raw = await apiClient.get<unknown, string[]>('/api/v1/tags/suggest', {
        params: { q: query, limit },
      })
      return raw.map((name) => ({ name }))
    } catch (error) {
      console.error('Failed to suggest tags:', error)
      return []
    }
  },
}
