import apiClient from '../apiClient'
import { mapPageResult } from '../utils'
import type { BackendPageResult } from '../utils'
import type { PageResult } from '../../types/editor'
import type { TocEntry } from '../../types/article'

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
  // 後端上線前欄位可能缺失（見 docs/superpowers/specs/2026-07-20-article-toc-design.md）；
  // 無 heading 的文章回傳空陣列 []，非 null。
  toc?: TocEntry[]
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
  // 選填：後端未上線前欄位可能缺失，消費端（ArticleDetail.vue）需防禦性地視為 []。
  toc?: TocEntry[]
}

/**
 * 年度歸檔精簡投影
 * 對應後端 ArticleArchiveResponse（uuid / title / slug / publishedAt / tags）
 * tags 為標籤名稱字串陣列；後端已依 publishedAt 由新到舊排序。
 */
export interface ArchiveItem {
  uuid: string
  title: string
  slug: string
  publishedAt: string
  tags: string[]
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
    toc: raw.toc,
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

  async getArchive(): Promise<ArchiveItem[]> {
    // 失敗時不吞錯：向上拋出讓 view 區分「載入失敗」與「沒有文章」，
    // 避免網路錯誤被誤顯示為空歸檔。後端 tags 已是字串陣列、且已依 publishedAt desc 排序，無需額外映射。
    return await apiClient.get<unknown, ArchiveItem[]>('/api/v1/articles/archive')
  },
}
