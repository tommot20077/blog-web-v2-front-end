import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { flushPromises } from '@vue/test-utils'
import { renderWithRouterAsync } from '../test-utils'
import TagsIndexView from './TagsIndexView.vue'
import { tagService } from '../api/tagService'
import { seriesService } from '../api/seriesService'
import type { TagDetailResponse } from '../api/tagService'
import type { SeriesSummary } from '../api/seriesService'
import type { BackendPageResult } from '../api/utils'

vi.mock('../api/tagService', () => ({
  tagService: {
    getAllTags: vi.fn(),
  },
}))

vi.mock('../api/seriesService', () => ({
  seriesService: {
    list: vi.fn(),
  },
}))

const realTags: TagDetailResponse[] = [
  { uuid: 't1', name: 'Vue', slug: 'vue', articleCount: 18 },
  { uuid: 't2', name: 'TDD', slug: 'tdd', articleCount: 9 },
  { uuid: 't3', name: 'PostgreSQL', slug: 'postgresql', articleCount: 4 },
]

function pageOf(records: SeriesSummary[]): BackendPageResult<SeriesSummary> {
  return { records, total: records.length, current: 1, size: 100, pages: 1 }
}

const realSeries: SeriesSummary[] = [
  {
    uuid: 's1',
    title: 'Vue 3 響應式系統內部',
    slug: 'vue-reactivity',
    description: '從 reactive 到 computed 的完整解剖。',
    articleCount: 8,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
]

describe('TagsIndexView', () => {
  beforeEach(() => {
    vi.mocked(tagService.getAllTags).mockResolvedValue(realTags)
    vi.mocked(seriesService.list).mockResolvedValue(pageOf(realSeries))
  })

  it('標籤雲使用 tagService.getAllTags 回傳的真實標籤渲染', async () => {
    const { container } = await renderWithRouterAsync(TagsIndexView, {}, '/tags')
    await flushPromises()

    expect(tagService.getAllTags).toHaveBeenCalled()
    const cloud = container.querySelector('[data-testid="tags-cloud"]')
    expect(cloud).toBeInTheDocument()
    expect(cloud?.textContent).toContain('Vue')
    expect(cloud?.textContent).toContain('TDD')
    expect(cloud?.textContent).toContain('PostgreSQL')
    // 真實 count 應出現
    expect(cloud?.textContent).toContain('18')
  })

  it('Series 段用 seriesService.list({ size: 100 }) 取得真實系列並渲染', async () => {
    const { container } = await renderWithRouterAsync(TagsIndexView, {}, '/tags')
    await flushPromises()

    expect(seriesService.list).toHaveBeenCalledWith({ size: 100 })
    const series = container.querySelector('[data-testid="tags-series"]')
    expect(series).toBeInTheDocument()
    expect(series?.textContent).toContain('Vue 3 響應式系統內部')
  })

  it('seriesService.list 無資料時整個 Series 區塊隱藏', async () => {
    vi.mocked(seriesService.list).mockResolvedValue(pageOf([]))

    const { container } = await renderWithRouterAsync(TagsIndexView, {}, '/tags')
    await flushPromises()

    expect(container.querySelector('[data-testid="tags-series"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-testid="tags-series-header"]')).not.toBeInTheDocument()
  })

  it('getAllTags 失敗回空陣列時標籤雲為空但頁面不崩潰', async () => {
    vi.mocked(tagService.getAllTags).mockResolvedValue([])

    const { container } = await renderWithRouterAsync(TagsIndexView, {}, '/tags')
    await flushPromises()

    expect(container.querySelector('[data-testid="tags-index-root"]')).toBeInTheDocument()
    const cloud = container.querySelector('[data-testid="tags-cloud"]')
    expect(cloud?.querySelectorAll('.tg-chip').length ?? 0).toBe(0)
  })

  it('初始（資料尚未 resolve）顯示 loading 狀態', async () => {
    // 讓 getAllTags 維持 pending，斷言初始 loading
    let resolveTags: (v: TagDetailResponse[]) => void = () => {}
    vi.mocked(tagService.getAllTags).mockReturnValue(
      new Promise<TagDetailResponse[]>((r) => { resolveTags = r }),
    )

    const { container } = await renderWithRouterAsync(TagsIndexView, {}, '/tags')

    expect(container.querySelector('[data-testid="tags-loading"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="tags-cloud"]')).not.toBeInTheDocument()

    resolveTags(realTags)
    await flushPromises()
    expect(container.querySelector('[data-testid="tags-loading"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-testid="tags-cloud"]')).toBeInTheDocument()
  })

  it('原始碼不再 import mock 假資料（allMockArticles）也無寫死 SERIES', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/views/TagsIndexView.vue'),
      'utf-8',
    )
    expect(src).not.toContain('allMockArticles')
    expect(src).not.toContain('mock/data')
  })
})
