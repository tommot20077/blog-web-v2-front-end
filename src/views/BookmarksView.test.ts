import { flushPromises } from '@vue/test-utils'
import { screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import BookmarksView from './BookmarksView.vue'
import { bookmarkService } from '../api/bookmarkService'
import { renderWithRouter } from '../test-utils'
import type { BookmarkArticleSummary } from '../api/real/bookmarkService'
import type { BackendPageResult } from '../api/utils'

vi.mock('../api/bookmarkService', () => ({
  bookmarkService: {
    getMyBookmarks: vi.fn(),
    unbookmark: vi.fn(),
  },
}))

const mockGetMyBookmarks = vi.mocked(bookmarkService.getMyBookmarks)
const mockUnbookmark = vi.mocked(bookmarkService.unbookmark)

function bookmarkedArticle(overrides: Partial<BookmarkArticleSummary> = {}): BookmarkArticleSummary {
  return {
    uuid: 'bookmark-uuid',
    title: '收藏文章',
    summary: '收藏摘要',
    coverImageUrl: null,
    authorNickname: 'Yuan',
    status: 'PUBLISHED',
    viewCount: 12,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-02T00:00:00Z',
    slug: 'bookmarked-article',
    likeCount: 3,
    commentCount: 2,
    publishedAt: '2026-05-03T00:00:00Z',
    tags: [{ id: 'tag-1', name: 'Vue', slug: 'vue' }],
    bookmarked: true,
    ...overrides,
  }
}

function page(records: BookmarkArticleSummary[], overrides: Partial<BackendPageResult<BookmarkArticleSummary>> = {}) {
  return {
    records,
    total: records.length,
    current: 1,
    size: 10,
    pages: 1,
    ...overrides,
  }
}

describe('BookmarksView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMyBookmarks.mockResolvedValue(page([bookmarkedArticle()]))
    mockUnbookmark.mockResolvedValue(undefined)
  })

  it('初始載入呼叫 getMyBookmarks(page=1, size=10)', async () => {
    renderWithRouter(BookmarksView, {}, '/bookmarks')
    await flushPromises()

    expect(mockGetMyBookmarks).toHaveBeenCalledWith(1, 10)
  })

  it('載入後顯示收藏文章列表', async () => {
    renderWithRouter(BookmarksView, {}, '/bookmarks')
    await flushPromises()

    expect(screen.getByTestId('bookmarks-root')).toBeInTheDocument()
    expect(screen.getByText('收藏文章')).toBeInTheDocument()
    expect(screen.getByText('收藏摘要')).toBeInTheDocument()
    expect(screen.getByText('# Vue')).toBeInTheDocument()
  })

  it('空結果顯示 empty state', async () => {
    mockGetMyBookmarks.mockResolvedValue(page([]))
    renderWithRouter(BookmarksView, {}, '/bookmarks')
    await flushPromises()

    expect(screen.getByText('目前沒有收藏文章')).toBeInTheDocument()
  })

  it('取消收藏後從目前列表移除文章', async () => {
    const user = userEvent.setup()
    renderWithRouter(BookmarksView, {}, '/bookmarks')
    await flushPromises()

    await user.click(screen.getByTestId('bookmark-row-remove-bookmark-uuid'))
    await flushPromises()

    expect(mockUnbookmark).toHaveBeenCalledWith('bookmark-uuid')
    expect(screen.queryByText('收藏文章')).not.toBeInTheDocument()
  })

  it('多頁時點下一頁會以 page=2 重抓', async () => {
    const user = userEvent.setup()
    mockGetMyBookmarks.mockResolvedValue(page([bookmarkedArticle()], { total: 20, pages: 2, size: 10 }))
    renderWithRouter(BookmarksView, {}, '/bookmarks')
    await flushPromises()

    await user.click(screen.getByText('下一頁'))
    await flushPromises()

    expect(mockGetMyBookmarks).toHaveBeenCalledWith(2, 10)
  })
})
