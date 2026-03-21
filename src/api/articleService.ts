// 這是文章的資料結構型別定義
export interface ArticleItem {
  uuid: string;
  title: string;
  summary: string;
  viewCount: number;
  publishedAt: string;
  tags: string[];
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

// 產生完整的模擬資料做為母體
const allMockArticles: ArticleItem[] = Array.from({ length: 50 }).map((_, i) => {
  const isFrontend = i % 2 === 0;
  return {
    uuid: `article-${i + 1}`,
    title: isFrontend ? `深入理解 Vue 3 Reactivity 的底層原理 - 篇章 ${i + 1}` : `微服務架構下的 API Gateway 設計 - 實踐 ${i + 1}`,
    summary: '在這篇文章中，我們將探討現代前端與後端的架構演進，並深入探討如何在實務應用中發揮技術的最大效益。這裡是一段詳細的摘要內容來填補版面。',
    viewCount: Math.floor(Math.random() * 5000),
    publishedAt: `2026-03-${String((i % 30) + 1).padStart(2, '0')}`,
    tags: isFrontend ? ['Vue', 'Frontend'] : ['Backend', 'Microservices', 'DevOps']
  };
});

// 從獨立檔案匯入 Mock Markdown 內容（避免模板字串跳脫問題）
import { mockMarkdownContent } from './mockArticleContent';

export const articleService = {
  /**
   * 取得文章列表 (根據 env 決定要打 API 還是回傳 Mock)
   */
  async getArticles(page: number, size: number, category: string, keyword: string): Promise<PageResult<ArticleItem>> {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';

    if (useMock) {
      // --- 【Mock 模式】模擬後端分頁與過濾邏輯 ---
      return new Promise((resolve) => {
        setTimeout(() => {
          let filtered = allMockArticles;

          // 1. 關鍵字過濾
          if (keyword && keyword.trim() !== '') {
            filtered = filtered.filter(a => a.title.includes(keyword) || a.summary.includes(keyword));
          }

          // 2. 分類過濾 (這裡簡單用 tag 模擬 category 行為)
          if (category && category !== '全部') {
            filtered = filtered.filter(a => a.tags.some(t => t.toLowerCase() === category.toLowerCase()));
          }

          const total = filtered.length;
          const pages = Math.ceil(total / size);
          const start = (page - 1) * size;
          const records = filtered.slice(start, start + size);

          resolve({
            records,
            total,
            size,
            current: page,
            pages
          });
        }, 600); // 模擬網路延遲 0.6 秒
      });
    }

    // --- 【API 模式】呼叫真實後端 ---
    // 對應後端: GET /api/v1/articles?pageNum={page}&pageSize={size}&categorySlug={category}&keyword={keyword}
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const params = new URLSearchParams({
        pageNum: page.toString(),
        pageSize: size.toString()
      });
      
      if (category && category !== '全部') {
        params.append('categorySlug', category);
      }
      if (keyword) {
        params.append('keyword', keyword);
      }

      const response = await fetch(`${baseUrl}/api/v1/articles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const resData = await response.json();
      
      // 依據後端 ApiResponse<PageResult<T>> 的結構解開
      if (resData.code === 200 && resData.data) {
        return resData.data as PageResult<ArticleItem>;
      } else {
        throw new Error(resData.message || 'API Error');
      }
    } catch (error) {
      console.error('Fetch articles failed:', error);
      return { records: [], total: 0, size, current: page, pages: 0 };
    }
  },

  /**
   * 根據 UUID 取得單篇文章詳細內容
   */
  async getArticleByUuid(uuid: string): Promise<ArticleDetailItem | null> {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';

    if (useMock) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const baseArticle = allMockArticles.find(a => a.uuid === uuid);
          if (!baseArticle) {
            resolve(null);
            return;
          }
          
          resolve({
            ...baseArticle,
            content: mockMarkdownContent
          });
        }, 500);
      });
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/v1/articles/${uuid}`);
      if (!response.ok) throw new Error('API fetch failed');
      const resData = await response.json();
      
      if (resData.code === 200 && resData.data) {
        return resData.data as ArticleDetailItem;
      }
      return null;
    } catch (error) {
      console.error('Fetch article detail failed:', error);
      return null;
    }
  }
};
