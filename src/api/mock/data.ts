import type { ArticleItem, ArticleDetailItem } from '../articleService';
import { mockMarkdownContent } from './mockArticleContent';

// 產生完整的模擬資料做為母體
export const allMockArticles: ArticleItem[] = Array.from({ length: 50 }).map((_, i) => {
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

// 根據 uuid 取得含 content 的文章詳情
export function getMockArticleDetail(uuid: string): ArticleDetailItem | null {
  const base = allMockArticles.find(a => a.uuid === uuid);
  if (!base) return null;
  return { ...base, content: mockMarkdownContent };
}
