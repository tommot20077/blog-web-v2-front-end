import apiClient from '../apiClient'
import type { TagSuggestion } from '../../types/editor'

export const tagSuggestService = {
  async suggestTags(query: string): Promise<TagSuggestion[]> {
    if (!query.trim()) return []
    try {
      return await apiClient.get<unknown, TagSuggestion[]>('/api/v1/tags/suggest', { params: { q: query } })
    } catch (error) {
      console.error('Failed to suggest tags:', error)
      return []
    }
  },
}
