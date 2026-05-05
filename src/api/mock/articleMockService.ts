import type { ArticleItem, ArticleDetailItem } from '../articleService';
import type { PageResult } from '../../types/editor';
import { allMockArticles, getMockArticleDetail } from './data';

// 模擬後端分頁與過濾邏輯
export function getArticlesMock(page: number, size: number, category: string, keyword: string): Promise<PageResult<ArticleItem>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = allMockArticles;

      // 1. 關鍵字過濾（大小寫不分，查 title / summary / tags）
      if (keyword && keyword.trim() !== '') {
        const kw = keyword.toLowerCase()
        filtered = filtered.filter(a =>
          a.title.toLowerCase().includes(kw) ||
          a.summary.toLowerCase().includes(kw) ||
          a.tags.some(t => t.toLowerCase().includes(kw))
        )
      }

      // 2. 分類過濾（依 categories 欄位比對）
      if (category && category !== '全部') {
        filtered = filtered.filter(a =>
          a.categories.some(c => c.toLowerCase() === category.toLowerCase())
        )
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

// 根據 Slug 取得單篇文章詳細內容（Mock 版本）
export function getArticleBySlugMock(slug: string): Promise<ArticleDetailItem | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const base = allMockArticles.find(a => a.slug === slug);
      if (!base) {
        resolve(null);
        return;
      }
      resolve(getMockArticleDetail(base.uuid));
    }, 500);
  });
}
