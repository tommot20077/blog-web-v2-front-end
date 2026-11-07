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
import type { SearchIndexStatus, SearchReindexJob } from '../../types/search'
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
      article.version += 1
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
      article.version += 1
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

// ── 重建搜尋索引（D1：背景作業＋輪詢） ─────────────────────────────────────
// 作業狀態完全由「開始時間 + Date.now()」推導，不用 timer：status 每次被問到才計算，
// 測試用 fake timers 推進時間即可，也不會在頁面卸載後留下背景 timer。

/** 模擬作業從開始到 COMPLETED 的時間（毫秒）；比輪詢間隔（2 秒）長，E2E 才看得到 RUNNING 進度 */
export const MOCK_REINDEX_DURATION_MS = 5000
/** FAILED 情境下，作業失敗的時間點（毫秒） */
export const MOCK_REINDEX_FAIL_AT_MS = 3000
/** 模擬的已發布文章總數（進度分母） */
export const MOCK_REINDEX_TOTAL = 50
const MOCK_REINDEX_FAILURE_MESSAGE = '模擬重建失敗：ES bulk 寫入逾時'
const MOCK_BASE_LAST_REINDEX_AT = '2026-07-20T21:30:00Z'
const REINDEX_URL = '/api/v1/admin/search/reindex'

type MockReindexOutcome = 'COMPLETED' | 'FAILED'

interface MockReindexRun {
  jobId: string
  startedAtMs: number
  outcome: MockReindexOutcome
}

let reindexRun: MockReindexRun | null = null
let nextReindexOutcome: MockReindexOutcome = 'COMPLETED'
let reindexSeq = 0

/** 讓「下一次」觸發的重建作業以指定結果收場（E2E 用，預設 COMPLETED） */
export function setMockReindexOutcome(outcome: MockReindexOutcome): void {
  nextReindexOutcome = outcome
}

export function resetAdminSearchMockState(): void {
  reindexRun = null
  nextReindexOutcome = 'COMPLETED'
  reindexSeq = 0
}

function describeReindexRun(run: MockReindexRun, nowMs: number): SearchReindexJob {
  const elapsed = nowMs - run.startedAtMs
  const startedAt = new Date(run.startedAtMs).toISOString()
  const base = { jobId: run.jobId, total: MOCK_REINDEX_TOTAL, startedAt }
  const progressAt = (ms: number) =>
    Math.min(MOCK_REINDEX_TOTAL, Math.floor((MOCK_REINDEX_TOTAL * Math.max(0, ms)) / MOCK_REINDEX_DURATION_MS))

  if (run.outcome === 'FAILED' && elapsed >= MOCK_REINDEX_FAIL_AT_MS) {
    return {
      ...base,
      state: 'FAILED',
      processed: progressAt(MOCK_REINDEX_FAIL_AT_MS),
      finishedAt: new Date(run.startedAtMs + MOCK_REINDEX_FAIL_AT_MS).toISOString(),
      error: MOCK_REINDEX_FAILURE_MESSAGE,
    }
  }
  if (run.outcome === 'COMPLETED' && elapsed >= MOCK_REINDEX_DURATION_MS) {
    return {
      ...base,
      state: 'COMPLETED',
      processed: MOCK_REINDEX_TOTAL,
      finishedAt: new Date(run.startedAtMs + MOCK_REINDEX_DURATION_MS).toISOString(),
      error: null,
    }
  }
  return { ...base, state: 'RUNNING', processed: progressAt(elapsed), finishedAt: null, error: null }
}

function currentReindexJob(): SearchReindexJob | null {
  return reindexRun ? describeReindexRun(reindexRun, Date.now()) : null
}

/**
 * 觸發重建：回傳剛建立的 RUNNING 作業（對應後端 202）。
 * 已有作業 RUNNING 時拒絕為 409／A0501（對應後端）；mockApiFailure 也可對此 URL 註冊任意失敗（例如模擬 409）。
 */
export function reindexSearchMock(): Promise<SearchReindexJob> {
  const failure = getMockApiFailure(REINDEX_URL)
  if (failure) return Promise.reject(createMockApiFailureError(failure))

  if (currentReindexJob()?.state === 'RUNNING') {
    return Promise.reject(createMockApiFailureError({
      urlPattern: REINDEX_URL,
      body: { code: 'A0501', message: '已有搜尋索引重建作業執行中', data: currentReindexJob() },
      status: 409,
    }))
  }

  reindexSeq += 1
  reindexRun = {
    jobId: `mock-reindex-job-${reindexSeq}`,
    startedAtMs: Date.now(),
    outcome: nextReindexOutcome,
  }
  return Promise.resolve({ ...describeReindexRun(reindexRun, reindexRun.startedAtMs), total: null })
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
  const reindex = currentReindexJob()
  return Promise.resolve({
    documentCount: 42,
    lastReindexAt: reindex?.state === 'COMPLETED' ? reindex.finishedAt : MOCK_BASE_LAST_REINDEX_AT,
    healthy: true,
    reindex,
  })
}
