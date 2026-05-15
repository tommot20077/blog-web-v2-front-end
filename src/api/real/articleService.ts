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
  liked: boolean
  bookmarked?: boolean
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
  // List response 的分類名稱陣列；real backend list 尚未提供（mapper 設 []），
  // mock data 與 client-side category filter (useArticleFilters) 依賴此欄位
  categories?: string[]
}

export interface ArticleDetailItem extends Omit<ArticleItem, 'categories'> {
  content: string
  categories: ArticleCategory[]
  liked: boolean
  bookmarked: boolean
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
    // backend list response 尚未提供 categories；待後端補上後改 raw.categories.map(...)
    categories: [],
  }
}

function mapArticleDetail(raw: BackendArticleDetail): ArticleDetailItem {
  return {
    ...mapArticle(raw),
    content: raw.content,
    categories: (raw.categories ?? []).map((c) => ({ uuid: c.uuid, name: c.name, slug: c.slug })),
    liked: raw.liked,
    bookmarked: raw.bookmarked ?? false,
  }
}

export const articleService = {
  async getArticles(page: number, size: number, category: string, _keyword: string): Promise<PageResult<ArticleItem>> {
    try {
      const params: Record<string, string | number> = {
        page,
        size,
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
