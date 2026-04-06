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
  })
})
