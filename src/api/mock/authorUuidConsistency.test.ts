import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTrendingMock, getRelatedArticlesMock } from './recommendMockService'
import { searchSearchMock } from './searchMockService'
import { bookmarkService, seedBookmark, resetBookmarkMockState } from './bookmarkService'
import { getProfileMock } from './authorMockService'
import { allMockArticles } from './data'

/**
 * 所有帶作者名的 mock（推薦、搜尋、收藏）都要帶 authorUuid，
 * 且該 uuid 能在 authorMockService 查到作者頁，否則 mock 模式點作者會落到 404。
 */
async function settle<T>(p: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync()
  return p
}

describe('mock 資料的 authorUuid 一致性', () => {
  beforeEach(() => { vi.useFakeTimers(); resetBookmarkMockState() })
  afterEach(() => { vi.useRealTimers() })

  it('trending／related 的 authorUuid 與文章 mock 一致，且作者頁存在', async () => {
    const items = [...await settle(getTrendingMock(5)), ...await settle(getRelatedArticlesMock('x', 5))]
    expect(items.length).toBeGreaterThan(0)
    for (const it of items) {
      expect(it.authorUuid).toBe(allMockArticles.find(a => a.uuid === it.uuid)!.authorUuid)
      expect((await settle(getProfileMock(it.authorUuid!)))?.nickname).toBe(it.authorNickname)
    }
  })

  it('搜尋結果每筆都有 authorUuid，且作者頁存在、暱稱相符', async () => {
    const res = await settle(searchSearchMock({}))
    expect(res.records.length).toBeGreaterThan(0)
    for (const r of res.records) {
      expect(r.authorUuid).toBeTruthy()
      expect((await settle(getProfileMock(r.authorUuid!)))?.nickname).toBe(r.authorNickname)
    }
  })

  it('收藏列表的 authorUuid 與文章 mock 一致', async () => {
    seedBookmark(allMockArticles[0].uuid)
    const res = await settle(bookmarkService.getMyBookmarks(1, 10))
    expect(res.records[0].authorUuid).toBe(allMockArticles[0].authorUuid)
  })
})
