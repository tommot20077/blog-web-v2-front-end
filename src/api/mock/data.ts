import type { ArticleItem, ArticleDetailItem } from '../articleService';
import type { TagDetailResponse } from '../tagService';
import { mockMarkdownContent } from './mockArticleContent';
import type { CategoryOption, TagSuggestion, QuotaInfo, EditorArticle, MyArticle, PendingArticle } from '../../types/editor';
import { MOCK_AUTHOR_PROFILES } from './profiles';
import { ALL_MOCK_TAGS } from './tagRegistry';

type MockCategoryOption = CategoryOption & { uuid: string };
type MockArticleItem = ArticleItem & { categories: string[] };

const yuan = MOCK_AUTHOR_PROFILES.yuan.nickname;
const han = MOCK_AUTHOR_PROFILES.han.nickname;
const mira = MOCK_AUTHOR_PROFILES.mira.nickname;
const chen = MOCK_AUTHOR_PROFILES.chen.nickname;

function img(seed: string): string {
  return `https://picsum.photos/seed/${seed}/800/400`;
}

function slugifyTag(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
}

const articles2023: MockArticleItem[] = [
  {
    uuid: 'a-2023-01', title: '為什麼我又重寫了一次 useTheme()',
    summary: '從 v-bind:class 到 CSS variables，再到 useTheme composable，兩年內的第三次重構，這次我終於想清楚了。',
    coverImageUrl: img('a-2023-01'), authorNickname: yuan, viewCount: 4120, likeCount: 168, commentCount: 24,
    publishedAt: '2023-04-08', tags: ['Vue 3', 'CSS'], categories: ['Frontend'], slug: 'rewriting-use-theme',
  },
  {
    uuid: 'a-2023-02', title: 'TypeScript 的 const generic 解開了我半年的 prop type 苦惱',
    summary: '從 Vue 3.4 開始，type T extends readonly any[] 終於可以推導出 literal tuple，再也不用手動 as const。',
    coverImageUrl: img('a-2023-02'), authorNickname: yuan, viewCount: 2890, likeCount: 142, commentCount: 18,
    publishedAt: '2023-04-21', tags: ['TypeScript', 'Vue 3'], categories: ['Frontend'], slug: 'const-generic-saved-me',
  },
  {
    uuid: 'a-2023-03', title: 'CSS subgrid 終於可以用了，但我發現它解不了我以為的問題',
    summary: '原本期待 subgrid 能讓 card grid 內的元素垂直對齊，實際試了才發現問題在我的 design system，不在 CSS。',
    coverImageUrl: img('a-2023-03'), authorNickname: yuan, viewCount: 3340, likeCount: 156, commentCount: 31,
    publishedAt: '2023-05-12', tags: ['CSS'], categories: ['Frontend'], slug: 'subgrid-not-the-answer',
  },
  {
    uuid: 'a-2023-04', title: 'Vite 5 升上去之後，我終於拿掉了三個 polyfill',
    summary: '原本為了 IE11 留的舊 plugin、為 Safari 14 留的 ResizeObserver polyfill，Vite 5 之後這些可以乾淨拔掉。',
    coverImageUrl: img('a-2023-04'), authorNickname: yuan, viewCount: 2110, likeCount: 89, commentCount: 12,
    publishedAt: '2023-06-03', tags: ['Vite', 'Vue 3'], categories: ['Frontend'], slug: 'vite-5-polyfill-cleanup',
  },
  {
    uuid: 'a-2023-05', title: 'CSS 動畫的時間曲線，我不再用 ease-in-out',
    summary: 'cubic-bezier(0.16, 1, 0.3, 1) 才是我這一年來最常用的 easing，因為它讓互動的感覺更乾淨。',
    coverImageUrl: img('a-2023-05'), authorNickname: yuan, viewCount: 5210, likeCount: 248, commentCount: 42,
    publishedAt: '2023-07-09', tags: ['Animation', 'CSS'], categories: ['Frontend'], slug: 'easing-i-actually-use',
  },
  {
    uuid: 'a-2023-06', title: '我們的 e2e 從 Cypress 搬到 Playwright 之後',
    summary: '速度快了 3 倍、flake 從每週 5 次降到每月 1 次。但我們也踩到三個沒人講的雷。',
    coverImageUrl: img('a-2023-06'), authorNickname: yuan, viewCount: 6480, likeCount: 312, commentCount: 58,
    publishedAt: '2023-08-19', tags: ['Testing', 'CI/CD'], categories: ['Practice'], slug: 'cypress-to-playwright',
  },
  {
    uuid: 'a-2023-07', title: 'TDD 在前端到底做不做得起來：我做了一年的觀察',
    summary: '我以為前端 TDD 是某種烏托邦，做了一年發現可以但條件很挑，元件純不純、storybook 在不在都會影響。',
    coverImageUrl: img('a-2023-07'), authorNickname: yuan, viewCount: 4720, likeCount: 198, commentCount: 67,
    publishedAt: '2023-10-04', tags: ['TDD', 'Testing'], categories: ['Practice'], slug: 'frontend-tdd-one-year-in',
  },
  {
    uuid: 'a-2023-08', title: '我為什麼想搞懂自己 API 的 N+1 問題',
    summary: '前端工程師不該只丟 issue 給後端。某天 Han 提醒我看 console 之後，我學會看 PostgreSQL 的 EXPLAIN ANALYZE。',
    coverImageUrl: img('a-2023-08'), authorNickname: yuan, viewCount: 3160, likeCount: 134, commentCount: 28,
    publishedAt: '2023-11-15', tags: ['PostgreSQL', 'Performance'], categories: ['Backend'], slug: 'frontend-cares-about-n-plus-one',
  },
  {
    uuid: 'a-2023-09', title: '從工程師轉去做技術 lead 的第一年我學到什麼',
    summary: '不是技術判斷，不是溝通，而是忍住不寫 code。我用了一整年才學會把鍵盤交給隊友。',
    coverImageUrl: img('a-2023-09'), authorNickname: yuan, viewCount: 8120, likeCount: 421, commentCount: 89,
    publishedAt: '2023-12-22', tags: ['Career'], categories: ['Life'], slug: 'first-year-as-tech-lead',
  },
  {
    uuid: 'a-2023-10', title: 'Spring Boot 3.2 的 Virtual Threads 真的可以用了嗎',
    summary: '生產環境跑了三個月，QPS 提升 4 倍但有兩個 pinning 雷。整理我們踩到的所有問題。',
    coverImageUrl: img('a-2023-10'), authorNickname: han, viewCount: 5890, likeCount: 287, commentCount: 51,
    publishedAt: '2023-09-02', tags: ['Spring', 'Performance'], categories: ['Backend'], slug: 'virtual-threads-in-production',
  },
  {
    uuid: 'a-2023-11', title: 'PostgreSQL 14 的 SEARCH 跟 CYCLE 子句真的不夠看',
    summary: '為了組織樹遞迴查詢，我們從 hard-coded recursive CTE 改成 SEARCH BREADTH，結果 plan 反而變糟。',
    coverImageUrl: img('a-2023-11'), authorNickname: han, viewCount: 2340, likeCount: 98, commentCount: 19,
    publishedAt: '2023-10-18', tags: ['PostgreSQL'], categories: ['Backend'], slug: 'pg-recursive-cte-pitfall',
  },
  {
    uuid: 'a-2023-12', title: 'Redis Streams 取代 Kafka 的三個適用場景',
    summary: '不是每個 event-driven system 都需要 Kafka 的 partitioning。當 throughput 小於 10k/s，Redis Streams 是更便宜的選擇。',
    coverImageUrl: img('a-2023-12'), authorNickname: han, viewCount: 4180, likeCount: 211, commentCount: 36,
    publishedAt: '2023-12-05', tags: ['Redis', 'Microservices'], categories: ['Backend'], slug: 'redis-streams-vs-kafka',
  },
];

