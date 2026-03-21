import type { ArticleItem, ArticleDetailItem, PageResult } from '../api/articleService'

export function createMockArticle(overrides: Partial<ArticleItem> = {}): ArticleItem {
  return {
    uuid: 'test-uuid-1',
    title: '測試文章標題',
    summary: '這是測試摘要內容',
    viewCount: 100,
    publishedAt: '2026-03-20',
    tags: ['Vue', 'Frontend'],
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
