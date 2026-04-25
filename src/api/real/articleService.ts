import apiClient from '../apiClient'
import { mapPageResult } from '../utils'
import type { BackendPageResult } from '../utils'
import type { PageResult } from '../../types/editor'

interface TagSummaryResponse {
  id: string
  name: string
  slug: string
}

interface CategorySummaryResponse {
  uuid: string
  name: string
  slug: string
}

interface BackendArticleBase {
  uuid: string
  title: string
  summary: string
  coverImageUrl: string | null
  authorNickname: string
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: string
  tags: TagSummaryResponse[]
  slug: string
}

interface BackendArticleDetail extends BackendArticleBase {
  content: string
  categories: CategorySummaryResponse[]
}

export interface ArticleCategory {
  uuid: string
  name: string
  slug: string
}

export interface ArticleItem {
  uuid: string
  title: string
  summary: string
  coverImageUrl: string | null
  authorNickname: string
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: string
  tags: string[]
  slug: string
}

export interface ArticleDetailItem extends ArticleItem {
  content: string
  categories: ArticleCategory[]
}

function mapArticle(raw: BackendArticleBase): ArticleItem {
  return {
    uuid: raw.uuid,
    title: raw.title,
    summary: raw.summary,
    coverImageUrl: raw.coverImageUrl,
    authorNickname: raw.authorNickname,
    viewCount: raw.viewCount,
    likeCount: raw.likeCount,
    commentCount: raw.commentCount,
    publishedAt: raw.publishedAt,
    tags: raw.tags.map((t) => t.name),
    slug: raw.slug,
  }
}

function mapArticleDetail(raw: BackendArticleDetail): ArticleDetailItem {
  return {
    ...mapArticle(raw),
    content: raw.content,
    categories: (raw.categories ?? []).map((c) => ({ uuid: c.uuid, name: c.name, slug: c.slug })),
  }
}

export const articleService = {
  async getArticles(page: number, size: number, category: string, keyword: string): Promise<PageResult<ArticleItem>> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        size: size.toString(),
      }
      if (category && category !== '全部') {
        params.categorySlug = category.toLowerCase()
      }
      const data = await apiClient.get<unknown, BackendPageResult<BackendArticleBase>>('/api/v1/articles', { params })
      return mapPageResult(data, mapArticle)
    } catch (error) {
      console.error('Fetch articles failed:', error)
      return { records: [], total: 0, size, current: page, pages: 0 }
    }
  },

  async getArticleByUuid(uuid: string): Promise<ArticleDetailItem | null> {
    try {
      const data = await apiClient.get<unknown, BackendArticleDetail>(`/api/v1/articles/${uuid}`)
      return mapArticleDetail(data)
    } catch (error) {
      console.error('Fetch article detail failed:', error)
      return null
    }
  },

  async getArticleBySlug(slug: string): Promise<ArticleDetailItem | null> {
    try {
      const data = await apiClient.get<unknown, BackendArticleDetail>(`/api/v1/articles/slug/${slug}`)
      return mapArticleDetail(data)
    } catch (error) {
      console.error('Fetch article by slug failed:', error)
      return null
    }
  },
}