const articles2024: MockArticleItem[] = [
  {
    uuid: 'a-2024-01', title: '我把 React 加進原本純 Vue 的專案，後悔了三件事',
    summary: '為了 hire 而引入 React，預期省的時間都被吃掉了。寫給想 hybrid 的 lead 看的決策後悔錄。',
    coverImageUrl: img('a-2024-01'), authorNickname: yuan, viewCount: 9210, likeCount: 487, commentCount: 124,
    publishedAt: '2024-01-14', tags: ['React', 'Vue 3'], categories: ['Frontend'], slug: 'mixing-react-into-vue',
  },
  {
    uuid: 'a-2024-02', title: 'Tailwind v4 的 oklch 配色，我終於理解 design token 該怎麼設計',
    summary: '從 hex 到 hsl 到 oklch，每換一次都覺得是工具進步。實際是我的色彩思維在被工具教育。',
    coverImageUrl: img('a-2024-02'), authorNickname: yuan, viewCount: 6420, likeCount: 318, commentCount: 47,
    publishedAt: '2024-03-22', tags: ['Tailwind', 'Design System', 'Color'], categories: ['Frontend'], slug: 'tailwind-v4-oklch',
  },
  {
    uuid: 'a-2024-03', title: '我的 design token 命名規則第三次大改',
    summary: 'color.brand.primary 到 color.action.primary，再到 semantic.action，這次重命名讓元件語意終於穩定。',
    coverImageUrl: img('a-2024-03'), authorNickname: yuan, viewCount: 3890, likeCount: 187, commentCount: 26,
    publishedAt: '2024-06-08', tags: ['Design System', 'CSS'], categories: ['Design'], slug: 'design-token-naming-v3',
  },
  {
    uuid: 'a-2024-04', title: 'GitHub Actions 裡 cache vue 的 .vite 整整省了 8 分鐘',
    summary: 'cache key 設計這件事很容易做錯。我們的 CI 從 12 分鐘降到 4 分鐘，主要靠正確的 hash 來源。',
    coverImageUrl: img('a-2024-04'), authorNickname: yuan, viewCount: 2780, likeCount: 124, commentCount: 19,
    publishedAt: '2024-08-30', tags: ['CI/CD', 'Vite'], categories: ['Practice'], slug: 'gha-vite-cache-saved-8min',
  },
  {
    uuid: 'a-2024-05', title: '《Working in Public》看完之後我重新想了一遍 open source',
    summary: '我以為 open source 是給予，看完才知道大部分時間是 housekeeping。maintainer 的累被寫得很準。',
    coverImageUrl: img('a-2024-05'), authorNickname: yuan, viewCount: 4310, likeCount: 234, commentCount: 38,
    publishedAt: '2024-11-17', tags: ['Books'], categories: ['Life'], slug: 'working-in-public-rereading',
  },
  {
    uuid: 'a-2024-06', title: '微服務拆分的時候，我們做錯的三件事',
    summary: '把 monolith 拆成 12 個 service 之後，我們花了 8 個月把它縮回 5 個。寫給想拆的團隊看。',
    coverImageUrl: img('a-2024-06'), authorNickname: han, viewCount: 7240, likeCount: 389, commentCount: 92,
    publishedAt: '2024-04-11', tags: ['Microservices'], categories: ['Backend'], slug: 'microservices-three-mistakes',
  },
  {
    uuid: 'a-2024-07', title: 'Spring 的 @Async 真的不是丟到 thread pool 這麼簡單',
    summary: '我們的 Async task 在 prod 偶發 thread starvation，追了三天才發現是 propagation context 的問題。',
    coverImageUrl: img('a-2024-07'), authorNickname: han, viewCount: 4920, likeCount: 248, commentCount: 56,
    publishedAt: '2024-09-25', tags: ['Spring', 'Performance'], categories: ['Backend'], slug: 'spring-async-pitfall',
  },
  {
    uuid: 'a-2024-08', title: '我們建立 design system 的第一年，學到了什麼',
    summary: '從 Figma 變數到實際 production CSS variable，看似一條線，實際上中間斷掉的地方比連起來的還多。',
    coverImageUrl: img('a-2024-08'), authorNickname: mira, viewCount: 5610, likeCount: 287, commentCount: 64,
    publishedAt: '2024-02-29', tags: ['Design System', 'Typography'], categories: ['Design'], slug: 'design-system-first-year',
  },
  {
    uuid: 'a-2024-09', title: 'Hover state 不該只是換顏色，用圖層思維設計按鈕',
    summary: '一個按鈕有 base、shadow、border、icon、label 五層。每層在 hover 時的反應應該獨立想。',
    coverImageUrl: img('a-2024-09'), authorNickname: mira, viewCount: 6780, likeCount: 342, commentCount: 51,
    publishedAt: '2024-07-03', tags: ['CSS', 'Animation'], categories: ['Frontend'], slug: 'hover-state-as-layers',
  },
  {
    uuid: 'a-2024-10', title: '《Deep Work》之後，我把通知全關掉的第 90 天',
    summary: '不是 Cal Newport 那種極端版本。我留下 Slack mention 跟手機電話，其他全關。三個月後的觀察。',
    coverImageUrl: img('a-2024-10'), authorNickname: chen, viewCount: 8420, likeCount: 451, commentCount: 78,
    publishedAt: '2024-10-12', tags: ['Productivity', 'Books'], categories: ['Life'], slug: 'deep-work-day-90',
  },
];

