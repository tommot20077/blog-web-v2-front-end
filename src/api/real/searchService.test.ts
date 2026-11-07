import { describe, it, expect, vi, beforeEach, expectTypeOf } from 'vitest'
import apiClient from '../apiClient'
import { searchService } from './searchService'
import { SEARCH_SORT_VALUES, type SearchParams } from '../../types/search'

vi.mock('../apiClient')
vi.mock('../../stores/auth', () => ({ useAuthStore: () => ({ isAuthenticated: false }) }))

const emptyPage = { current: 1, size: 10, pages: 0, total: 0, records: [] }

describe('real searchService.search 排序白名單', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue(emptyPage)
  })

  it('SearchParams.sort 只允許後端接受的 relevance / latest', () => {
    expectTypeOf<SearchParams['sort']>().toEqualTypeOf<'relevance' | 'latest' | undefined>()
    expect([...SEARCH_SORT_VALUES]).toEqual(['relevance', 'latest'])
  })

  it.each(['relevance', 'latest'] as const)('sort=%s 原樣送出', async (sort) => {
    await searchService.search({ q: 'vue', sort })
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/search', { params: { q: 'vue', sort } })
  })

  it('未指定 sort → 不送 sort 參數（後端預設 relevance）', async () => {
    await searchService.search({ q: 'vue' })
    const params = vi.mocked(apiClient.get).mock.calls[0][1]?.params as Record<string, unknown>
    expect(params).not.toHaveProperty('sort')
  })

  it.each(['hot', 'date', 'popularity', ''])('非白名單值 %j（舊型別或已移除的 hot）不會送出', async (bad) => {
    await searchService.search({ q: 'vue', sort: bad as never })
    const params = vi.mocked(apiClient.get).mock.calls[0][1]?.params as Record<string, unknown>
    expect(params).not.toHaveProperty('sort')
    expect(params.q).toBe('vue')
  })
})
