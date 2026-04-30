import apiClient from '../apiClient'
import type { CategoryOption } from '../../types/editor'

interface BackendCategory {
  uuid: string
  name: string
  slug: string
  description?: string
  sortOrder?: number
}

function mapCategory(raw: BackendCategory): CategoryOption {
  return { id: raw.uuid, name: raw.name, slug: raw.slug }
}

export const categoryService = {
  async getCategories(): Promise<CategoryOption[]> {
    try {
      const data = await apiClient.get<unknown, BackendCategory[]>('/api/v1/categories')
      return data.map(mapCategory)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      return []
    }
  },

  async getCategoryBySlug(slug: string): Promise<CategoryOption | null> {
    try {
      const data = await apiClient.get<unknown, BackendCategory>(`/api/v1/categories/${slug}`)
      return mapCategory(data)
    } catch (error) {
      console.error('Failed to fetch category by slug:', error)
      return null
    }
  },
}
