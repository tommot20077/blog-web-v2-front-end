import type { ArticleItem, ArticleDetailItem } from '../articleService';
import type { RecommendArticleResponse } from '../recommendService';
import type { TagDetailResponse } from '../tagService';
import { mockMarkdownContent } from './mockArticleContent';
import type { CategoryOption, TagSuggestion, QuotaInfo, EditorArticle, MyArticle, PendingArticle } from '../../types/editor';

// 模擬作者名稱池
const MOCK_AUTHORS = ['Yuan', '小明', 'TechLead', '旅行者', 'DevGuru'] as const;

// 產生 50 篇 Frontend / Backend 交替的模擬文章
const baseMockArticles: ArticleItem[] = Array.from({ length: 50 }).map((_, i) => {
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

// Life 分類補充文章
const lifeMockArticles: ArticleItem[] = [
  {
    uuid: 'life-article-1',
    title: '工程師的旅行日記 — 峇里島遠端工作體驗',
    summary: '分享在峇里島一邊寫程式一邊享受海景的生活日記，以及如何在異鄉保持工作效率。',
    coverImageUrl: 'https://picsum.photos/seed/life-1/800/400',
    authorNickname: '旅行者',
    viewCount: 3200,
    likeCount: 156,
    commentCount: 28,
    publishedAt: '2026-04-01',
    tags: ['Life', 'Remote Work', 'Travel'],
    categories: ['Life'],
    slug: 'life-bali-remote-work',
  },
  {
    uuid: 'life-article-2',
    title: '技術人讀書筆記 — 原子習慣改變了我的開發習慣',
    summary: '用《原子習慣》的框架重新設計每日 coding 例行公事，養成穩定輸出的寫作習慣。',
    coverImageUrl: 'https://picsum.photos/seed/life-2/800/400',
    authorNickname: 'Yuan',
    viewCount: 1800,
    likeCount: 92,
    commentCount: 15,
    publishedAt: '2026-04-03',
    tags: ['Life', 'Productivity', 'Books'],
    categories: ['Life'],
    slug: 'life-atomic-habits',
  },
];

// 完整母體 = 50 篇基礎文章 + Life 分類文章
export const allMockArticles: ArticleItem[] = [
  ...baseMockArticles,
  ...lifeMockArticles,
];

// 根據 uuid 取得含 content 的文章詳情
export function getMockArticleDetail(uuid: string): ArticleDetailItem | null {
  const base = allMockArticles.find(a => a.uuid === uuid);
  if (!base) return null;
  return { ...base, content: mockMarkdownContent, categories: [], liked: false };
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

// ── 編輯器 / 我的文章 / Admin 種子資料 ──────────────────────────────────────

export const mockCategories: CategoryOption[] = [
  { id: 'cat-1', name: 'Vue', slug: 'vue' },
  { id: 'cat-2', name: 'React', slug: 'react' },
  { id: 'cat-3', name: 'TypeScript', slug: 'typescript' },
  { id: 'cat-4', name: 'DevOps', slug: 'devops' },
  { id: 'cat-5', name: 'Backend', slug: 'backend' },
  { id: 'cat-6', name: 'Frontend', slug: 'frontend' },
  { id: 'cat-7', name: 'Life', slug: 'life' },
];

export const mockTagPool: TagSuggestion[] = [
  { name: 'Vue', articleCount: 18 },
  { name: 'Vue Router', articleCount: 8 },
  { name: 'Vite', articleCount: 10 },
  { name: 'TypeScript', articleCount: 15 },
  { name: 'Tailwind CSS', articleCount: 9 },
  { name: 'Node.js', articleCount: 11 },
  { name: 'Docker', articleCount: 8 },
  { name: 'CI/CD', articleCount: 6 },
  { name: 'Testing', articleCount: 8 },
  { name: 'Performance', articleCount: 3 },
  { name: 'Pinia', articleCount: 7 },
  { name: 'Playwright', articleCount: 4 },
];

export const mockQuota: QuotaInfo = {
  usedBytes: 52_428_800,      // 50 MB
  limitBytes: 104_857_600,    // 100 MB
  remainingBytes: 52_428_800, // 50 MB remaining
};

// 各狀態文章的種子資料（用於「我的文章」和 Admin）
export const mockEditorArticles: EditorArticle[] = [
  {
    uuid: 'editor-draft-1',
    title: '草稿文章：Vue 3 Composition API 深入解析',
    summary: '深入探討 Composition API 的設計理念與實踐',
    content: '# Vue 3 Composition API\n\n這是一篇草稿文章...',
    coverImageUrl: null,
    status: 'DRAFT',
    categories: [{ id: 'cat-1', name: 'Vue', slug: 'vue' }],
    tags: ['Vue', 'TypeScript'],
    rejectReason: null,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z',
  },
  {
    uuid: 'editor-pending-1',
    title: '待審核文章：Pinia 狀態管理最佳實踐',
    summary: '從零開始學習 Pinia，掌握 Vue 3 狀態管理',
    content: '# Pinia 狀態管理\n\n這篇文章正在審核中...',
    coverImageUrl: 'https://picsum.photos/seed/pending-1/800/400',
    status: 'PENDING_REVIEW',
    categories: [{ id: 'cat-1', name: 'Vue', slug: 'vue' }],
    tags: ['Vue', 'Pinia'],
    rejectReason: null,
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-20T09:00:00Z',
  },
  {
    uuid: 'editor-pending-2',
    title: '待審核文章：TypeScript 進階技巧整理',
    summary: 'TypeScript 泛型、裝飾器與型別守衛的實際應用',
    content: '# TypeScript 進階技巧\n\n第二篇待審文章...',
    coverImageUrl: null,
    status: 'PENDING_REVIEW',
    categories: [{ id: 'cat-3', name: 'TypeScript', slug: 'typescript' }],
    tags: ['TypeScript'],
    rejectReason: null,
    createdAt: '2026-03-12T10:00:00Z',
    updatedAt: '2026-03-22T14:00:00Z',
  },
  {
    uuid: 'editor-published-1',
    title: '已發布：Vite 建構工具完全指南',
    summary: '從配置到優化，全面掌握 Vite 的使用方式',
    content: '# Vite 完全指南\n\n已發布文章...',
    coverImageUrl: 'https://picsum.photos/seed/published-1/800/400',
    status: 'PUBLISHED',
    categories: [{ id: 'cat-1', name: 'Vue', slug: 'vue' }],
    tags: ['Vite', 'Vue'],
    rejectReason: null,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-15T16:00:00Z',
  },
  {
    uuid: 'editor-rejected-1',
    title: '被退回：Docker 容器化部署入門',
    summary: '從基礎開始學習 Docker，逐步掌握容器化部署',
    content: '# Docker 入門\n\n被退回的文章...',
    coverImageUrl: null,
    status: 'REJECTED',
    categories: [{ id: 'cat-4', name: 'DevOps', slug: 'devops' }],
    tags: ['Docker', 'DevOps'],
    rejectReason: '文章內容過於簡略，請補充更多實際案例與程式碼範例，確保讀者能從中獲得實際幫助。',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-05T11:00:00Z',
  },
  {
    uuid: 'editor-archived-1',
    title: '已封存：舊版 Vue CLI 使用指南',
    summary: '這是一篇關於舊版 Vue CLI 的文章，現已封存',
    content: '# Vue CLI 指南\n\n已封存的舊文章...',
    coverImageUrl: null,
    status: 'ARCHIVED',
    categories: [{ id: 'cat-1', name: 'Vue', slug: 'vue' }],
    tags: ['Vue'],
    rejectReason: null,
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-12-01T10:00:00Z',
  },
];

// 可變的 in-memory 文章儲存（編輯器 CRUD 操作對象）
export let editorArticleStore: EditorArticle[] = [...mockEditorArticles];

export function resetEditorArticleStore(): void {
  editorArticleStore = [...mockEditorArticles];
}

// 將 EditorArticle 轉換為 MyArticle 格式（列表用）
export function toMyArticle(a: EditorArticle): MyArticle {
  return {
    uuid: a.uuid,
    title: a.title,
    summary: a.summary,
    coverImageUrl: a.coverImageUrl,
    status: a.status,
    tags: a.tags,
    rejectReason: a.rejectReason,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
  };
}

// 將 EditorArticle 轉換為 PendingArticle 格式（管理員待審列表用）
export function toPendingArticle(a: EditorArticle): PendingArticle {
  return {
    ...toMyArticle(a),
    authorNickname: 'Mock Author',
  };
}
