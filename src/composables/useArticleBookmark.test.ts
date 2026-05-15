import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useArticleBookmark } from './useArticleBookmark'
import { bookmarkService } from '../api/bookmarkService'

const mockRequireAuth = vi.fn()
const mockShowToast = vi.fn()

vi.mock('../api/bookmarkService', () => ({
  bookmarkService: {
    bookmark: vi.fn(),
    unbookmark: vi.fn(),
  },
}))

vi.mock('./useAuthWall', () => ({
  useAuthWall: () => ({ requireAuth: mockRequireAuth }),
}))

vi.mock('./useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

describe('useArticleBookmark', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockReturnValue(true)
  })

  it('未收藏時 toggle 會 optimistic 設為 bookmarked 並呼叫 bookmark API', async () => {
    vi.mocked(bookmarkService.bookmark).mockResolvedValue(undefined)
    const state = useArticleBookmark(ref('article-uuid'), { bookmarked: false })

    await state.toggle()

    expect(state.bookmarked.value).toBe(true)
    expect(bookmarkService.bookmark).toHaveBeenCalledWith('article-uuid')
  })

  it('已收藏時 toggle 會 optimistic 取消並呼叫 unbookmark API', async () => {
    vi.mocked(bookmarkService.unbookmark).mockResolvedValue(undefined)
    const state = useArticleBookmark(ref('article-uuid'), { bookmarked: true })

    await state.toggle()

    expect(state.bookmarked.value).toBe(false)
    expect(bookmarkService.unbookmark).toHaveBeenCalledWith('article-uuid')
  })

  it('API 失敗時 rollback 並顯示錯誤 toast', async () => {
    vi.mocked(bookmarkService.bookmark).mockRejectedValue(new Error('failed'))
    const state = useArticleBookmark(ref('article-uuid'), { bookmarked: false })

    await state.toggle()

    expect(state.bookmarked.value).toBe(false)
    expect(mockShowToast).toHaveBeenCalledWith('收藏失敗，請稍後再試', 'error')
  })

  it('未登入時不呼叫 API', async () => {
    mockRequireAuth.mockReturnValue(false)
    const state = useArticleBookmark(ref('article-uuid'), { bookmarked: false })

    await state.toggle()

    expect(state.bookmarked.value).toBe(false)
    expect(bookmarkService.bookmark).not.toHaveBeenCalled()
  })
})
