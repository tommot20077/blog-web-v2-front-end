import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import { articleLikeService } from './articleLikeService'

vi.mock('../apiClient')

describe('real articleLikeService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('like 呼叫 POST /articles/{uuid}/like', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(undefined)
    await articleLikeService.like('a-uuid')
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/articles/a-uuid/like')
  })

  it('unlike 呼叫 DELETE /articles/{uuid}/like', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)
    await articleLikeService.unlike('a-uuid')
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/articles/a-uuid/like')
  })
})
