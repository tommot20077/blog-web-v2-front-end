import apiClient from '../apiClient'
import type { FileUploadResponse, FileUsageType } from '../../types/editor'
import type { FileListParams, FileMetadata } from '../../types/user'

export const fileService = {
  async uploadFile(file: File, usageType: FileUsageType): Promise<FileUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('usageType', usageType)
    return apiClient.post<unknown, FileUploadResponse>('/api/v1/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  async getFileMetadata(id: string): Promise<FileMetadata> {
    return apiClient.get<unknown, FileMetadata>(`/api/v1/files/${id}`)
  },

  async deleteFile(id: string): Promise<void> {
    return apiClient.delete<unknown, void>(`/api/v1/files/${id}`)
  },

  async getUserFiles(params: FileListParams = {}): Promise<FileMetadata[]> {
    try {
      return await apiClient.get<unknown, FileMetadata[]>('/api/v1/users/me/files', { params })
    } catch (error) {
      console.error('Failed to fetch user files:', error)
      return []
    }
  },
}
