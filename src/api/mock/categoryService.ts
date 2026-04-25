import { getCategoriesMock, getCategoryBySlugMock } from './categoryMockService'

export const categoryService = {
  getCategories: getCategoriesMock,
  getCategoryBySlug: getCategoryBySlugMock,
}
