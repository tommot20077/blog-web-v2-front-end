export type { TagDetailResponse } from './real/tagService'
import type { TagDetailResponse } from './real/tagService'
import type { TagDetail } from '../types/editor'

export const tagService = {
  async getHotTags(limit: number = 20): Promise<TagDetailResponse[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { tagService: svc } = await import('./mock/tagService')
      return svc.getHotTags(limit)
    }
    const { tagService: svc } = await import('./real/tagService')
    return svc.getHotTags(limit)
  },

  async getTagBySlug(slug: string): Promise<TagDetail | null> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { tagService: svc } = await import('./mock/tagService')
      return svc.getTagBySlug(slug)
    }
    const { tagService: svc } = await import('./real/tagService')
    return svc.getTagBySlug(slug)
  },

  async followTag(id: string): Promise<void> {
    // Auth guard runs before mock/real split — write operations require auth in all environments
    const { useAuthStore } = await import('../stores/auth')
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) throw new Error('未登入')
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { tagService: svc } = await import('./mock/tagService')
      return svc.followTag(id)
    }
    const { tagService: svc } = await import('./real/tagService')
    return svc.followTag(id)
  },

  async unfollowTag(id: string): Promise<void> {
    // Auth guard runs before mock/real split — write operations require auth in all environments
    const { useAuthStore } = await import('../stores/auth')
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) throw new Error('未登入')
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { tagService: svc } = await import('./mock/tagService')
      return svc.unfollowTag(id)
    }
    const { tagService: svc } = await import('./real/tagService')
    return svc.unfollowTag(id)
  },
}
