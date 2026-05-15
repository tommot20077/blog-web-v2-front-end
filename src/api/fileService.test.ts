import { fileService } from './fileService'
import apiClient from './apiClient'

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('fileService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'true'))
    afterEach(() => vi.unstubAllEnvs())

    it('uploadFile 委派 mock 並回傳 FileUploadResponse', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' })
      const result = await fileService.uploadFile(file, 'ARTICLE_CONTENT')
      expect(result.url).toBeTruthy()
      expect(result.id).toBeTruthy()
      expect(result.usageType).toBe('ARTICLE_CONTENT')
    })

    it('getFileMetadata 委派 mock 並回傳 FileMetadata', async () => {
      const result = await fileService.getFileMetadata('file-mock-1')
      expect(result.id).toBe('file-mock-1')
      expect(result).toHaveProperty('originalName')
      expect(result).toHaveProperty('contentType')
    })

    it('deleteFile 委派 mock 並成功解析', async () => {
      await expect(fileService.deleteFile('file-mock-1')).resolves.toBeUndefined()
    })

    it('getUserFiles 委派 mock 並回傳檔案列表', async () => {
      const result = await fileService.getUserFiles()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => vi.stubEnv('VITE_USE_MOCK', 'false'))
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

    it('uploadFile 使用 FormData 呼叫 POST /api/v1/files/upload', async () => {
      const mockResponse = { id: 'f1', url: 'https://cdn.example.com/img.png', width: 800, height: 600, size: 1024, usageType: 'ARTICLE_COVER' as const }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const file = new File(['x'], 'img.png', { type: 'image/png' })
      const result = await fileService.uploadFile(file, 'ARTICLE_COVER')

      expect(result).toEqual(mockResponse)
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/files/upload',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      )
    })

    it('API 錯誤時拋出錯誤', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Upload failed'))
      const file = new File(['x'], 'img.png', { type: 'image/png' })
      await expect(fileService.uploadFile(file, 'ARTICLE_CONTENT')).rejects.toThrow('Upload failed')
    })

    it('getFileMetadata 呼叫 GET /api/v1/files/:id', async () => {
      const mockMeta = { id: 'f1', originalName: 'img.png', contentType: 'image/png', size: 1024, usageType: 'ARTICLE_CONTENT' as const, hasThumbnail: false, uploaderId: 'u1', createdAt: '2026-01-01T00:00:00Z' }
      vi.mocked(apiClient.get).mockResolvedValue(mockMeta)

      const result = await fileService.getFileMetadata('f1')
      expect(result).toEqual(mockMeta)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/files/f1')
    })

    it('deleteFile 呼叫 DELETE /api/v1/files/:id', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined)
      await fileService.deleteFile('f1')
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/files/f1')
    })

    it('getUserFiles 呼叫 GET /api/v1/users/me/files', async () => {
      const mockFiles = [{ id: 'f1', originalName: 'img.png', contentType: 'image/png', size: 1024, usageType: 'ARTICLE_CONTENT' as const, hasThumbnail: false, uploaderId: 'u1', createdAt: '2026-01-01T00:00:00Z' }]
      vi.mocked(apiClient.get).mockResolvedValue(mockFiles)

      const result = await fileService.getUserFiles()
      expect(result).toEqual(mockFiles)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/files', { params: {} })
    })

    it('getUserFiles 帶 page/size/sort 對齊後端 Pageable 參數', async () => {
      const mockFiles = [{ id: 'f1', originalName: 'img.png', contentType: 'image/png', size: 1024, usageType: 'ARTICLE_CONTENT' as const, hasThumbnail: false, uploaderId: 'u1', createdAt: '2026-01-01T00:00:00Z' }]
      vi.mocked(apiClient.get).mockResolvedValue(mockFiles)

      const result = await fileService.getUserFiles({ page: 2, size: 5, sort: 'createdAt,desc' })
      expect(result).toEqual(mockFiles)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/me/files', {
        params: { page: 2, size: 5, sort: 'createdAt,desc' },
      })
    })

    it('getUserFiles API 錯誤時回傳空陣列', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await fileService.getUserFiles()
      expect(result).toEqual([])
    })
  })
})
