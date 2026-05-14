import type { ArticleItem, ArticleDetailItem } from '../api/articleService'
import type { ArticleCategory } from '../api/real/articleService'
import type { PageResult } from '../types/editor'
import type { User } from '../types/auth'
import type { EditorArticle, MyArticle, CategoryOption, QuotaInfo } from '../types/editor'

export function createMockArticle(overrides: Partial<ArticleItem> = {}): ArticleItem {
  return {
    uuid: 'test-uuid-1',
    title: '測試文章標題',
    summary: '這是測試摘要內容',
    coverImageUrl: null,
    authorNickname: 'TestAuthor',
    viewCount: 100,
    likeCount: 10,
    commentCount: 5,
    publishedAt: '2026-03-20',
    tags: ['Vue', 'Frontend'],
    slug: 'test-article',
    ...overrides,
  }
}

export function createMockArticleDetail(overrides: Partial<ArticleDetailItem> = {}): ArticleDetailItem {
  return {
    ...createMockArticle(),
    content: '# Test\n\nHello world',
    categories: [] as ArticleCategory[],
    liked: false,
    ...overrides,
  }
}

export function createMockPageResult<T>(records: T[], overrides: Partial<PageResult<T>> = {}): PageResult<T> {
  return {
    records,
    total: records.length,
    size: 6,
    current: 1,
    pages: Math.ceil(records.length / 6) || 1,
    ...overrides,
  }
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    uuid: 'test-user-uuid',
    email: 'test@test.com',
    nickname: 'TestUser',
    avatarUrl: null,
    role: 'USER',
    emailVerified: true,
    createdAt: '2026-01-01',
    ...overrides,
  }
}

export function createMockEditorArticle(overrides: Partial<EditorArticle> = {}): EditorArticle {
  return {
    uuid: 'editor-test-uuid',
    title: '測試編輯器文章',
    summary: '測試摘要',
    content: '# Hello\n\n測試內容',
    coverImageUrl: null,
    status: 'DRAFT',
    categories: [],
    tags: ['Vue'],
    rejectReason: null,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z',
    ...overrides,
  }
}

export function createMockMyArticle(overrides: Partial<MyArticle> = {}): MyArticle {
  return {
    uuid: 'my-article-test-uuid',
    title: '我的測試文章',
    summary: '測試摘要',
    coverImageUrl: null,
    status: 'DRAFT',
    tags: ['Vue'],
    rejectReason: null,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    ...overrides,
  }
}

export function createMockCategoryOption(overrides: Partial<CategoryOption> = {}): CategoryOption {
  return {
    id: 'cat-test-1',
    name: 'Vue',
    slug: 'vue',
    ...overrides,
  }
}

export function createMockQuota(overrides: Partial<QuotaInfo> = {}): QuotaInfo {
  return {
    usedBytes: 52_428_800,
    limitBytes: 104_857_600,
    remainingBytes: 52_428_800,
    ...overrides,
  }
}
