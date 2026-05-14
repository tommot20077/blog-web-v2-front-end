import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import { seriesService } from './seriesService'
import type { Series, SeriesDetail, SeriesSummary } from './seriesService'
import type { BackendPageResult } from '../utils'

vi.mock('../apiClient')

describe('real seriesService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('list 呼叫 GET /series with pagination 並回傳分頁結果', async () => {
    const page: BackendPageResult<SeriesSummary> = {
      records: [
        {
          uuid: 'series-uuid',
          title: 'Series Title',
          slug: 'series-slug',
          articleCount: 3,
          createdAt: '2026-05-09T00:00:00Z',
          updatedAt: '2026-05-09T01:00:00Z',
        },
      ],
      total: 1,
      current: 1,
      size: 20,
      pages: 1,
    }
    vi.mocked(apiClient.get).mockResolvedValue(page)

    const res = await seriesService.list({ page: 1, size: 20 })
    const createdAt: string = res.records[0]!.createdAt

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/series', {
      params: { page: 1, size: 20 },
    })
    expect(createdAt).toBe('2026-05-09T00:00:00Z')
    expect(res).toEqual(page)
  })

  it('get 呼叫 GET /series/{slug} 並回傳詳情', async () => {
    const detail: SeriesDetail = {
      uuid: 'series-uuid',
      title: 'Series Title',
      slug: 'series-slug',
      author: {
        uuid: 'author-uuid',
        nickname: 'Yuan',
        avatarUrl: null,
      },
      articleCount: 3,
      createdAt: '2026-05-09T00:00:00Z',
      updatedAt: '2026-05-09T01:00:00Z',
      articles: [
        {
          uuid: 'article-uuid',
          title: 'Article Title',
          summary: 'summary',
          coverImageUrl: null,
          authorUuid: 'author-uuid',
          authorNickname: 'Yuan',
          status: 'PUBLISHED',
          viewCount: 10,
          createdAt: '2026-05-09T00:00:00Z',
          updatedAt: '2026-05-09T01:00:00Z',
          slug: 'article-title',
          likeCount: 2,
          commentCount: 1,
          publishedAt: '2026-05-09T02:00:00Z',
          tags: [{ id: 'tag-uuid', name: 'Vue', slug: 'vue' }],
          liked: false,
          bookmarked: true,
          lastReadProgress: 0.5,
          seriesUuid: 'series-uuid',
          seriesTitle: 'Series Title',
          seriesPosition: 1,
        },
      ],
      myProgress: {
        readCount: 1,
        totalCount: 3,
        nextUnreadArticleUuid: 'next-article-uuid',
      },
    }
    vi.mocked(apiClient.get).mockResolvedValue(detail)

    const res = await seriesService.get('series-slug')
    const authorNickname: string = res.author!.nickname!
    const articleStatus: string = res.articles[0]!.status
    const readCount: number = res.myProgress!.readCount

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/series/series-slug')
    expect(authorNickname).toBe('Yuan')
    expect(articleStatus).toBe('PUBLISHED')
    expect(readCount).toBe(1)
    expect(res).toEqual(detail)
  })

  it('create 呼叫 POST /series with body 並回傳 entity', async () => {
    const request = { title: 'Series Title', slug: 'series-slug', description: 'Intro' }
    const entity: Series = {
      id: 1,
      uuid: 'series-uuid',
      title: 'Series Title',
      slug: 'series-slug',
      description: 'Intro',
      coverImageUrl: null,
      authorId: 7,
      articleCount: 0,
      createdAt: '2026-05-09T00:00:00Z',
      updatedAt: '2026-05-09T01:00:00Z',
    }
    vi.mocked(apiClient.post).mockResolvedValue(entity)

    const res = await seriesService.create(request)

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/series', request)
    expect(res).toEqual(entity)
  })

  it('update 呼叫 PUT /series/{uuid} with body 並回傳 entity', async () => {
    const request = { title: 'Updated Series' }
    const entity: Series = {
      id: 1,
      uuid: 'series-uuid',
      title: 'Updated Series',
      slug: 'series-slug',
      authorId: 7,
      articleCount: 2,
      createdAt: '2026-05-09T00:00:00Z',
      updatedAt: '2026-05-09T02:00:00Z',
    }
    vi.mocked(apiClient.put).mockResolvedValue(entity)

    const res = await seriesService.update('series-uuid', request)

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/series/series-uuid', request)
    expect(res).toEqual(entity)
  })

  it('delete 呼叫 DELETE /series/{uuid}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)

    await seriesService.delete('series-uuid')

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/series/series-uuid')
  })

  it('addArticle 呼叫 PUT /series/{uuid}/articles/{articleUuid} with body', async () => {
    const request = { position: 2 }
    vi.mocked(apiClient.put).mockResolvedValue(undefined)

    await seriesService.addArticle('series-uuid', 'article-uuid', request)

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/series/series-uuid/articles/article-uuid', request)
  })

  it('removeArticle 呼叫 DELETE /series/{uuid}/articles/{articleUuid}', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined)

    await seriesService.removeArticle('series-uuid', 'article-uuid')

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/series/series-uuid/articles/article-uuid')
  })
})
