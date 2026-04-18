import apiClient from './apiClient';
import { mapPageResult } from './utils';
import type { BackendPageResult } from './utils';
import type { PageResult } from '../types/editor';

interface TagSummaryResponse {
  id: string;
  name: string;
  slug: string;
}

// 後端回傳的原始文章結構（tags 為物件陣列）
interface BackendArticleBase {
  uuid: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  authorNickname: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  tags: TagSummaryResponse[];
  slug: string;
}

interface BackendArticleDetail extends BackendArticleBase {
  content: string;
}

// 前端使用的文章結構（tags 已映射為字串陣列）
export interface ArticleItem {
  uuid: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  authorNickname: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  tags: string[];
  slug: string;
}

export interface ArticleDetailItem extends ArticleItem {
  content: string; // 後端回傳的原始 Markdown 字串
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
  };
}

function mapArticleDetail(raw: BackendArticleDetail): ArticleDetailItem {
  return { ...mapArticle(raw), content: raw.content };
}

export const articleService = {
  /**
   * 取得文章列表（根據 env 決定要打 API 還是委派給 Mock）
   */
  async getArticles(page: number, size: number, category: string, keyword: string): Promise<PageResult<ArticleItem>> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getArticlesMock } = await import('./mock/articleMockService');
      return getArticlesMock(page, size, category, keyword);
    }

    // --- 【API 模式】呼叫真實後端 ---
    // 對應後端: GET /api/v1/articles?page={page}&size={size}&categorySlug={category}&keyword={keyword}
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        size: size.toString(),
      };

      if (category && category !== '全部') {
        params.categorySlug = category;
      }
      if (keyword) {
        params.keyword = keyword;
      }

      const data = await apiClient.get<unknown, BackendPageResult<BackendArticleBase>>('/api/v1/articles', { params });
      return mapPageResult(data, mapArticle);
    } catch (error) {
      console.error('Fetch articles failed:', error);
      return { records: [], total: 0, size, current: page, pages: 0 };
    }
  },

  /**
   * 根據 UUID 取得單篇文章詳細內容
   */
  async getArticleByUuid(uuid: string): Promise<ArticleDetailItem | null> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getArticleByUuidMock } = await import('./mock/articleMockService');
      return getArticleByUuidMock(uuid);
    }

    try {
      const data = await apiClient.get<unknown, BackendArticleDetail>(`/api/v1/articles/${uuid}`);
      return mapArticleDetail(data);
    } catch (error) {
      console.error('Fetch article detail failed:', error);
      return null;
    }
  },

  /**
   * 根據 Slug 取得單篇文章詳細內容
   */
  async getArticleBySlug(slug: string): Promise<ArticleDetailItem | null> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getArticleBySlugMock } = await import('./mock/articleMockService');
      return getArticleBySlugMock(slug);
    }
    try {
      const data = await apiClient.get<unknown, BackendArticleDetail>(`/api/v1/articles/slug/${slug}`);
      return mapArticleDetail(data);
    } catch (error) {
      console.error('Fetch article by slug failed:', error);
      return null;
    }
  },
};
