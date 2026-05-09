import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import { bookmarkService } from './bookmarkService'

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
    const page = { records: [], total: 0, current: 1, size: 20, pages: 0 }
    vi.mocked(apiClient.get).mockResolvedValue(page)

    const res = await bookmarkService.getMyBookmarks(1, 20)

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/bookmarks', {
      params: { page: 1, size: 20 },
    })
    expect(res).toEqual(page)
  })
})
