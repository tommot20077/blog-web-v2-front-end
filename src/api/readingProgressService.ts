import type {
  ReadingProgress,
  UpdateReadingProgressRequest,
} from './real/readingProgressService'

export type { ReadingProgress, UpdateReadingProgressRequest }

export interface ReadingProgressService {
  get(articleUuid: string): Promise<ReadingProgress | null>
  update(articleUuid: string, request: UpdateReadingProgressRequest): Promise<void>
}

export const readingProgressService: ReadingProgressService = {
  async get(articleUuid) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { readingProgressService: svc } = await import('./mock/readingProgressService')
      return svc.get(articleUuid)
    }
    const { readingProgressService: svc } = await import('./real/readingProgressService')
    return svc.get(articleUuid)
  },

  async update(articleUuid, request) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { readingProgressService: svc } = await import('./mock/readingProgressService')
      return svc.update(articleUuid, request)
    }
    const { readingProgressService: svc } = await import('./real/readingProgressService')
    return svc.update(articleUuid, request)
  },
}
