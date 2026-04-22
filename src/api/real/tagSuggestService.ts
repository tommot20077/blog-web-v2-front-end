import apiClient from '../apiClient'
import type { TagSuggestion } from '../../types/editor'

interface BackendTag {
  id: string
  name: string
  slug: string
  usageCount: number
}

export const tagSuggestService = {
  async suggestTags(query: string): Promise<TagSuggestion[]> {
    if (!query.trim()) return []
    try {
      const raw = await apiClient.get<unknown, BackendTag[]>('/api/v1/tags/suggest', { params: { q: query } })
      return raw.map((t) => ({ name: t.name, articleCount: t.usageCount }))
    } catch (error) {
      console.error('Failed to suggest tags:', error)
      return []
    }
  },
}
