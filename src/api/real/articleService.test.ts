import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import { articleService } from './articleService'
import type { ArchiveItem } from './articleService'

vi.mock('../apiClient')

describe('real articleService 標籤映射（tags 防迴歸 + tagRefs 新增）', () => {
  beforeEach(() => vi.clearAllMocks())

  const backendTags = [
    { id: 'tag-uuid-1', name: 'frontend', slug: 'frontend' },
    { id: 'tag-uuid-2', name: 'vue', slug: 'vue' },
  ]

  it('getArticles：tags 維持原本行為，仍是純名稱字串陣列（防迴歸關鍵斷言）', async () => {
    const backendPage = {
      records: [
        {
          uuid: 'a-1',
          title: '文章 A',
          summary: '摘要',
          coverImageUrl: null,
          authorNickname: 'Yuan',
          viewCount: 1,
          likeCount: 0,
          commentCount: 0,
          publishedAt: '2026-01-01',
          tags: backendTags,
          slug: 'article-a',
        },
      ],
      current: 1,
      size: 10,
      pages: 1,
      total: 1,
    }
    vi.mocked(apiClient.get).mockResolvedValue(backendPage)

    const result = await articleService.getArticles(1, 10, '全部', '')

    expect(result.records[0]!.tags).toEqual(['frontend', 'vue'])
  })

  it('getArticles：同時映射 tagRefs，保留 slug 供標籤連結使用', async () => {
    const backendPage = {
      records: [
        {
          uuid: 'a-1',
          title: '文章 A',
          summary: '摘要',
          coverImageUrl: null,
          authorNickname: 'Yuan',
          viewCount: 1,
          likeCount: 0,
          commentCount: 0,
          publishedAt: '2026-01-01',
          tags: backendTags,
          slug: 'article-a',
        },
      ],
      current: 1,
      size: 10,
      pages: 1,
      total: 1,
    }
    vi.mocked(apiClient.get).mockResolvedValue(backendPage)

    const result = await articleService.getArticles(1, 10, '全部', '')

    expect(result.records[0]!.tagRefs).toEqual([
      { name: 'frontend', slug: 'frontend' },
      { name: 'vue', slug: 'vue' },
    ])
  })

  it('getArticleByUuid：detail 同時保留 tags（string[]，防迴歸）與 tagRefs（含 slug）', async () => {
    const backendDetail = {
      uuid: 'a-1',
      title: '文章 A',
      summary: '摘要',
      coverImageUrl: null,
      authorNickname: 'Yuan',
      viewCount: 1,
      likeCount: 0,
      commentCount: 0,
      publishedAt: '2026-01-01',
      tags: backendTags,
      slug: 'article-a',
      content: '# Hello',
      categories: [],
      liked: false,
      bookmarked: false,
    }
    vi.mocked(apiClient.get).mockResolvedValue(backendDetail)

    const result = await articleService.getArticleByUuid('a-1')

    expect(result!.tags).toEqual(['frontend', 'vue'])
    expect(result!.tagRefs).toEqual([
      { name: 'frontend', slug: 'frontend' },
      { name: 'vue', slug: 'vue' },
    ])
  })
})

describe('real articleService.getArticleByUuid', () => {
  beforeEach(() => vi.clearAllMocks())

  it('回應含 status 欄位時，原樣映射到 ArticleDetailItem.status（供 canRead 授權矩陣未發布內容的前端判斷使用）', async () => {
    const backend = {
      uuid: 'u-1',
      title: '草稿文章',
      summary: '摘要',
      coverImageUrl: null,
      authorNickname: 'Author',
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      publishedAt: '',
      tags: [],
      slug: 'draft-article',
      content: '# draft',
      categories: [],
      liked: false,
      bookmarked: false,
      status: 'DRAFT',
    }
    vi.mocked(apiClient.get).mockResolvedValue(backend)

    const result = await articleService.getArticleByUuid('u-1')

    expect(result?.status).toBe('DRAFT')
  })
})

describe('real articleService.getArchive', () => {
  beforeEach(() => vi.clearAllMocks())

  it('呼叫 GET /api/v1/articles/archive（無 params）並原樣回傳 unwrap 後的陣列', async () => {
    const backend: ArchiveItem[] = [
      { uuid: 'u-2026-01', title: '2026 文章', slug: 'a-2026', publishedAt: '2026-03-01T00:00:00', tags: ['Vue'] },
      { uuid: 'u-2025-01', title: '2025 文章', slug: 'a-2025', publishedAt: '2025-06-01T00:00:00', tags: ['CSS', 'TS'] },
    ]
    vi.mocked(apiClient.get).mockResolvedValue(backend)

    const result = await articleService.getArchive()

    expect(apiClient.get).toHaveBeenCalledOnce()
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/archive')
    expect(result).toEqual(backend)
    // tags 已是字串陣列，原樣傳遞
    expect(result[0]!.tags).toEqual(['Vue'])
  })

  it('後端回傳空陣列 → 回傳空陣列', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([])

    const result = await articleService.getArchive()

    expect(result).toEqual([])
  })

  it('網路錯誤 → 向上拋出錯誤（讓 view 顯示 error 狀態，不誤判為空）', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network failure'))

    await expect(articleService.getArchive()).rejects.toThrow('Network failure')
  })
})

describe('real articleService.getArticles 篩選參數（後端 2026-09-27 契約）', () => {
  beforeEach(() => vi.clearAllMocks())

  const emptyPage = { records: [], current: 1, size: 10, pages: 0, total: 0 }

  function sentParams(): Record<string, unknown> {
    const call = vi.mocked(apiClient.get).mock.calls[0]
    return (call?.[1] as { params: Record<string, unknown> }).params
  }

  it('未帶篩選 → 只送 page 與 size（向下相容）', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyPage)

    await articleService.getArticles(1, 10, '全部', '')

    expect(sentParams()).toEqual({ page: 1, size: 10 })
  })

  it('tags → 以逗號分隔的單一 tags 參數送出（axios 預設的 tags[]= 後端不認得）', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyPage)

    await articleService.getArticles(1, 100, '全部', '', { tags: ['vue-3', 'tdd'] })

    expect(sentParams()).toEqual({ page: 1, size: 100, tags: 'vue-3,tdd' })
  })

  it('categorySlugs → 以逗號分隔的單一 categorySlug 參數送出', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyPage)

    await articleService.getArticles(1, 1000, '全部', '', { categorySlugs: ['frontend', 'backend'] })

    expect(sentParams()).toEqual({ page: 1, size: 1000, categorySlug: 'frontend,backend' })
  })

  it('既有的單一 category 參數與 categorySlugs 合併，且不重複', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyPage)

    await articleService.getArticles(1, 10, 'Frontend', '', { categorySlugs: ['frontend', 'life'] })

    expect(sentParams()).toEqual({ page: 1, size: 10, categorySlug: 'frontend,life' })
  })

  it('空陣列視同未篩選，不送出空字串參數', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyPage)

    await articleService.getArticles(1, 10, '全部', '', { tags: [], categorySlugs: [] })

    expect(sentParams()).toEqual({ page: 1, size: 10 })
  })
})
