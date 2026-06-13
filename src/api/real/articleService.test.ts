import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import { articleService } from './articleService'
import type { ArchiveItem } from './articleService'

vi.mock('../apiClient')

describe('real articleService.getArchive', () => {
  beforeEach(() => vi.clearAllMocks())

  it('呼叫 GET /api/v1/articles/archive（無 params）並原樣回傳 unwrap 後的陣列', async () => {
    const backend: ArchiveItem[] = [
      { uuid: 'u-2026-01', title: '2026 文章', slug: 'a-2026', publishedAt: '2026-03-01T00:00:00', tags: ['Vue'] },
      { uuid: 'u-2025-01', title: '2025 文章', slug: 'a-2025', publishedAt: '2025-06-01T00:00:00', tags: ['CSS', 'TS'] },
    ]
    vi.mocked(apiClient.get).mockResolvedValue(backend)

    const result = await articleService.getArchive()

    expect(apiClient.get).toHaveBeenCalledOnce()
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/archive')
    expect(result).toEqual(backend)
    // tags 已是字串陣列，原樣傳遞
    expect(result[0]!.tags).toEqual(['Vue'])
  })

  it('後端回傳空陣列 → 回傳空陣列', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([])

    const result = await articleService.getArchive()

    expect(result).toEqual([])
  })

  it('網路錯誤 → 回傳空陣列並呼叫 console.error', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network failure'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await articleService.getArchive()

    expect(result).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith('Fetch archive failed:', expect.any(Error))
  })
})
