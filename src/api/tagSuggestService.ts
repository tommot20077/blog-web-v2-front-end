import type { TagSuggestion } from '../types/editor'

export const tagSuggestService = {
  async suggestTags(query: string): Promise<TagSuggestion[]> {
    if (!query.trim()) return []
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { tagSuggestService: svc } = await import('./mock/tagSuggestService')
      return svc.suggestTags(query)
    }
    const { tagSuggestService: svc } = await import('./real/tagSuggestService')
    return svc.suggestTags(query)
  },
}
