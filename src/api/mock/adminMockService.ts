import type { EditorArticle } from '../../types/editor'
import { editorArticleStore } from './data'

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
