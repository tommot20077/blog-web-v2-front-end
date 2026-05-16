import { afterEach, describe, expect, it, vi } from 'vitest'
import apiClient from './apiClient'
import { highlightService } from './highlightService'

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('highlightService facade', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('API mode delegates list() to the real endpoint', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.mocked(apiClient.get).mockResolvedValue([
      {
        uuid: 'h-1',
        snippet: 'selected text',
        prefix: '',
        suffix: '',
        color: '#FFEB3B',
        note: null,
        createdAt: '2026-05-16T00:00:00',
        updatedAt: '2026-05-16T00:00:00',
      },
    ])

    const result = await highlightService.list('article-uuid')

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/highlights')
    expect(result[0]!.uuid).toBe('h-1')
  })

  it('API mode delegates create() to the real endpoint', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.mocked(apiClient.post).mockResolvedValue({
      uuid: 'h-1',
      snippet: 'selected text',
      prefix: 'before',
      suffix: 'after',
      color: '#FFEB3B',
      note: null,
      createdAt: '2026-05-16T00:00:00',
      updatedAt: '2026-05-16T00:00:00',
    })

    await highlightService.create('article-uuid', {
      snippet: 'selected text',
      prefix: 'before',
      suffix: 'after',
      color: '#FFEB3B',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/articles/article-uuid/highlights', {
      snippet: 'selected text',
      prefix: 'before',
      suffix: 'after',
      color: '#FFEB3B',
    })
  })

  it('API mode delegates update() and delete() to real endpoints', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.mocked(apiClient.put).mockResolvedValue({
      uuid: 'h-1',
      snippet: 'selected text',
      color: '#C8E6C9',
      note: 'note',
      createdAt: '2026-05-16T00:00:00',
      updatedAt: '2026-05-16T01:00:00',
    })
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)

    await highlightService.update('h-1', { color: '#C8E6C9', note: 'note' })
    await highlightService.delete('h-1')

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/highlights/h-1', { color: '#C8E6C9', note: 'note' })
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/highlights/h-1')
  })

  it('mock mode supports article-scoped CRUD in memory', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true')
    const articleUuid = `article-${Date.now()}`
    const otherArticleUuid = `other-${Date.now()}`

    expect(await highlightService.list(articleUuid)).toEqual([])
    expect(await highlightService.list(otherArticleUuid)).toEqual([])

    const created = await highlightService.create(articleUuid, {
      snippet: 'selected text',
      prefix: 'before',
      suffix: 'after',
      color: '#FFEB3B',
      note: 'first note',
    })
    expect(created.uuid).toMatch(/^mock-highlight-/)
    expect(await highlightService.list(articleUuid)).toHaveLength(1)
    expect(await highlightService.list(otherArticleUuid)).toEqual([])

    const updated = await highlightService.update(created.uuid, { color: '#C8E6C9', note: 'updated' })
    expect(updated.color).toBe('#C8E6C9')
    expect(updated.note).toBe('updated')

    await highlightService.delete(created.uuid)
    expect(await highlightService.list(articleUuid)).toEqual([])
  })
})
