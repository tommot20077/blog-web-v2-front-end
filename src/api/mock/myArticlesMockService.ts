import type { MyArticle, ArticleStatusFilter, PageResult } from '../../types/editor'
import { editorArticleStore, toMyArticle } from './data'

export function getMyArticlesMock(
  filter: ArticleStatusFilter,
  page: number,
  size: number
): Promise<PageResult<MyArticle>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = filter === 'ALL'
        ? editorArticleStore
        : editorArticleStore.filter(a => a.status === filter)

      const total = filtered.length
      const pages = Math.max(1, Math.ceil(total / size))
      const start = (page - 1) * size
      const records = filtered.slice(start, start + size).map(toMyArticle)

      resolve({ records, total, size, current: page, pages })
    }, 300)
  })
}

export function deleteMyArticleMock(uuid: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = editorArticleStore.findIndex(a => a.uuid === uuid)
      if (index === -1) {
        reject(new Error(`文章 ${uuid} 不存在`))
        return
      }
      editorArticleStore.splice(index, 1)
      resolve()
    }, 300)
  })
}

export function submitForReviewMock(uuid: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const article = editorArticleStore.find(a => a.uuid === uuid)
      if (!article) {
        reject(new Error(`文章 ${uuid} 不存在`))
        return
      }
      article.status = 'PENDING_REVIEW'
      article.updatedAt = new Date().toISOString()
      resolve()
    }, 300)
  })
}
