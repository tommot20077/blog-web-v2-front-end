import apiClient from './apiClient'
import type { FileUploadResponse, FileUsageType } from '../types/editor'
import type { FileMetadata } from '../types/user'

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

  async getFileMetadata(id: string): Promise<FileMetadata> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getFileMetadataMock } = await import('./mock/fileMockService')
      return getFileMetadataMock(id)
    }
    return apiClient.get<unknown, FileMetadata>(`/api/v1/files/${id}`)
  },

  async deleteFile(id: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { deleteFileMock } = await import('./mock/fileMockService')
      return deleteFileMock(id)
    }
    return apiClient.delete<unknown, void>(`/api/v1/files/${id}`)
  },

  async getUserFiles(): Promise<FileMetadata[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getUserFilesMock } = await import('./mock/fileMockService')
      return getUserFilesMock()
    }
    try {
      return await apiClient.get<unknown, FileMetadata[]>('/api/v1/users/me/files')
    } catch (error) {
      console.error('Failed to fetch user files:', error)
      return []
    }
  },
}
