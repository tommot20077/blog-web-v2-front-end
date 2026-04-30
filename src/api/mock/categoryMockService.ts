import type { CategoryOption } from '../../types/editor'
import { mockCategories } from './data'

export function getCategoriesMock(): Promise<CategoryOption[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockCategories])
    }, 200)
  })
}

export function getCategoryBySlugMock(slug: string): Promise<CategoryOption | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = mockCategories.find(c => c.slug === slug) ?? null
      resolve(found)
    }, 200)
  })
}
