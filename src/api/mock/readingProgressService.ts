import type {
  ReadingProgress,
  UpdateReadingProgressRequest,
} from '../real/readingProgressService'

const progressByArticle = new Map<string, ReadingProgress>()

function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, progress))
}

export const readingProgressService = {
  async get(articleUuid: string): Promise<ReadingProgress | null> {
    return progressByArticle.get(articleUuid) ?? null
  },

  async update(articleUuid: string, request: UpdateReadingProgressRequest): Promise<void> {
    progressByArticle.set(articleUuid, {
      progress: clampProgress(request.progress),
      lastHeading: request.lastHeading ?? null,
      updatedAt: new Date().toISOString(),
    })
  },
}
