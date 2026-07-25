import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { screen } from '@testing-library/vue'
import ArchiveView from './ArchiveView.vue'
import { articleService } from '../api/articleService'
import type { ArchiveItem } from '../api/real/articleService'
import { renderWithRouter } from '../test-utils'

vi.mock('../api/articleService', () => ({
  articleService: {
    getArchive: vi.fn(),
  },
}))

const mockGetArchive = vi.mocked(articleService.getArchive)

function archiveItem(overrides: Partial<ArchiveItem> = {}): ArchiveItem {
  return {
    uuid: 'u-1',
    title: '文章標題',
    slug: 'article-slug',
    publishedAt: '2025-06-01T00:00:00',
    tags: ['Vue', 'CSS'],
    ...overrides,
  }
}

describe('ArchiveView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetArchive.mockResolvedValue([archiveItem()])
  })

  it('初始載入呼叫 articleService.getArchive 一次', async () => {
    renderWithRouter(ArchiveView, {}, '/archive')
    await flushPromises()

    expect(mockGetArchive).toHaveBeenCalledOnce()
  })

  it('載入中顯示 loading 狀態', async () => {
    let resolve!: (v: ArchiveItem[]) => void
    mockGetArchive.mockReturnValue(new Promise<ArchiveItem[]>((r) => { resolve = r }))

    renderWithRouter(ArchiveView, {}, '/archive')
    // 尚未 resolve
    expect(screen.getByTestId('archive-loading')).toBeInTheDocument()

    resolve([archiveItem()])
    await flushPromises()
    expect(screen.queryByTestId('archive-loading')).not.toBeInTheDocument()
  })

  it('成功載入 → 依年度由新到舊分組，年內由新到舊', async () => {
    mockGetArchive.mockResolvedValue([
      archiveItem({ uuid: 'u-2026a', title: '2026 三月', slug: 's-2026a', publishedAt: '2026-03-10T00:00:00' }),
      archiveItem({ uuid: 'u-2026b', title: '2026 一月', slug: 's-2026b', publishedAt: '2026-01-05T00:00:00' }),
      archiveItem({ uuid: 'u-2024a', title: '2024 文章', slug: 's-2024a', publishedAt: '2024-08-20T00:00:00' }),
    ])

    renderWithRouter(ArchiveView, {}, '/archive')
    await flushPromises()

    const groups = screen.getAllByTestId('archive-year')
    expect(groups).toHaveLength(2)
    // 年度由新到舊：2026 在 2024 之前
    expect(groups[0]!).toHaveTextContent('2026')
    expect(groups[1]!).toHaveTextContent('2024')

    // 標題皆有渲染
    expect(screen.getByText('2026 三月')).toBeInTheDocument()
    expect(screen.getByText('2026 一月')).toBeInTheDocument()
    expect(screen.getByText('2024 文章')).toBeInTheDocument()

    // 2026 年組內：三月（較新）排在一月之前
    const firstGroupText = groups[0]!.textContent ?? ''
    expect(firstGroupText.indexOf('2026 三月')).toBeLessThan(firstGroupText.indexOf('2026 一月'))
  })

  it('成功載入 → 連結指向 /articles/{uuid}', async () => {
    mockGetArchive.mockResolvedValue([archiveItem({ uuid: 'link-uuid', title: '連結文章' })])

    renderWithRouter(ArchiveView, {}, '/archive')
    await flushPromises()

    const link = screen.getByText('連結文章').closest('a')
    expect(link).toHaveAttribute('href', '/articles/link-uuid')
  })

  it('空結果 → 顯示 empty 狀態且無年度分組', async () => {
    mockGetArchive.mockResolvedValue([])

    renderWithRouter(ArchiveView, {}, '/archive')
    await flushPromises()

    expect(screen.getByTestId('archive-empty')).toBeInTheDocument()
    expect(screen.queryAllByTestId('archive-year')).toHaveLength(0)
  })

  it('大標改為「每一篇」，移除詩意副標「都還記得。」', async () => {
    renderWithRouter(ArchiveView, {}, '/archive')
    await flushPromises()

    const title = screen.getByRole('heading', { level: 1 })
    expect(title.textContent).toContain('每一篇')
    expect(title.textContent).not.toContain('都還記得')
  })

  it('服務錯誤 → 顯示 error 狀態，不崩潰', async () => {
    mockGetArchive.mockRejectedValue(new Error('boom'))

    renderWithRouter(ArchiveView, {}, '/archive')
    await flushPromises()

    expect(screen.getByTestId('archive-error')).toBeInTheDocument()
    expect(screen.queryAllByTestId('archive-year')).toHaveLength(0)
  })
})
