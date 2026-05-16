import { describe, expect, it, beforeEach } from 'vitest'
import { loginMock, getMeMock } from './authMockService'
import { bookmarkService } from './bookmarkService'
import { articleLikeService } from './articleLikeService'
import { commentService } from './commentService'
import { rejectArticleMock, getPendingArticlesMock } from './adminMockService'
import { getMockArticleDetail } from './data'
import { getTagBySlugMock, followTagMock } from './tagMockService'
import { resetAllMockState, seedBookmark, seedLike } from './e2eMockState'

describe('e2eMockState', () => {
  beforeEach(() => {
    resetAllMockState()
  })

  it('reset 後 reader 與 author 是不同角色', async () => {
    await loginMock({ identifier: 'reader@test.com', password: 'Password1' })
    const reader = await getMeMock()
    expect(reader.role).toBe('USER')

    resetAllMockState()

    await loginMock({ identifier: 'author@test.com', password: 'Password1' })
    const author = await getMeMock()
    expect(author.role).toBe('AUTHOR')
  })

  it('reset 會清空收藏、按讚、留言與 tag follow 狀態', async () => {
    seedBookmark('a-2025-01')
    await articleLikeService.like('a-2025-01')
    await commentService.create('a-2025-01', { content: '這是一則測試留言' })
    const tag = await getTagBySlugMock('vue-3')
    expect(tag).not.toBeNull()
    await followTagMock(tag!.uuid)

    resetAllMockState()

    const bookmarks = await bookmarkService.getMyBookmarks(1, 10)
    const comments = await commentService.list('a-2025-01', 1, 10, 'newest')
    const tagAfterReset = await getTagBySlugMock('vue-3')

    expect(bookmarks.records).toHaveLength(0)
    expect(articleLikeService.isLiked('a-2025-01')).toBe(false)
    expect(comments.totalCommentCount).toBe(0)
    expect(tagAfterReset?.followed).toBe(false)
  })

  it('reset 會還原 admin 審核異動過的 editor article seed 狀態', async () => {
    await rejectArticleMock('editor-pending-1', '測試退回原因')

    resetAllMockState()

    const pending = await getPendingArticlesMock(1, 10)
    const restored = pending.records.find(article => article.uuid === 'editor-pending-1')

    expect(restored?.status).toBe('PENDING_REVIEW')
    expect(restored?.rejectReason).toBeNull()
  })

  it('seedLike 與 seedBookmark 會反映在文章詳情初始互動狀態', () => {
    seedLike('a-2025-01')
    seedBookmark('a-2025-01')

    const detail = getMockArticleDetail('a-2025-01')

    expect(detail?.liked).toBe(true)
    expect(detail?.bookmarked).toBe(true)
  })
})
