import type { FileUploadResponse, FileUsageType } from '../types/editor'
import type { FileListParams, FileMetadata } from '../types/user'

export const fileService = {
  async uploadFile(file: File, usageType: FileUsageType): Promise<FileUploadResponse> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { fileService: svc } = await import('./mock/fileService')
      return svc.uploadFile(file, usageType)
    }
    const { fileService: svc } = await import('./real/fileService')
    return svc.uploadFile(file, usageType)
  },

  async getFileMetadata(id: string): Promise<FileMetadata> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { fileService: svc } = await import('./mock/fileService')
      return svc.getFileMetadata(id)
    }
    const { fileService: svc } = await import('./real/fileService')
    return svc.getFileMetadata(id)
  },

  async deleteFile(id: string): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { fileService: svc } = await import('./mock/fileService')
      return svc.deleteFile(id)
    }
    const { fileService: svc } = await import('./real/fileService')
    return svc.deleteFile(id)
  },

  async getUserFiles(params: FileListParams = {}): Promise<FileMetadata[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { fileService: svc } = await import('./mock/fileService')
      return svc.getUserFiles(params)
    }
    const { fileService: svc } = await import('./real/fileService')
    return svc.getUserFiles(params)
  },
}
