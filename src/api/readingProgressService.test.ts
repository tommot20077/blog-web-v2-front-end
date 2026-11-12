import { afterEach, describe, expect, it, vi } from 'vitest'
import apiClient from './apiClient'
import { readingProgressService } from './readingProgressService'

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('readingProgressService facade', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('API mode delegates get() to the real endpoint', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.mocked(apiClient.get).mockResolvedValue({
      progress: 0.5,
      lastHeading: 'intro',
      updatedAt: '2026-05-16T00:00:00Z',
    })

    const result = await readingProgressService.get('article-uuid')

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/progress')
    expect(result?.progress).toBe(0.5)
  })

  it('API mode delegates update() to the real endpoint', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.mocked(apiClient.put).mockResolvedValue(undefined)

    await readingProgressService.update('article-uuid', { progress: 0.75 })

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/articles/article-uuid/progress', { progress: 0.75 })
  })

  it('mock mode stores and returns progress in memory', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true')
    const uuid = `mock-article-${Date.now()}`

    expect(await readingProgressService.get(uuid)).toBeNull()

    await readingProgressService.update(uuid, { progress: 0.42, lastHeading: 'middle' })
    const result = await readingProgressService.get(uuid)

    expect(result).toEqual({
      progress: 0.42,
      lastHeading: 'middle',
      updatedAt: expect.any(String),
    })
  })
})
