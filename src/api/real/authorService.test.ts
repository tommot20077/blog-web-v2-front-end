import { describe, it, expect, vi, afterEach } from 'vitest'
import { authorService } from './authorService'
import apiClient from '../apiClient'

vi.mock('../apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

describe('real/authorService', () => {
  afterEach(() => vi.resetAllMocks())

  it('searchAuthors 呼叫 GET /api/v1/authors 並帶 keyword', async () => {
    const data = [{ uuid: 'u1', nickname: 'A', avatarUrl: null, publishedArticleCount: 2 }]
    vi.mocked(apiClient.get).mockResolvedValue(data)
    const result = await authorService.searchAuthors('a')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/authors', { params: { keyword: 'a' } })
    expect(result).toEqual(data)
  })

  it('searchAuthors 空 keyword 不帶參數', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([])
    await authorService.searchAuthors('')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/authors', { params: {} })
  })

  it('searchAuthors 失敗時向上拋出（讓元件區分「搜尋失敗」與「無結果」）', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('boom'))
    await expect(authorService.searchAuthors('a')).rejects.toThrow('boom')
  })

  it('getProfile 呼叫 GET /api/v1/users/{uuid}/profile 並回傳資料', async () => {
    const data = { uuid: 'u1', nickname: 'A', socialLinks: { github: 'x', twitter: null, linkedin: null } }
    vi.mocked(apiClient.get).mockResolvedValue(data)
    const result = await authorService.getProfile('u1')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/u1/profile')
    expect(result).toEqual(data)
  })

  it('getProfile uuid 先 encodeURIComponent，避免路徑注入', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({})
    await authorService.getProfile('a/../b')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/a%2F..%2Fb/profile')
  })

  it('getProfile 遇 HTTP 404 → null', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(Object.assign(new Error('用戶不存在'), { status: 404, code: 'A0101' }))
    expect(await authorService.getProfile('u1')).toBeNull()
  })

  it('getProfile 遇業務碼 A0101（即使 status 缺）→ null', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(Object.assign(new Error('用戶不存在'), { code: 'A0101' }))
    expect(await authorService.getProfile('u1')).toBeNull()
  })

  it('getProfile 遇 500／網路錯誤 → 向上拋出，不可誤判為「找不到」', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(Object.assign(new Error('boom'), { status: 500 }))
    await expect(authorService.getProfile('u1')).rejects.toThrow('boom')
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network Error'))
    await expect(authorService.getProfile('u1')).rejects.toThrow('Network Error')
  })
})
