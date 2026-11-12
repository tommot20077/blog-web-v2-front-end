import type { FileUploadResponse, FileUsageType } from '../../types/editor'
import type { FileListParams, FileMetadata } from '../../types/user'

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

export function getFileMetadataMock(id: string): Promise<FileMetadata> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        originalName: `mock-file-${id}.png`,
        contentType: 'image/png',
        size: 102_400,
        width: 800,
        height: 600,
        usageType: 'ARTICLE_CONTENT',
        hasThumbnail: false,
        uploaderId: 'mock-user-1',
        createdAt: new Date().toISOString(),
      })
    }, 200)
  })
}

export function deleteFileMock(_id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

export function getUserFilesMock(_params: FileListParams = {}): Promise<FileMetadata[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'file-mock-1',
          originalName: 'cover-image.png',
          contentType: 'image/png',
          size: 204_800,
          width: 1200,
          height: 630,
          usageType: 'ARTICLE_COVER',
          hasThumbnail: true,
          uploaderId: 'mock-user-1',
          createdAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'file-mock-2',
          originalName: 'content-image.jpg',
          contentType: 'image/jpeg',
          size: 102_400,
          width: 800,
          height: 600,
          usageType: 'ARTICLE_CONTENT',
          hasThumbnail: false,
          uploaderId: 'mock-user-1',
          createdAt: '2026-03-10T14:00:00Z',
        },
      ])
    }, 200)
  })
}
