import { describe, it, expect, vi, afterEach } from 'vitest'
import { adminService } from './adminService'
import apiClient from '../apiClient'

vi.mock('../apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('real/adminService — Task A5 完整讀取方法', () => {
  afterEach(() => vi.restoreAllMocks())

  describe('getCategoriesFull', () => {
    it('保留 description 與 sortOrder，不收窄後端欄位', async () => {
      const backendData = [
        { uuid: 'cat-1', name: '架構', slug: 'architecture', description: '架構相關文章', sortOrder: 10 },
        { uuid: 'cat-2', name: '前端', slug: 'frontend', description: null, sortOrder: 20 },
      ]
      vi.mocked(apiClient.get).mockResolvedValue(backendData)

      const result = await adminService.getCategoriesFull()

      expect(result).toEqual(backendData)
      expect(result[0]).toHaveProperty('description', '架構相關文章')
      expect(result[0]).toHaveProperty('sortOrder', 10)
      expect(result[1].description).toBeNull()
    })

    it('呼叫 GET /api/v1/categories', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([])
      await adminService.getCategoriesFull()
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/categories')
    })
  })

  describe('getTagsFull', () => {
    it('保留 color 與 icon 與 description，不收窄後端欄位', async () => {
      const backendData = [
        {
          id: 'tag-1',
          name: 'Vue',
          slug: 'vue',
          color: '#42b883',
          icon: 'tag',
          description: 'Vue 相關文章',
          usageCount: 12,
        },
      ]
      vi.mocked(apiClient.get).mockResolvedValue(backendData)

      const result = await adminService.getTagsFull()

      expect(result).toEqual(backendData)
      expect(result[0]).toHaveProperty('color', '#42b883')
      expect(result[0]).toHaveProperty('icon', 'tag')
      expect(result[0]).toHaveProperty('description', 'Vue 相關文章')
      expect(result[0]).toHaveProperty('usageCount', 12)
    })

    it('呼叫 GET /api/v1/tags/all', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([])
      await adminService.getTagsFull()
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/tags/all')
    })
  })

  describe('getSearchStatus', () => {
    it('正常態：映射 documentCount / lastReindexAt / healthy 三欄位', async () => {
      const backendData = { documentCount: 13, lastReindexAt: '2026-07-20T21:30:00', healthy: true }
      vi.mocked(apiClient.get).mockResolvedValue(backendData)

      const result = await adminService.getSearchStatus()

      expect(result).toEqual(backendData)
    })

    it('ES 離線態：healthy=false 且 documentCount=null 時原樣呈現，不拋出', async () => {
      const backendData = { documentCount: null, lastReindexAt: '2026-07-20T21:30:00', healthy: false }
      vi.mocked(apiClient.get).mockResolvedValue(backendData)

      const result = await adminService.getSearchStatus()

      expect(result.healthy).toBe(false)
      expect(result.documentCount).toBeNull()
    })

    it('從未重建態：lastReindexAt=null', async () => {
      const backendData = { documentCount: 0, lastReindexAt: null, healthy: true }
      vi.mocked(apiClient.get).mockResolvedValue(backendData)

      const result = await adminService.getSearchStatus()

      expect(result.lastReindexAt).toBeNull()
    })

    it('呼叫 GET /api/v1/admin/search/status', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ documentCount: 0, lastReindexAt: null, healthy: true })
      await adminService.getSearchStatus()
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/admin/search/status')
    })
  })
})
