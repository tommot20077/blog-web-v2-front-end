import type { FileUploadResponse, FileUsageType } from '../../types/editor'

export function uploadFileMock(file: File, _usageType: FileUsageType): Promise<FileUploadResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      resolve({
        url: `https://mock-cdn.example.com/uploads/${fileId}/${file.name}`,
        fileId,
        fileName: file.name,
        fileSize: file.size,
      })
    }, 500)
  })
}
