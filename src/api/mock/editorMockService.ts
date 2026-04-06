import type { ArticleFormData, EditorArticle } from '../../types/editor'
import { editorArticleStore, mockCategories } from './data'

function generateUuid(): string {
  return `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createArticleMock(data: ArticleFormData): Promise<EditorArticle> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date().toISOString()
      const article: EditorArticle = {
        uuid: generateUuid(),
        title: data.title,
        summary: data.summary,
        content: data.content,
        coverImageUrl: data.coverImageUrl,
        status: 'DRAFT',
        categories: mockCategories.filter(c => data.categoryIds.includes(c.id)),
        tags: data.tagNames,
        rejectReason: null,
        createdAt: now,
        updatedAt: now,
      }
      editorArticleStore.push(article)
      resolve(article)
    }, 300)
  })
}

export function updateArticleMock(uuid: string, data: ArticleFormData): Promise<EditorArticle> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = editorArticleStore.findIndex(a => a.uuid === uuid)
      if (index === -1) {
        reject(new Error(`文章 ${uuid} 不存在`))
        return
      }
      const existing = editorArticleStore[index]!
      const updated: EditorArticle = {
        ...existing,
        title: data.title,
        summary: data.summary,
        content: data.content,
        coverImageUrl: data.coverImageUrl,
        categories: mockCategories.filter(c => data.categoryIds.includes(c.id)),
        tags: data.tagNames,
        updatedAt: new Date().toISOString(),
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
