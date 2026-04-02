import type { CategoryOption } from '../../types/editor'
import { mockCategories } from './data'

export function getCategoriesMock(): Promise<CategoryOption[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockCategories])
    }, 200)
  })
}
