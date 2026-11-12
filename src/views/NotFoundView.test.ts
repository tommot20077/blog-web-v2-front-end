import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { renderWithRouterAsync } from '../test-utils'
import NotFoundView from './NotFoundView.vue'
import { recommendService } from '../api/recommendService'
import type { RecommendArticleResponse } from '../api/real/recommendService'

vi.mock('../api/recommendService', () => ({
  recommendService: {
    getTrending: vi.fn(),
    getRelatedArticles: vi.fn(),
  },
}))

function makeRecommend(overrides: Partial<RecommendArticleResponse> = {}): RecommendArticleResponse {
  return {
    uuid: 'rec-uuid-1',
    title: '推薦文章標題',
    slug: 'rec-article',
    summary: '',
    authorNickname: 'Y',
    viewCount: 0,
    likeCount: 0,
    publishedAt: '2026-04-08T10:00:00Z',
    tags: ['Vue 3'],
    coverImageUrl: null,
    ...overrides,
  }
}

describe('NotFoundView', () => {
  beforeEach(() => {
    vi.mocked(recommendService.getTrending).mockResolvedValue([])
  })

  it('404 主體永遠顯示（不依賴推薦）', async () => {
    const { container } = await renderWithRouterAsync(NotFoundView, {}, '/no-such-page')
    await flushPromises()
    expect(container.querySelector('[data-testid="notfound-root"]')).toBeInTheDocument()
  })

  it('以 (7d, 4) 呼叫 recommendService.getTrending', async () => {
    await renderWithRouterAsync(NotFoundView, {}, '/no-such-page')
    await flushPromises()
    expect(recommendService.getTrending).toHaveBeenCalledWith('7d', 4)
  })

  it('正常有推薦 → 顯示推薦區塊並渲染日期/標題/第一個 tag', async () => {
    vi.mocked(recommendService.getTrending).mockResolvedValue([
      makeRecommend({ uuid: 'r1', title: '第一篇推薦', publishedAt: '2026-04-08T10:00:00Z', tags: ['Vue 3'] }),
      makeRecommend({ uuid: 'r2', title: '第二篇推薦', publishedAt: '2026-05-12T10:00:00Z', tags: ['CSS'] }),
    ])

    const { container } = await renderWithRouterAsync(NotFoundView, {}, '/no-such-page')
    await flushPromises()

    const block = container.querySelector('[data-testid="notfound-suggestions"]')
    expect(block).toBeInTheDocument()

    const rows = container.querySelectorAll('[data-testid="notfound-suggestions"] a')
    expect(rows).toHaveLength(2)

    const text = block?.textContent ?? ''
    expect(text).toContain('第一篇推薦')
    expect(text).toContain('第二篇推薦')
    expect(text).toContain('Vue 3')
    expect(text).toContain('04.08')
  })

  it('每筆推薦連結到 /articles/{uuid}', async () => {
    vi.mocked(recommendService.getTrending).mockResolvedValue([
      makeRecommend({ uuid: 'r1', title: '第一篇推薦' }),
    ])

    const { container } = await renderWithRouterAsync(NotFoundView, {}, '/no-such-page')
    await flushPromises()

    const link = container.querySelector('[data-testid="notfound-suggestions"] a') as HTMLAnchorElement | null
    expect(link?.getAttribute('href')).toBe('/articles/r1')
  })

  it('空清單 → 隱藏推薦區塊', async () => {
    vi.mocked(recommendService.getTrending).mockResolvedValue([])

    const { container } = await renderWithRouterAsync(NotFoundView, {}, '/no-such-page')
    await flushPromises()

    expect(container.querySelector('[data-testid="notfound-suggestions"]')).not.toBeInTheDocument()
    // 404 主體仍在
    expect(container.querySelector('[data-testid="notfound-root"]')).toBeInTheDocument()
  })

  it('service 失敗 → 不拋錯、隱藏推薦區塊、404 主體仍在', async () => {
    vi.mocked(recommendService.getTrending).mockRejectedValue(new Error('boom'))

    const { container } = await renderWithRouterAsync(NotFoundView, {}, '/no-such-page')
    await flushPromises()

    expect(container.querySelector('[data-testid="notfound-suggestions"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-testid="notfound-root"]')).toBeInTheDocument()
  })
})
