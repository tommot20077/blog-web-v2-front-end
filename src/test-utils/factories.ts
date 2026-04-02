import type { ArticleItem, ArticleDetailItem, PageResult } from '../api/articleService'
import type { User } from '../types/auth'

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
    categories: ['Frontend'],
    slug: 'test-article',
    ...overrides,
  }
}

export function createMockArticleDetail(overrides: Partial<ArticleDetailItem> = {}): ArticleDetailItem {
  return {
    ...createMockArticle(),
    content: '# Test\n\nHello world',
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
