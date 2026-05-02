import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import { commentService } from './commentService'

vi.mock('../apiClient')

describe('real commentService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('list 呼叫 GET /articles/{uuid}/comments with page/size/sort', async () => {
    const mockResponse = {
      topLevels: { records: [], total: 0, page: 1, size: 20 },
      totalCommentCount: 0,
    }
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse)
    const res = await commentService.list('article-uuid', 1, 20, 'newest')
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/v1/articles/article-uuid/comments',
      { params: { page: 1, size: 20, sort: 'newest' } },
    )
    expect(res).toEqual(mockResponse)
  })

  it('create 呼叫 POST /articles/{uuid}/comments', async () => {
    const reply = { uuid: 'c1', content: 'hi' }
    vi.mocked(apiClient.post).mockResolvedValue(reply)
    const res = await commentService.create('article-uuid', { content: 'hi' })
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/articles/article-uuid/comments',
      { content: 'hi' },
    )
    expect(res).toEqual(reply)
  })

  it('edit 呼叫 PUT /comments/{uuid}', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ uuid: 'c1' })
    await commentService.edit('c1', { content: 'updated' })
    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/comments/c1', { content: 'updated' })
  })

  it('delete 呼叫 DELETE /comments/{uuid}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)
    await commentService.delete('c1')
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/comments/c1')
  })

  it('like 呼叫 POST /comments/{uuid}/like', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(undefined)
    await commentService.like('c1')
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/comments/c1/like')
  })

  it('unlike 呼叫 DELETE /comments/{uuid}/like', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)
    await commentService.unlike('c1')
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/comments/c1/like')
  })
})
