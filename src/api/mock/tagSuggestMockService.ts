import type { TagSuggestion } from '../../types/editor'
import { mockTagPool } from './data'

const MAX_SUGGESTIONS = 8

export function suggestTagsMock(query: string): Promise<TagSuggestion[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim()) {
        resolve([])
        return
      }
      const lower = query.toLowerCase()
      const matches = mockTagPool
        .filter(t => t.name.toLowerCase().startsWith(lower))
        .slice(0, MAX_SUGGESTIONS)
      resolve(matches)
    }, 150)
  })
}
