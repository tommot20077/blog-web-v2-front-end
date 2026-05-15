import type {
  AdminTagResponse,
  CategoryResponse,
  CreateCategoryRequest,
  EditorArticle,
  MyArticle,
  PageResult,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from '../../types/editor'
import { editorArticleStore, toMyArticle } from './data'

export function getPendingArticlesMock(page: number, size: number): Promise<PageResult<MyArticle>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = editorArticleStore.filter(a => a.status === 'PENDING_REVIEW')
      const total = filtered.length
      const pages = Math.max(1, Math.ceil(total / size))
      const start = (page - 1) * size
      const records = filtered.slice(start, start + size).map(toMyArticle)
      resolve({ records, total, size, current: page, pages })
    }, 200)
  })
}

export function getPendingCountMock(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const count = editorArticleStore.filter(a => a.status === 'PENDING_REVIEW').length
      resolve(count)
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

export function createCategoryMock(request: CreateCategoryRequest): Promise<CategoryResponse> {
  return Promise.resolve({
    uuid: `cat-${Date.now()}`,
    name: request.name,
    slug: request.slug,
    description: request.description ?? null,
    sortOrder: request.sortOrder ?? 0,
  })
}

export function updateCategoryMock(uuid: string, request: UpdateCategoryRequest): Promise<CategoryResponse> {
  return Promise.resolve({
    uuid,
    name: request.name ?? 'Mock Category',
    slug: request.slug ?? 'mock-category',
    description: request.description ?? null,
    sortOrder: request.sortOrder ?? 0,
  })
}

export function deleteCategoryMock(_uuid: string): Promise<void> {
  return Promise.resolve()
}

export function updateTagMock(id: string, request: UpdateTagRequest): Promise<AdminTagResponse> {
  return Promise.resolve({
    id,
    name: 'Mock Tag',
    slug: 'mock-tag',
    color: request.color ?? null,
    icon: request.icon ?? null,
    description: request.description ?? null,
    parentId: null,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  })
}

export function deleteTagMock(_id: string): Promise<void> {
  return Promise.resolve()
}

export function reindexSearchMock(): Promise<void> {
  return Promise.resolve()
}
