import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { searchAuthorsMock, getProfileMock } from './authorMockService'
import { getArticlesMock } from './articleMockService'
import { allMockArticles } from './data'

async function run<T>(p: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync()
  return p
}

describe('authorMockService', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  describe('searchAuthorsMock', () => {
    it('無 keyword 回全部有已發布文章的作者，篇數與文章 mock 一致', async () => {
      const list = await run(searchAuthorsMock(''))
      expect(list.length).toBeGreaterThanOrEqual(4)
      for (const a of list) {
        expect(a.publishedArticleCount).toBe(allMockArticles.filter(x => x.authorUuid === a.uuid).length)
        expect(a.publishedArticleCount).toBeGreaterThan(0)
      }
    })

    it('排序：篇數 DESC → nickname 不分大小寫 ASC → uuid ASC', async () => {
      const list = await run(searchAuthorsMock(''))
      for (let i = 1; i < list.length; i++) {
        const p = list[i - 1], c = list[i]
        if (p.publishedArticleCount === c.publishedArticleCount) {
          const pn = p.nickname.toLowerCase(), cn = c.nickname.toLowerCase()
          expect(pn <= cn).toBe(true)
          if (pn === cn) expect(p.uuid <= c.uuid).toBe(true)
        } else {
          expect(p.publishedArticleCount).toBeGreaterThan(c.publishedArticleCount)
        }
      }
    })

    it('keyword 不分大小寫、任意位置比對', async () => {
      const list = await run(searchAuthorsMock('UAN'))
      expect(list.map(a => a.nickname)).toContain('Yuan')
      expect(list.every(a => a.nickname.toLowerCase().includes('uan'))).toBe(true)
    })

    it('keyword 會 trim', async () => {
      const list = await run(searchAuthorsMock('  han  '))
      expect(list.map(a => a.nickname)).toEqual(['Han'])
    })

    it('% 與 _ 當字面字元，不是萬用字元', async () => {
      expect(await run(searchAuthorsMock('%'))).toEqual([])
      expect(await run(searchAuthorsMock('_'))).toEqual([])
      expect(await run(searchAuthorsMock('Y_an'))).toEqual([])
    })

    it('沒有符合時回空陣列', async () => {
      expect(await run(searchAuthorsMock('不存在的人'))).toEqual([])
    })

    it('回傳最多 20 筆', async () => {
      const list = await run(searchAuthorsMock(''))
      expect(list.length).toBeLessThanOrEqual(20)
    })

    it('keyword trim 後超過 50 字 → 拒絕（對齊後端 400）', async () => {
      const p = searchAuthorsMock('a'.repeat(51))
      const assertion = expect(p).rejects.toThrow()
      await vi.runAllTimersAsync()
      await assertion
    })

    it('不包含沒有已發布文章的作者（Newbie 只有 profile）', async () => {
      const list = await run(searchAuthorsMock('Newbie'))
      expect(list).toEqual([])
    })

    it('一致性：搜到的作者 uuid 丟進 articleMockService 的 authorUuids，篩得到他的文章', async () => {
      const [first] = await run(searchAuthorsMock('Yuan'))
      expect(first).toBeDefined()
      const result = await run(getArticlesMock(1, 100, '全部', '', { authorUuids: [first.uuid] }))
      expect(result.total).toBe(first.publishedArticleCount)
      expect(result.records.length).toBeGreaterThan(0)
      for (const a of result.records) {
        expect(a.authorUuid).toBe(first.uuid)
        expect(a.authorNickname).toBe(first.nickname)
      }
    })
  })

  describe('getProfileMock', () => {
    it('存在的作者回完整公開資料，stats 取自文章 mock', async () => {
      const [yuan] = await run(searchAuthorsMock('Yuan'))
      const profile = await run(getProfileMock(yuan.uuid))
      expect(profile).not.toBeNull()
      expect(profile!.uuid).toBe(yuan.uuid)
      expect(profile!.nickname).toBe('Yuan')
      const mine = allMockArticles.filter(a => a.authorUuid === yuan.uuid)
      expect(profile!.stats).toEqual({
        publishedArticleCount: mine.length,
        totalViewCount: mine.reduce((s, a) => s + a.viewCount, 0),
        totalLikeCount: mine.reduce((s, a) => s + a.likeCount, 0),
      })
    })

    it('socialLinks 三個 key 恆存在，值為 handle 而非網址', async () => {
      const [yuan] = await run(searchAuthorsMock('Yuan'))
      const profile = await run(getProfileMock(yuan.uuid))
      expect(Object.keys(profile!.socialLinks)).toEqual(expect.arrayContaining(['github', 'twitter', 'linkedin']))
      for (const v of Object.values(profile!.socialLinks)) {
        if (v !== null) expect(v).not.toMatch(/[/:]/)
      }
    })

    it('沒有已發布文章的 ACTIVE 作者仍可開頁，統計為 0', async () => {
      const profile = await run(getProfileMock('mock-author-Newbie'))
      expect(profile).not.toBeNull()
      expect(profile!.stats).toEqual({ publishedArticleCount: 0, totalViewCount: 0, totalLikeCount: 0 })
    })

    it('不存在的 uuid → null（對應後端 404 A0101）', async () => {
      expect(await run(getProfileMock('00000000-0000-0000-0000-000000000000'))).toBeNull()
    })
  })
})
