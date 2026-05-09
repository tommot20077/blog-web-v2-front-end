import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import { highlightService } from './highlightService'
import type { CreateHighlightRequest, Highlight } from './highlightService'

vi.mock('../apiClient')

describe('real highlightService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('list 呼叫 GET /articles/{uuid}/highlights', async () => {
    const highlights: Highlight[] = [
      {
        uuid: 'h1',
        snippet: 'text',
        color: '#FFEB3B',
        createdAt: '2026-05-09T00:00:00Z',
        updatedAt: '2026-05-09T00:00:00Z',
      },
    ]
    vi.mocked(apiClient.get).mockResolvedValue(highlights)
    const res = await highlightService.list('article-uuid')
    const createdAt: string = res[0]!.createdAt
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/highlights')
    expect(createdAt).toBe('2026-05-09T00:00:00Z')
    expect(res).toEqual(highlights)
  })

  it('create 呼叫 POST /articles/{uuid}/highlights', async () => {
    const request: CreateHighlightRequest = { snippet: 'text', color: '#FFEB3B', note: 'note' }
    const response: Highlight = {
      uuid: 'h1',
      ...request,
      createdAt: '2026-05-09T00:00:00Z',
      updatedAt: '2026-05-09T00:00:00Z',
    }
    vi.mocked(apiClient.post).mockResolvedValue(response)
    const res = await highlightService.create('article-uuid', request)
    const updatedAt: string = res.updatedAt
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/articles/article-uuid/highlights', request)
    expect(updatedAt).toBe('2026-05-09T00:00:00Z')
    expect(res).toEqual(response)
  })

  it('update 呼叫 PUT /highlights/{uuid}', async () => {
    const request = { color: '#00FF00', note: 'updated' }
    const response: Highlight = {
      uuid: 'h1',
      snippet: 'text',
      ...request,
      createdAt: '2026-05-09T00:00:00Z',
      updatedAt: '2026-05-09T00:00:00Z',
    }
    vi.mocked(apiClient.put).mockResolvedValue(response)
    const res = await highlightService.update('h1', request)
    const updatedAt: string = res.updatedAt
    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/highlights/h1', request)
    expect(updatedAt).toBe('2026-05-09T00:00:00Z')
    expect(res).toEqual(response)
  })

  it('update 不允許 note null，避免暗示可清空後端 note', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      uuid: 'h1',
      snippet: 'text',
      color: '#00FF00',
      createdAt: '2026-05-09T00:00:00Z',
      updatedAt: '2026-05-09T00:00:00Z',
    })
    // @ts-expect-error 後端 update note=null 會忽略，不代表清空 note
    await highlightService.update('h1', { note: null })
    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/highlights/h1', { note: null })
  })

  it('delete 呼叫 DELETE /highlights/{uuid}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)
    await highlightService.delete('h1')
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/highlights/h1')
  })
})
