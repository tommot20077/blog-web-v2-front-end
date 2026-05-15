import type { TagSuggestion } from '../../types/editor'
import { mockTagPool } from './data'

export function suggestTagsMock(query: string, limit: number = 10): Promise<TagSuggestion[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim()) {
        resolve([])
        return
      }
      const lower = query.toLowerCase()
      const matches = mockTagPool
        .filter(t => t.name.toLowerCase().startsWith(lower))
        .slice(0, limit)
      resolve(matches)
    }, 150)
  })
}
