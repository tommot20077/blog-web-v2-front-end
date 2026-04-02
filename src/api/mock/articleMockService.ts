import type { PageResult, ArticleItem, ArticleDetailItem } from '../articleService';
import { allMockArticles, getMockArticleDetail } from './data';

// 模擬後端分頁與過濾邏輯
export function getArticlesMock(page: number, size: number, category: string, keyword: string): Promise<PageResult<ArticleItem>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered: ArticleItem[] = allMockArticles;

      // 1. 關鍵字過濾
      if (keyword && keyword.trim() !== '') {
        filtered = filtered.filter(a => a.title.includes(keyword) || a.summary.includes(keyword));
      }

      // 2. 分類過濾（用 tag 模擬 category 行為）
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

// 根據 UUID 取得單篇文章詳細內容（Mock 版本）
export function getArticleByUuidMock(uuid: string): Promise<ArticleDetailItem | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMockArticleDetail(uuid));
    }, 500);
  });
}
