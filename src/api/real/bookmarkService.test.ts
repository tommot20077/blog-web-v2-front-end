import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import { bookmarkService } from './bookmarkService'
import type { BookmarkArticleSummary } from './bookmarkService'
import type { BackendPageResult } from '../utils'
import type { ArticleStatus } from '../../types/editor'

vi.mock('../apiClient')

describe('real bookmarkService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('bookmark 呼叫 POST /articles/{uuid}/bookmark', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(undefined)
    await bookmarkService.bookmark('article-uuid')
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/articles/article-uuid/bookmark')
  })

  it('unbookmark 呼叫 DELETE /articles/{uuid}/bookmark', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)
    await bookmarkService.unbookmark('article-uuid')
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/articles/article-uuid/bookmark')
  })

  it('getMyBookmarks 呼叫 GET /users/me/bookmarks with pagination', async () => {
    const page: BackendPageResult<BookmarkArticleSummary> = {
      records: [
        {
          uuid: 'article-uuid',
          title: 'Bookmarked article',
          summary: 'summary',
          coverImageUrl: null,
          authorUuid: 'author-uuid',
          authorNickname: 'Yuan',
          status: 'PUBLISHED',
          viewCount: 10,
          createdAt: '2026-05-09T00:00:00Z',
          updatedAt: '2026-05-09T01:00:00Z',
          slug: 'bookmarked-article',
          likeCount: 2,
          commentCount: 1,
          publishedAt: '2026-05-09T02:00:00Z',
          tags: [{ id: 'tag-uuid', name: 'Vue', slug: 'vue' }],
          rejectReason: null,
          liked: false,
          bookmarked: true,
          lastReadProgress: 0.5,
          seriesUuid: 'series-uuid',
          seriesTitle: 'Series Title',
          seriesPosition: 1,
        },
      ],
      total: 1,
      current: 1,
      size: 20,
      pages: 1,
    }
    vi.mocked(apiClient.get).mockResolvedValue(page)

    const res = await bookmarkService.getMyBookmarks(1, 20)
    const status: ArticleStatus = res.records[0]!.status
    const createdAt: string = res.records[0]!.createdAt
    const firstTagName: string = res.records[0]!.tags![0]!.name

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/bookmarks', {
      params: { page: 1, size: 20 },
    })
    expect(status).toBe('PUBLISHED')
    expect(createdAt).toBe('2026-05-09T00:00:00Z')
    expect(firstTagName).toBe('Vue')
    expect(res).toEqual(page)
  })
})
