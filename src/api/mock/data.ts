import type { ArticleItem, ArticleDetailItem } from '../articleService';
import type { RecommendArticleResponse } from '../recommendService';
import type { TagDetailResponse } from '../tagService';
import { mockMarkdownContent } from './mockArticleContent';

// 模擬作者名稱池
const MOCK_AUTHORS = ['Yuan', '小明', 'TechLead', '旅行者', 'DevGuru'] as const;

// 產生完整的模擬資料做為母體
export const allMockArticles: ArticleItem[] = Array.from({ length: 50 }).map((_, i) => {
  const isFrontend = i % 2 === 0;
  return {
    uuid: `article-${i + 1}`,
    title: isFrontend ? `深入理解 Vue 3 Reactivity 的底層原理 - 篇章 ${i + 1}` : `微服務架構下的 API Gateway 設計 - 實踐 ${i + 1}`,
    summary: '在這篇文章中，我們將探討現代前端與後端的架構演進，並深入探討如何在實務應用中發揮技術的最大效益。這裡是一段詳細的摘要內容來填補版面。',
    coverImageUrl: `https://picsum.photos/seed/article-${i + 1}/800/400`,
    authorNickname: MOCK_AUTHORS[i % MOCK_AUTHORS.length],
    viewCount: Math.floor(Math.random() * 5000),
    likeCount: Math.floor(Math.random() * 200),
    commentCount: Math.floor(Math.random() * 50),
    publishedAt: `2026-03-${String((i % 30) + 1).padStart(2, '0')}`,
    tags: isFrontend ? ['Vue', 'Frontend'] : ['Backend', 'Microservices', 'DevOps'],
    categories: isFrontend ? ['Frontend'] : ['Backend'],
    slug: `article-slug-${i + 1}`,
  };
});

// 根據 uuid 取得含 content 的文章詳情
export function getMockArticleDetail(uuid: string): ArticleDetailItem | null {
  const base = allMockArticles.find(a => a.uuid === uuid);
  if (!base) return null;
  return { ...base, content: mockMarkdownContent };
}

// 熱門標籤 mock 資料
export const allMockTags: TagDetailResponse[] = [
  { uuid: 'tag-1', name: 'Vue', slug: 'vue', articleCount: 18 },
  { uuid: 'tag-2', name: 'React', slug: 'react', articleCount: 12 },
  { uuid: 'tag-3', name: 'TypeScript', slug: 'typescript', articleCount: 15 },
  { uuid: 'tag-4', name: 'Tailwind CSS', slug: 'tailwind-css', articleCount: 9 },
  { uuid: 'tag-5', name: 'Node.js', slug: 'nodejs', articleCount: 11 },
  { uuid: 'tag-6', name: 'Docker', slug: 'docker', articleCount: 8 },
  { uuid: 'tag-7', name: 'Kubernetes', slug: 'kubernetes', articleCount: 7 },
  { uuid: 'tag-8', name: 'PostgreSQL', slug: 'postgresql', articleCount: 6 },
  { uuid: 'tag-9', name: 'Redis', slug: 'redis', articleCount: 5 },
  { uuid: 'tag-10', name: 'Elasticsearch', slug: 'elasticsearch', articleCount: 4 },
  { uuid: 'tag-11', name: 'Spring Boot', slug: 'spring-boot', articleCount: 10 },
  { uuid: 'tag-12', name: 'GraphQL', slug: 'graphql', articleCount: 3 },
  { uuid: 'tag-13', name: 'CI/CD', slug: 'ci-cd', articleCount: 6 },
  { uuid: 'tag-14', name: 'Testing', slug: 'testing', articleCount: 8 },
  { uuid: 'tag-15', name: 'DevOps', slug: 'devops', articleCount: 7 },
  { uuid: 'tag-16', name: 'Architecture', slug: 'architecture', articleCount: 5 },
  { uuid: 'tag-17', name: 'Security', slug: 'security', articleCount: 4 },
  { uuid: 'tag-18', name: 'Performance', slug: 'performance', articleCount: 3 },
  { uuid: 'tag-19', name: 'Rust', slug: 'rust', articleCount: 2 },
  { uuid: 'tag-20', name: 'Go', slug: 'go', articleCount: 3 },
];

// 主題專區 mock 資料
export interface ZoneEntry {
  slug: string;
  name: string;
  description: string;
  iconName: string;
  articleCount: number;
  coverImageUrl: string;
}

export const mockZoneEntries: ZoneEntry[] = [
  {
    slug: 'tech',
    name: '技術',
    description: '前端、後端、DevOps 技術文章',
    iconName: 'code',
    articleCount: 35,
    coverImageUrl: 'https://picsum.photos/seed/zone-tech/800/400',
  },
  {
    slug: 'travel',
    name: '旅遊',
    description: '世界各地的旅行記錄',
    iconName: 'globe',
    articleCount: 12,
    coverImageUrl: 'https://picsum.photos/seed/zone-travel/800/400',
  },
  {
    slug: 'photography',
    name: '攝影',
    description: '用鏡頭捕捉瞬間',
    iconName: 'camera',
    articleCount: 8,
    coverImageUrl: 'https://picsum.photos/seed/zone-photo/800/400',
  },
];
