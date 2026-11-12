import type { ArticleFormData, EditorArticle } from '../../types/editor'
import { editorArticleStore, mockCategories } from './data'
// mockApiFailure 的失敗狀態一律在「呼叫當下」判定，不在 setTimeout 回呼裡判定：
// 否則測試在上一次載入還在飛行中時才註冊失敗，會把那次請求追溯成失敗，
// 畫面因此多出一個非預期的錯誤 toast。
import { createMockApiFailureError, getMockApiFailure } from './mockApiFailureState'

function generateUuid(): string {
  return `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 對齊後端 A0208（ARTICLE_CONCURRENT_UPDATE）：HTTP 409。
 * 同時帶 apiClient 形狀（status / code）與 axios 風格（response），讓兩種判斷路徑都成立。
 */
function createConcurrentUpdateError(): Error {
  const message = '文章已被其他人修改，請重新整理後再試'
  return Object.assign(new Error(message), {
    status: 409,
    code: 'A0208',
    response: { status: 409, data: { code: 'A0208', message, data: null } },
  })
}

/**
 * E2E 專用：模擬「別處（另一個分頁／另一個人）已修改這篇文章」——version 遞增，並可套用新內容。
 * 之後用舊 version 存檔會得到 409／A0208。
 */
export function simulateExternalArticleUpdate(
  uuid: string,
  patch: Partial<Pick<EditorArticle, 'title' | 'summary' | 'content'>> = {},
): void {
  const index = editorArticleStore.findIndex(a => a.uuid === uuid)
  if (index === -1) throw new Error(`文章 ${uuid} 不存在`)
  const existing = editorArticleStore[index]!
  editorArticleStore[index] = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
    version: existing.version + 1,
  }
}

export function createArticleMock(data: ArticleFormData): Promise<EditorArticle> {
  const failure = getMockApiFailure('/api/v1/articles')

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failure) {
        reject(createMockApiFailureError(failure))
        return
      }

      const now = new Date().toISOString()
      const article: EditorArticle = {
        uuid: generateUuid(),
        title: data.title,
        summary: data.summary,
        content: data.content,
        coverImageUrl: data.coverImageUrl,
        status: 'DRAFT',
        categories: mockCategories.filter(c => data.categoryIds.includes(c.uuid)),
        tags: data.tagNames,
        rejectReason: null,
        createdAt: now,
        updatedAt: now,
        version: 0,
      }
      editorArticleStore.push(article)
      resolve(article)
    }, 300)
  })
}

export function updateArticleMock(uuid: string, data: ArticleFormData): Promise<EditorArticle> {
  const failure = getMockApiFailure(`/api/v1/articles/${uuid}`)

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failure) {
        reject(createMockApiFailureError(failure))
        return
      }

      const index = editorArticleStore.findIndex(a => a.uuid === uuid)
      if (index === -1) {
        reject(new Error(`文章 ${uuid} 不存在`))
        return
      }
      const existing = editorArticleStore[index]!
      // 與後端一致：request 有帶 version 才比對（省略 = 不檢查，相容舊前端）
      if (data.version !== undefined && data.version !== existing.version) {
        reject(createConcurrentUpdateError())
        return
      }
      const updated: EditorArticle = {
        ...existing,
        title: data.title,
        summary: data.summary,
        content: data.content,
        coverImageUrl: data.coverImageUrl,
        categories: mockCategories.filter(c => data.categoryIds.includes(c.uuid)),
        tags: data.tagNames,
        updatedAt: new Date().toISOString(),
        version: existing.version + 1,
      }
      editorArticleStore[index] = updated
      resolve(updated)
    }, 300)
  })
}

export function getArticleForEditMock(uuid: string): Promise<EditorArticle | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const article = editorArticleStore.find(a => a.uuid === uuid) ?? null
      resolve(article)
    }, 300)
  })
}
