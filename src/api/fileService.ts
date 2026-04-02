import apiClient from './apiClient'
import type { FileUploadResponse, FileUsageType } from '../types/editor'

export const fileService = {
  async uploadFile(file: File, usageType: FileUsageType): Promise<FileUploadResponse> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { uploadFileMock } = await import('./mock/fileMockService')
      return uploadFileMock(file, usageType)
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('usageType', usageType)
    return apiClient.post<unknown, FileUploadResponse>('/api/v1/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