const articles2025_2026: MockArticleItem[] = [
  {
    uuid: 'a-2025-01', title: 'Vue 3.5 的 useTemplateRef 改寫了我所有 ref 的習慣',
    summary: '不再 const el = ref 加 defineExpose。useTemplateRef 把流程縮成一行，且 type 推得更準。',
    coverImageUrl: img('a-2025-01'), authorNickname: yuan, viewCount: 11240, likeCount: 568, commentCount: 134,
    publishedAt: '2025-02-18', tags: ['Vue 3', 'TypeScript'], categories: ['Frontend'], slug: 'use-template-ref-changed-everything',
  },
  {
    uuid: 'a-2025-02', title: 'TypeScript 5.5 的 inferred type predicate 解決了 filter 的壞習慣',
    summary: 'array.filter(Boolean as any) 和 as Foo[] 之類的 hack 終於可以下架。這個小改動的影響比想像中大。',
    coverImageUrl: img('a-2025-02'), authorNickname: yuan, viewCount: 7680, likeCount: 412, commentCount: 87,
    publishedAt: '2025-05-09', tags: ['TypeScript'], categories: ['Frontend'], slug: 'ts-55-inferred-predicate',
  },
  {
    uuid: 'a-2025-03', title: '為什麼我又重寫了 component 測試',
    summary: '從 Jest snapshot 到 Vitest + Vue Test Utils 到 Testing Library 再回 VTU，我終於知道怎麼選了。',
    coverImageUrl: img('a-2025-03'), authorNickname: yuan, viewCount: 5240, likeCount: 234, commentCount: 56,
    publishedAt: '2025-08-21', tags: ['Testing', 'Vue 3'], categories: ['Practice'], slug: 'rewriting-component-tests-again',
  },
  {
    uuid: 'a-2025-04', title: 'Inter 換成 Geist 之後我才發現字型對 layout 的影響有多大',
    summary: '同樣 16px、line-height 1.5，換字型之後整個頁面的重量變了。Typography 從來不只是字體選擇。',
    coverImageUrl: img('a-2025-04'), authorNickname: yuan, viewCount: 6320, likeCount: 318, commentCount: 71,
    publishedAt: '2025-11-04', tags: ['Typography', 'Design System'], categories: ['Design'], slug: 'inter-to-geist',
  },
  {
    uuid: 'a-2025-05', title: '遠端工作三年，我終於不再嘗試模擬辦公室',
    summary: '從同步 standup、screen share pair programming 到完全 async，我花了三年才學會 remote 的真正規則。',
    coverImageUrl: img('a-2025-05'), authorNickname: yuan, viewCount: 9810, likeCount: 521, commentCount: 142,
    publishedAt: '2025-12-19', tags: ['Remote Work', 'Career'], categories: ['Life'], slug: 'remote-three-years-in',
  },
  {
    uuid: 'a-2025-06', title: '從 Java 跳 Go 一年，我懷念的跟我不懷念的',
    summary: '懷念 Stream API 跟 Lombok。不懷念 ClassNotFoundException 跟 Spring 的 magic auto-config。對 nil 仍有恨。',
    coverImageUrl: img('a-2025-06'), authorNickname: han, viewCount: 8740, likeCount: 467, commentCount: 158,
    publishedAt: '2025-06-26', tags: ['Go'], categories: ['Backend'], slug: 'java-to-go-one-year',
  },
  {
    uuid: 'a-2025-07', title: 'Motion design 在 web 上的克制，我們刪掉了 80% 的 transition',
    summary: '把 design system 裡所有 100ms 以下的 transition 全部移除之後，UI 反而感覺更快。這是一次有趣的反證。',
    coverImageUrl: img('a-2025-07'), authorNickname: mira, viewCount: 5420, likeCount: 289, commentCount: 47,
    publishedAt: '2025-04-15', tags: ['Motion', 'Animation'], categories: ['Design'], slug: 'restraint-in-motion',
  },
  {
    uuid: 'a-2026-01', title: '《How to Take Smart Notes》之後我重做了我的 markdown vault',
    summary: 'Sönke 的 Zettelkasten 不是 note-taking 系統，是寫作系統。我花了一個月把 800 篇 note 全部重整。',
    coverImageUrl: img('a-2026-01'), authorNickname: chen, viewCount: 6890, likeCount: 354, commentCount: 89,
    publishedAt: '2026-03-08', tags: ['Books', 'Productivity'], categories: ['Life'], slug: 'smart-notes-rebuild-vault',
  },
];

