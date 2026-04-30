import apiClient from '../apiClient'
import type { ArticleFormData, EditorArticle, CategoryOption, ArticleStatus } from '../../types/editor'

interface BackendCategory {
  uuid: string
  name: string
  slug: string
  description?: string
  sortOrder?: number
}

interface BackendTagSummary {
  id: string
  name: string
  slug: string
}

interface BackendEditorArticle {
  uuid: string
  title: string
  summary: string
  content: string
  coverImageUrl: string | null
  status: ArticleStatus
  categories: BackendCategory[]
  tags: BackendTagSummary[]
  rejectReason: string | null
  createdAt: string
  updatedAt: string
}

function mapCategory(raw: BackendCategory): CategoryOption {
  return { id: raw.uuid, name: raw.name, slug: raw.slug }
}

function mapEditorArticle(raw: BackendEditorArticle): EditorArticle {
  return {
    uuid: raw.uuid,
    title: raw.title,
    summary: raw.summary,
    content: raw.content,
    coverImageUrl: raw.coverImageUrl,
    status: raw.status,
    categories: raw.categories.map(mapCategory),
    tags: raw.tags.map((t) => t.name),
    rejectReason: raw.rejectReason,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export const editorService = {
  async createArticle(data: ArticleFormData): Promise<EditorArticle> {
    const raw = await apiClient.post<unknown, BackendEditorArticle>('/api/v1/articles', data)
    return mapEditorArticle(raw)
  },

  async updateArticle(uuid: string, data: ArticleFormData): Promise<EditorArticle> {
    const raw = await apiClient.put<unknown, BackendEditorArticle>(`/api/v1/articles/${uuid}`, data)
    return mapEditorArticle(raw)
  },

  async getArticleForEdit(uuid: string): Promise<EditorArticle | null> {
    try {
      const raw = await apiClient.get<unknown, BackendEditorArticle>(`/api/v1/articles/${uuid}/edit`)
      return mapEditorArticle(raw)
    } catch (error) {
      console.error('Failed to fetch article for edit:', error)
      return null
    }
  },
}
