import type { CategoryOption } from '../types/editor'

export const categoryService = {
  async getCategories(): Promise<CategoryOption[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { categoryService: svc } = await import('./mock/categoryService')
      return svc.getCategories()
    }
    const { categoryService: svc } = await import('./real/categoryService')
    return svc.getCategories()
  },

  async getCategoryBySlug(slug: string): Promise<CategoryOption | null> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { categoryService: svc } = await import('./mock/categoryService')
      return svc.getCategoryBySlug(slug)
    }
    const { categoryService: svc } = await import('./real/categoryService')
    return svc.getCategoryBySlug(slug)
  },
}