export const allMockArticles: MockArticleItem[] = [
  ...articles2023,
  ...articles2024,
  ...articles2025_2026,
];

export function getMockArticleDetail(uuid: string): ArticleDetailItem | null {
  const base = allMockArticles.find(a => a.uuid === uuid);
  if (!base) return null;
  const categories = base.categories.map((name, i) => ({
    uuid: `mock-cat-${base.uuid}-${i}`,
    name,
    slug: name.toLowerCase(),
  }));
  return { ...base, content: mockMarkdownContent, categories, liked: false };
}

export const allMockTags: TagDetailResponse[] = ALL_MOCK_TAGS.map((name, index) => ({
  uuid: `tag-${index + 1}`,
  name,
  slug: slugifyTag(name),
  articleCount: allMockArticles.filter(article => article.tags.includes(name)).length,
}));

export interface ZoneEntry {
  slug: string;
  name: string;
  description: string;
  iconName: string;
  articleCount: number;
  coverImageUrl: string;
}

export const mockZoneEntries: ZoneEntry[] = [
  { slug: 'tech', name: 'Tech', description: 'Frontend, backend, and delivery notes.', iconName: 'code', articleCount: 22, coverImageUrl: img('zone-tech') },
  { slug: 'design', name: 'Design', description: 'Design systems, typography, color, and motion.', iconName: 'palette', articleCount: 4, coverImageUrl: img('zone-design') },
  { slug: 'life', name: 'Life', description: 'Books, productivity, remote work, and career notes.', iconName: 'book-open', articleCount: 4, coverImageUrl: img('zone-life') },
];

