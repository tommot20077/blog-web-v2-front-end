import apiClient from '../apiClient'
import type { TagDetail } from '../../types/editor'
import { useAuthStore } from '../../stores/auth'

export interface TagDetailResponse {
  uuid: string
  name: string
  slug: string
  articleCount: number
}

interface BackendTag {
  id: string
  name: string
  slug: string
  usageCount: number
  color?: string | null
  icon?: string | null
  description?: string | null
  parentId?: string | null
  createdAt?: string
}

interface BackendTagDetail {
  id: string
  name: string
  slug: string
  color: string | null | undefined
  icon: string | null | undefined
  description: string | null | undefined
  usageCount: number
  // backend 未 deploy 帶 followed flag 的版本前可能 undefined；mapper 會 fallback false
  followed?: boolean | null
}

function mapBackendTag(raw: BackendTag): TagDetailResponse {
  return { uuid: raw.id, name: raw.name, slug: raw.slug, articleCount: raw.usageCount }
}

function mapBackendTagDetail(raw: BackendTagDetail): TagDetail {
  return {
    uuid: raw.id,
    name: raw.name,
    slug: raw.slug,
    color: raw.color ?? '',
    icon: raw.icon ?? '',
    description: raw.description ?? '',
    usageCount: raw.usageCount,
    followed: raw.followed ?? false,
  }
}

export const tagService = {
  async getHotTags(limit: number = 20): Promise<TagDetailResponse[]> {
    try {
      const data = await apiClient.get<unknown, BackendTag[]>('/api/v1/tags/hot', { params: { limit } })
      return data.map(mapBackendTag)
    } catch (error) {
      console.error('Fetch hot tags failed:', error)
      return []
    }
  },

  async getTagBySlug(slug: string): Promise<TagDetail | null> {
    try {
      const data = await apiClient.get<unknown, BackendTagDetail>(`/api/v1/tags/${slug}`)
      return mapBackendTagDetail(data)
    } catch (error) {
      console.error('Fetch tag by slug failed:', error)
      return null
    }
  },

  async followTag(id: string): Promise<void> {
    // Auth guard intentionally runs before mock check — write operations require auth in all environments
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      throw new Error('未登入')
    }
    await apiClient.post<unknown, void>(`/api/v1/tags/${id}/follow`)
  },

  async unfollowTag(id: string): Promise<void> {
    // Auth guard intentionally runs before mock check — write operations require auth in all environments
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      throw new Error('未登入')
    }
    await apiClient.delete<unknown, void>(`/api/v1/tags/${id}/follow`)
  },
}
