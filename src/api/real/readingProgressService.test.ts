import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import { readingProgressService } from './readingProgressService'
import type { ReadingProgress } from './readingProgressService'

vi.mock('../apiClient')

describe('real readingProgressService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('get 呼叫 GET /articles/{uuid}/progress', async () => {
    const progress = { progress: 0.5, lastHeading: 'intro', updatedAt: '2026-05-09T00:00:00Z' }
    vi.mocked(apiClient.get).mockResolvedValue(progress)
    const res: ReadingProgress | null = await readingProgressService.get('article-uuid')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/progress')
    expect(res).toEqual(progress)
  })

  it('get 無進度時允許回傳 null', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(null)

    const res = await readingProgressService.get('article-uuid')

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/progress')
    expect(res).toBeNull()
  })

  it('update 呼叫 PUT /articles/{uuid}/progress', async () => {
    const request = { progress: 0.75, lastHeading: 'section-2' }
    vi.mocked(apiClient.put).mockResolvedValue(undefined)
    await readingProgressService.update('article-uuid', request)
    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/articles/article-uuid/progress', request)
  })
})