export const mockCategories: MockCategoryOption[] = [
  { id: 'cat-1', uuid: 'cat-1', name: 'Vue', slug: 'vue' },
  { id: 'cat-2', uuid: 'cat-2', name: 'React', slug: 'react' },
  { id: 'cat-3', uuid: 'cat-3', name: 'TypeScript', slug: 'typescript' },
  { id: 'cat-4', uuid: 'cat-4', name: 'Backend', slug: 'backend' },
  { id: 'cat-5', uuid: 'cat-5', name: 'Frontend', slug: 'frontend' },
  { id: 'cat-6', uuid: 'cat-6', name: 'Design', slug: 'design' },
  { id: 'cat-7', uuid: 'cat-7', name: 'Life', slug: 'life' },
];

export const mockTagPool: TagSuggestion[] = [
  { name: 'Vue', articleCount: 18 },
  { name: 'Vue Router', articleCount: 8 },
  ...allMockTags.map(tag => ({ name: tag.name, articleCount: tag.articleCount })),
];

export const mockQuota: QuotaInfo = {
  usedBytes: 52_428_800,
  limitBytes: 104_857_600,
  remainingBytes: 52_428_800,
};

export const mockEditorArticles: EditorArticle[] = [
  {
    uuid: 'editor-draft-1',
    title: 'Vue 3 Composition API 草稿',
    summary: '一篇關於 Composition API 的草稿。',
    content: '# Vue 3 Composition API\n\nDraft content.',
    coverImageUrl: null,
    status: 'DRAFT',
    categories: [mockCategories[0]!],
    tags: ['Vue', 'TypeScript'],
    rejectReason: null,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z',
  },
  {
    uuid: 'editor-pending-1',
    title: 'Pinia 狀態管理待審',
    summary: 'Pinia 狀態管理文章。',
    content: '# Pinia\n\nPending content.',
    coverImageUrl: img('pending-1'),
    status: 'PENDING_REVIEW',
    categories: [mockCategories[0]!],
    tags: ['Vue', 'Pinia'],
    rejectReason: null,
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-20T09:00:00Z',
  },
  {
    uuid: 'editor-pending-2',
    title: 'TypeScript 進階待審',
    summary: 'TypeScript 型別文章。',
    content: '# TypeScript\n\nPending content.',
    coverImageUrl: null,
    status: 'PENDING_REVIEW',
    categories: [mockCategories[2]!],
    tags: ['TypeScript'],
    rejectReason: null,
    createdAt: '2026-03-12T10:00:00Z',
    updatedAt: '2026-03-22T14:00:00Z',
  },
  {
    uuid: 'editor-published-1',
    title: 'Vite 實戰發布文章',
    summary: '一篇已發布的 Vite 文章。',
    content: '# Vite\n\nPublished content.',
    coverImageUrl: img('published-1'),
    status: 'PUBLISHED',
    categories: [mockCategories[0]!],
    tags: ['Vite', 'Vue'],
    rejectReason: null,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-15T16:00:00Z',
  },
  {
    uuid: 'editor-rejected-1',
    title: 'Docker 入門退回文章',
    summary: '一篇被退回的 Docker 文章。',
    content: '# Docker\n\nRejected content.',
    coverImageUrl: null,
    status: 'REJECTED',
    categories: [mockCategories[3]!],
    tags: ['Docker'],
    rejectReason: '內容需要補充實作步驟。',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-05T11:00:00Z',
  },
  {
    uuid: 'editor-archived-1',
    title: 'Vue CLI 舊文章封存',
    summary: '一篇封存的 Vue CLI 文章。',
    content: '# Vue CLI\n\nArchived content.',
    coverImageUrl: null,
    status: 'ARCHIVED',
    categories: [mockCategories[0]!],
    tags: ['Vue'],
    rejectReason: null,
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-12-01T10:00:00Z',
  },
];

export let editorArticleStore: EditorArticle[] = [...mockEditorArticles];

export function resetEditorArticleStore(): void {
  editorArticleStore = [...mockEditorArticles];
}

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

export function toPendingArticle(a: EditorArticle): PendingArticle {
  return {
    ...toMyArticle(a),
    authorNickname: 'Mock Author',
  };
}
