import type { ArticleFormData, EditorArticle } from '../types/editor'

export const editorService = {
  async createArticle(data: ArticleFormData): Promise<EditorArticle> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { editorService: svc } = await import('./mock/editorService')
      return svc.createArticle(data)
    }
    const { editorService: svc } = await import('./real/editorService')
    return svc.createArticle(data)
  },

  async updateArticle(uuid: string, data: ArticleFormData): Promise<EditorArticle> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { editorService: svc } = await import('./mock/editorService')
      return svc.updateArticle(uuid, data)
    }
    const { editorService: svc } = await import('./real/editorService')
    return svc.updateArticle(uuid, data)
  },

  async getArticleForEdit(uuid: string): Promise<EditorArticle | null> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { editorService: svc } = await import('./mock/editorService')
      return svc.getArticleForEdit(uuid)
    }
    const { editorService: svc } = await import('./real/editorService')
    return svc.getArticleForEdit(uuid)
  },
}
