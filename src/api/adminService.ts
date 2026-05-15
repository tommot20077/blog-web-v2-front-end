import type {
  AdminTagResponse,
  CategoryResponse,
  CreateCategoryRequest,
  EditorArticle,
  MyArticle,
  PageResult,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from '../types/editor'

export const adminService = {
  async getPendingArticles(page: number, size: number): Promise<PageResult<MyArticle>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.getPendingArticles(page, size)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.getPendingArticles(page, size)
  },

  async getPendingCount(): Promise<number> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.getPendingCount()
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.getPendingCount()
  },

  async publishArticle(uuid: string): Promise<EditorArticle> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.publishArticle(uuid)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.publishArticle(uuid)
  },

  async rejectArticle(uuid: string, reason: string): Promise<EditorArticle> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.rejectArticle(uuid, reason)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.rejectArticle(uuid, reason)
  },

  async createCategory(request: CreateCategoryRequest): Promise<CategoryResponse> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.createCategory(request)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.createCategory(request)
  },

  async updateCategory(uuid: string, request: UpdateCategoryRequest): Promise<CategoryResponse> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.updateCategory(uuid, request)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.updateCategory(uuid, request)
  },

  async deleteCategory(uuid: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.deleteCategory(uuid)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.deleteCategory(uuid)
  },

  async updateTag(id: string, request: UpdateTagRequest): Promise<AdminTagResponse> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.updateTag(id, request)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.updateTag(id, request)
  },

  async deleteTag(id: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.deleteTag(id)
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.deleteTag(id)
  },

  async reindexSearch(): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { adminService: svc } = await import('./mock/adminService')
      return svc.reindexSearch()
    }
    const { adminService: svc } = await import('./real/adminService')
    return svc.reindexSearch()
  },
}
