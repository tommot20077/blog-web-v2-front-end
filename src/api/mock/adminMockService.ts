import type {
  EditorArticle,
  PendingArticle,
  PageResult,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryResponse,
  UpdateTagRequest,
} from '../../types/editor'
import { editorArticleStore, toPendingArticle, mockCategories } from './data'

export function getPendingArticlesMock(page: number, size: number): Promise<PageResult<PendingArticle>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = editorArticleStore.filter(a => a.status === 'PENDING_REVIEW')
      const total = filtered.length
      const pages = Math.max(1, Math.ceil(total / size))
      const start = (page - 1) * size
      const records = filtered.slice(start, start + size).map(toPendingArticle)
      resolve({ records, total, size, current: page, pages })
    }, 200)
  })
}

export function publishArticleMock(uuid: string): Promise<EditorArticle> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const article = editorArticleStore.find(a => a.uuid === uuid)
      if (!article) {
        reject(new Error(`文章 ${uuid} 不存在`))
        return
      }
      article.status = 'PUBLISHED'
      article.updatedAt = new Date().toISOString()
      resolve(article)
    }, 300)
  })
}

export function rejectArticleMock(uuid: string, reason: string): Promise<EditorArticle> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const article = editorArticleStore.find(a => a.uuid === uuid)
      if (!article) {
        reject(new Error(`文章 ${uuid} 不存在`))
        return
      }
      article.status = 'REJECTED'
      article.rejectReason = reason
      article.updatedAt = new Date().toISOString()
      resolve(article)
    }, 300)
  })
}

export function createCategoryMock(data: CreateCategoryRequest): Promise<CategoryResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newCategory: CategoryResponse = {
        uuid: `cat-mock-${Date.now()}`,
        name: data.name,
        slug: data.slug,
        description: data.description,
        sortOrder: data.sortOrder,
      }
      resolve(newCategory)
    }, 200)
  })
}

export function updateCategoryMock(uuid: string, data: UpdateCategoryRequest): Promise<CategoryResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existing = mockCategories.find(c => c.uuid === uuid)
      const updated: CategoryResponse = {
        uuid,
        name: data.name ?? existing?.name ?? '',
        slug: data.slug ?? existing?.slug ?? '',
        description: data.description,
        sortOrder: data.sortOrder,
      }
      resolve(updated)
    }, 200)
  })
}

export function deleteCategoryMock(_uuid: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

export function updateTagMock(_id: string, _data: UpdateTagRequest): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

export function deleteTagMock(_id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

export function reindexMock(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 500)
  })
}
