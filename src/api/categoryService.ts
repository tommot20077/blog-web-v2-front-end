import apiClient from './apiClient'
import type { CategoryOption } from '../types/editor'

export const categoryService = {
  async getCategories(): Promise<CategoryOption[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getCategoriesMock } = await import('./mock/categoryMockService')
      return getCategoriesMock()
    }
    try {
      return await apiClient.get<unknown, CategoryOption[]>('/api/v1/categories')
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      return []
    }
  },
}
