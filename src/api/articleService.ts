import apiClient from './apiClient';

// 這是文章的資料結構型別定義
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
  categories: string[];
  slug: string;
}

export interface ArticleDetailItem extends ArticleItem {
  content: string; // 後端回傳的原始 Markdown 字串
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
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
    // 對應後端: GET /api/v1/articles?pageNum={page}&pageSize={size}&categorySlug={category}&keyword={keyword}
    try {
      const params: Record<string, string> = {
        pageNum: page.toString(),
        pageSize: size.toString(),
      };

      if (category && category !== '全部') {
        params.categorySlug = category;
      }
      if (keyword) {
        params.keyword = keyword;
      }

      const data = await apiClient.get<unknown, PageResult<ArticleItem>>('/api/v1/articles', { params });
      return data;
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
      const data = await apiClient.get<unknown, ArticleDetailItem>(`/api/v1/articles/${uuid}`);
      return data;
    } catch (error) {
      console.error('Fetch article detail failed:', error);
      return null;
    }
  }
};
