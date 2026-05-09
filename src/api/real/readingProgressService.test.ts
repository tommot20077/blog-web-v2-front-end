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
    const res = await readingProgressService.get('article-uuid')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/progress')
    expect(res).toEqual(progress)
  })

  it('get 在尚無閱讀進度時可回傳 null', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(null)
    // @ts-expect-error 後端沒有進度紀錄時會回 null，呼叫端不能當成必定有資料
    const res: ReadingProgress = await readingProgressService.get('article-uuid')
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
