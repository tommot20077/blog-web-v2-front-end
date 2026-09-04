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
import type { SearchIndexStatus } from '../../types/search'
import { editorArticleStore, toMyArticle } from './data'
// mockApiFailure 的失敗狀態一律在「呼叫當下」判定，不在 setTimeout 回呼裡判定：
// 否則測試在上一次載入還在飛行中時才註冊失敗，會把那次請求追溯成失敗，
// 畫面因此多出一個非預期的錯誤 toast。
import { createMockApiFailureError, getMockApiFailure } from './mockApiFailureState'

export function getPendingArticlesMock(page: number, size: number): Promise<PageResult<MyArticle>> {
  const failure = getMockApiFailure(`/api/v1/admin/articles/pending?page=${page}&size=${size}`)

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failure) {
        reject(createMockApiFailureError(failure))
        return
      }

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

/**
 * 取得完整分類清單（含 description、sortOrder）假資料。
 * 供 admin 分類管理頁 mock 模式使用；其中一筆 description 為 null 以覆蓋 null 情境。
 */
export function getCategoriesFullMock(): Promise<CategoryResponse[]> {
  return Promise.resolve([
    { uuid: 'cat-1', name: '架構', slug: 'architecture', description: '架構設計相關文章', sortOrder: 10 },
    { uuid: 'cat-2', name: '前端', slug: 'frontend', description: null, sortOrder: 20 },
    { uuid: 'cat-3', name: '後端', slug: 'backend', description: '後端開發相關文章', sortOrder: 30 },
  ])
}

/**
 * 取得完整標籤清單（含 color、icon、description、usageCount）假資料。
 * 供 admin 標籤管理頁 mock 模式使用；含 usageCount>0 與 usageCount=0 各一筆，供刪除防呆情境測試。
 */
export function getTagsFullMock(): Promise<AdminTagResponse[]> {
  return Promise.resolve([
    {
      id: 'tag-1',
      name: 'Vue',
      slug: 'vue',
      color: '#42b883',
      icon: 'tag',
      description: 'Vue 相關文章',
      parentId: null,
      usageCount: 12,
      createdAt: '2026-01-10T09:00:00Z',
    },
    {
      id: 'tag-2',
      name: 'Spring Boot',
      slug: 'spring-boot',
      color: '#6db33f',
      icon: 'leaf',
      description: null,
      parentId: null,
      usageCount: 0,
      createdAt: '2026-02-15T09:00:00Z',
    },
    {
      id: 'tag-3',
      name: 'TypeScript',
      slug: 'typescript',
      color: '#3178c6',
      icon: 'code',
      description: 'TypeScript 相關文章',
      parentId: null,
      usageCount: 5,
      createdAt: '2026-03-01T09:00:00Z',
    },
  ])
}

/**
 * 取得搜尋索引狀態假資料（文件數、最後重建時間、健康狀態）。
 */
export function getSearchStatusMock(): Promise<SearchIndexStatus> {
  return Promise.resolve({
    documentCount: 42,
    lastReindexAt: '2026-07-20T21:30:00Z',
    healthy: true,
  })
}
