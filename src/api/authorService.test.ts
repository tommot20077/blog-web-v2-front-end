import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authorService } from './authorService'
import apiClient from './apiClient'

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

describe('authorService dispatcher', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks() })

  describe('VITE_USE_MOCK=true', () => {
    beforeEach(() => { vi.stubEnv('VITE_USE_MOCK', 'true') })

    it('searchAuthors 走 mock，不打 apiClient', async () => {
      const list = await authorService.searchAuthors('Yuan')
      expect(list.map(a => a.nickname)).toContain('Yuan')
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('getProfile 走 mock；不存在回 null', async () => {
      expect(await authorService.getProfile('nope')).toBeNull()
      expect(apiClient.get).not.toHaveBeenCalled()
    })
  })

  describe('VITE_USE_MOCK=false', () => {
    beforeEach(() => { vi.stubEnv('VITE_USE_MOCK', 'false') })

    it('searchAuthors 走 real', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([])
      await authorService.searchAuthors('x')
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/authors', { params: { keyword: 'x' } })
    })

    it('getProfile 走 real', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ uuid: 'u' })
      await authorService.getProfile('u')
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/u/profile')
    })
  })
})
