import type { FileUploadResponse, FileUsageType } from '../../types/editor'

export function uploadFileMock(file: File, usageType: FileUsageType): Promise<FileUploadResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      resolve({
        id,
        url: `https://mock-cdn.example.com/uploads/${id}/${file.name}`,
        width: 800,
        height: 600,
        size: file.size > 0 ? file.size : 102_400,
        usageType,
      })
    }, 500)
  })
}
