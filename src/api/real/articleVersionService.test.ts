import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import {
  articleVersionService,
  type ArticleVersion,
  type CreateManualVersionRequest,
  type VersionDetailResponse,
  type VersionPageResponse,
} from './articleVersionService'

vi.mock('../apiClient')

describe('real articleVersionService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('list 呼叫 GET /articles/{articleUuid}/versions with query params 並回傳分頁', async () => {
    const page: VersionPageResponse = {
      records: [
        {
          uuid: 'version-uuid',
          type: 'AUTO',
          createdAt: '2026-05-09T10:00:00Z',
          authorId: 7,
          contentLength: 1200,
          note: null,
        },
      ],
      total: 1,
      current: 1,
      size: 20,
      pages: 1,
    }
    const createdAt: string = page.records[0]!.createdAt
    expect(createdAt).toBe('2026-05-09T10:00:00Z')
    vi.mocked(apiClient.get).mockResolvedValue(page)

    const res = await articleVersionService.list('article-uuid', {
      type: 'AUTO',
      page: 1,
      size: 20,
    })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/article-uuid/versions', {
      params: { type: 'AUTO', page: 1, size: 20 },
    })
    expect(res).toEqual(page)
  })

  it('getDetail 呼叫 GET /articles/{articleUuid}/versions/{versionUuid} 並回傳 detail', async () => {
    const detail: VersionDetailResponse = {
      uuid: 'version-uuid',
      type: 'MANUAL',
      createdAt: '2026-05-09T10:00:00Z',
      authorId: 7,
      note: 'before editing',
      title: 'Version title',
      slug: 'version-title',
      content: 'version content',
      status: 'DRAFT',
      summary: null,
      categoryId: null,
      coverImageUrl: null,
      tags: ['018f3c9d-7f6c-7a01-9f9d-111111111111', '018f3c9d-7f6c-7a01-9f9d-222222222222'],
    }
    vi.mocked(apiClient.get).mockResolvedValue(detail)

    const res = await articleVersionService.getDetail('article-uuid', 'version-uuid')

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/v1/articles/article-uuid/versions/version-uuid',
    )
    expect(res).toEqual(detail)
  })

  it('createManual 呼叫 POST /articles/{articleUuid}/versions/manual with body 並回傳 entity', async () => {
    const request: CreateManualVersionRequest = {
      note: 'manual snapshot',
    }
    const version: ArticleVersion = {
      id: 11,
      uuid: 'version-uuid',
      articleId: 22,
      authorId: 7,
      type: 'MANUAL',
      title: 'Manual title',
      slug: 'manual-title',
      content: 'manual content',
      status: 'DRAFT',
      createdAt: '2026-05-09T10:00:00Z',
      note: 'manual snapshot',
      summary: null,
      categoryId: null,
      coverImageUrl: null,
      tags: ['018f3c9d-7f6c-7a01-9f9d-111111111111'],
    }
    vi.mocked(apiClient.post).mockResolvedValue(version)

    const res = await articleVersionService.createManual('article-uuid', request)

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/articles/article-uuid/versions/manual',
      request,
    )
    expect(res).toEqual(version)
  })

  it('delete 呼叫 DELETE /articles/{articleUuid}/versions/{versionUuid}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)

    await articleVersionService.delete('article-uuid', 'version-uuid')

    expect(apiClient.delete).toHaveBeenCalledWith(
      '/api/v1/articles/article-uuid/versions/version-uuid',
    )
  })

  it('promote 呼叫 POST /articles/{articleUuid}/versions/{versionUuid}/promote 並回傳 entity', async () => {
    const version: ArticleVersion = {
      id: 11,
      uuid: 'version-uuid',
      articleId: 22,
      authorId: 7,
      type: 'MANUAL',
      title: 'Promoted title',
      slug: 'promoted-title',
      content: 'promoted content',
      status: 'PUBLISHED',
      createdAt: '2026-05-09T10:00:00Z',
    }
    vi.mocked(apiClient.post).mockResolvedValue(version)

    const res = await articleVersionService.promote('article-uuid', 'version-uuid')

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/articles/article-uuid/versions/version-uuid/promote',
    )
    expect(res).toEqual(version)
  })

  it('restore 呼叫 POST /articles/{articleUuid}/versions/{versionUuid}/restore', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(undefined)

    await articleVersionService.restore('article-uuid', 'version-uuid')

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/articles/article-uuid/versions/version-uuid/restore',
    )
  })
})
