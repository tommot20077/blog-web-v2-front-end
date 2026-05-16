import { allMockArticles } from './data'
import type { BackendPageResult } from '../utils'
import type { BookmarkArticleSummary } from '../real/bookmarkService'
import {
  isArticleBookmarked,
  removeArticleBookmark,
  resetBookmarkState,
  seedArticleBookmark,
} from './articleInteractionMockState'

export function resetBookmarkMockState(): void {
  resetBookmarkState()
}

export function seedBookmark(articleUuid: string): void {
  seedArticleBookmark(articleUuid)
}

function mapBookmarkArticle(article: typeof allMockArticles[number]): BookmarkArticleSummary {
  return {
    uuid: article.uuid,
    title: article.title,
    summary: article.summary,
    coverImageUrl: article.coverImageUrl,
    authorNickname: article.authorNickname,
    status: 'PUBLISHED',
    viewCount: article.viewCount,
    createdAt: article.publishedAt,
    updatedAt: article.publishedAt,
    slug: article.slug,
    likeCount: article.likeCount,
    commentCount: article.commentCount,
    publishedAt: article.publishedAt,
    tags: article.tags.map((tag) => ({ id: tag, name: tag, slug: tag.toLowerCase() })),
    bookmarked: true,
  }
}

export const bookmarkService = {
  async bookmark(articleUuid: string): Promise<void> {
    seedArticleBookmark(articleUuid)
  },

  async unbookmark(articleUuid: string): Promise<void> {
    removeArticleBookmark(articleUuid)
  },

  async getMyBookmarks(page: number, size: number): Promise<BackendPageResult<BookmarkArticleSummary>> {
    const records = allMockArticles
      .filter((article) => isArticleBookmarked(article.uuid))
      .map(mapBookmarkArticle)
    const start = Math.max(0, (page - 1) * size)
    const pageRecords = records.slice(start, start + size)

    return {
      records: pageRecords,
      total: records.length,
      current: page,
      size,
      pages: Math.ceil(records.length / size) || 1,
    }
  },
}
