export type { AuthorSearchItem, PublicProfile, PublicProfileStats } from './real/authorService'
import type { AuthorSearchItem, PublicProfile } from './real/authorService'

export const authorService = {
  async searchAuthors(keyword: string): Promise<AuthorSearchItem[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authorService: svc } = await import('./mock/authorService')
      return svc.searchAuthors(keyword)
    }
    const { authorService: svc } = await import('./real/authorService')
    return svc.searchAuthors(keyword)
  },

  async getProfile(uuid: string): Promise<PublicProfile | null> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { authorService: svc } = await import('./mock/authorService')
      return svc.getProfile(uuid)
    }
    const { authorService: svc } = await import('./real/authorService')
    return svc.getProfile(uuid)
  },
}
