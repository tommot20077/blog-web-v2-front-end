import apiClient from '../apiClient'

export interface ReadingProgress {
  progress: number
  lastHeading?: string | null
  updatedAt: string
}

export interface UpdateReadingProgressRequest {
  progress: number
  lastHeading?: string | null
}

export const readingProgressService = {
  async get(articleUuid: string): Promise<ReadingProgress> {
    return apiClient.get<unknown, ReadingProgress>(`/api/v1/articles/${articleUuid}/progress`)
  },

  async update(articleUuid: string, request: UpdateReadingProgressRequest): Promise<void> {
    await apiClient.put(`/api/v1/articles/${articleUuid}/progress`, request)
  },
}
