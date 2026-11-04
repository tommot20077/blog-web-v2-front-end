import type { ArticleItem, ArticleDetailItem, ArchiveItem, ArticleListFilters } from '../articleService';
import type { PageResult } from '../../types/editor';
import { allMockArticles, getMockArticleDetail } from './data';

// 模擬後端分頁與過濾邏輯
export function getArticlesMock(
  page: number,
  size: number,
  category: string,
  keyword: string,
  filters: ArticleListFilters = {},
): Promise<PageResult<ArticleItem>> {
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

      // 3. 伺服器端篩選（與後端 tags／categorySlug 參數同語意，避免 mock 與 real 再度漂移）
      const tagSlugs = filters.tags ?? [];
      if (tagSlugs.length > 0) {
        filtered = filtered.filter(a => tagSlugs.every(s => (a.tagRefs ?? []).some(r => r.slug === s)))
      }
      const categorySlugs = filters.categorySlugs ?? [];
      if (categorySlugs.length > 0) {
        filtered = filtered.filter(a => a.categories.some(c => categorySlugs.includes(c.toLowerCase())))
      }

      const authorUuids = filters.authorUuids ?? [];
      if (authorUuids.length > 0) {
        filtered = filtered.filter(a => a.authorUuid !== null && authorUuids.includes(a.authorUuid));
      }
      const days = filters.publishedWithinDays;
      if (days !== undefined && days > 0) {
        const cutoff = Date.now() - days * 86400000;
        filtered = filtered.filter(a => new Date(a.publishedAt).getTime() >= cutoff);
      }

      // 4. 排序（對應後端：未知值退回 latest；每種排序附 id DESC tie-breaker，這裡以 uuid 降序代之）
      const byUuidDesc = (a: ArticleItem, b: ArticleItem) => (a.uuid < b.uuid ? 1 : a.uuid > b.uuid ? -1 : 0);
      const sorted = [...filtered];
      if (filters.sort === 'popular') {
        sorted.sort((a, b) => b.viewCount - a.viewCount || byUuidDesc(a, b));
      } else if (filters.sort === 'commented') {
        sorted.sort((a, b) => b.commentCount - a.commentCount || byUuidDesc(a, b));
      } else {
        sorted.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || byUuidDesc(a, b));
      }
      filtered = sorted;

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

// 年度歸檔精簡投影（Mock 版本）
// 重用 allMockArticles，投影成 ArchiveItem 並依 publishedAt 由新到舊排序，
// 對齊後端 /api/v1/articles/archive 的回傳契約。
export function getArchiveMock(): Promise<ArchiveItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const items: ArchiveItem[] = allMockArticles.map(a => ({
        uuid: a.uuid,
        title: a.title,
        slug: a.slug,
        publishedAt: a.publishedAt,
        tags: a.tags,
      }));
      items.sort((x, y) => y.publishedAt.localeCompare(x.publishedAt));
      resolve(items);
    }, 600);
  });
}
