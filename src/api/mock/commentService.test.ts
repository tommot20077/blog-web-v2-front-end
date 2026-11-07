import { describe, it, expect, beforeEach } from 'vitest'
import { commentService, resetCommentMockState } from './commentService'

const ARTICLE = 'article-1'

async function seedThread(replyCount: number) {
  const parent = await commentService.create(ARTICLE, { content: 'parent' })
  for (let i = 1; i <= replyCount; i++) {
    await commentService.create(ARTICLE, { content: `reply-${i}`, parentUuid: parent.uuid })
  }
  return parent
}

describe('mock commentService（D3 回覆分頁）', () => {
  beforeEach(() => resetCommentMockState())

  it('list 每則頂層只內嵌前 3 則回覆，replyCount 為未刪除回覆總數', async () => {
    await seedThread(5)
    const res = await commentService.list(ARTICLE, 1, 20, 'newest')
    const top = res.topLevels.records[0]
    expect(top.replies?.map(r => r.content)).toEqual(['reply-1', 'reply-2', 'reply-3'])
    expect(top.replyCount).toBe(5)
  })

  it('replyCount 不含已刪除的回覆', async () => {
    const parent = await seedThread(4)
    const all = await commentService.listReplies(parent.uuid, 1, 20)
    await commentService.delete(all.records[0].uuid)
    const res = await commentService.list(ARTICLE, 1, 20, 'newest')
    expect(res.topLevels.records[0].replyCount).toBe(3)
  })

  it('listReplies 依 created_at 升冪分頁（page 從 1 起），結構同 PageResult', async () => {
    const parent = await seedThread(5)
    const p1 = await commentService.listReplies(parent.uuid, 1, 2)
    const p3 = await commentService.listReplies(parent.uuid, 3, 2)
    expect(p1.records.map(r => r.content)).toEqual(['reply-1', 'reply-2'])
    expect(p1).toMatchObject({ total: 5, size: 2, current: 1, pages: 3 })
    expect(p3.records.map(r => r.content)).toEqual(['reply-5'])
  })

  it('listReplies：父留言不存在或傳入的是回覆 uuid → 空頁', async () => {
    const parent = await seedThread(1)
    const replies = await commentService.listReplies(parent.uuid, 1, 10)
    const asReply = await commentService.listReplies(replies.records[0].uuid, 1, 10)
    const missing = await commentService.listReplies('nope', 1, 10)
    expect(asReply.records).toEqual([])
    expect(asReply.total).toBe(0)
    expect(missing.records).toEqual([])
    expect(missing.total).toBe(0)
  })
})

describe('mock commentService（B5 留言數語意：不含墓碑）', () => {
  beforeEach(() => resetCommentMockState())

  it('刪除有回覆的頂層留言：totalCommentCount 減 1，墓碑與回覆仍在列表', async () => {
    const parent = await seedThread(2)
    const before = await commentService.list(ARTICLE, 1, 20, 'newest')
    expect(before.totalCommentCount).toBe(3)

    await commentService.delete(parent.uuid)

    const after = await commentService.list(ARTICLE, 1, 20, 'newest')
    expect(after.totalCommentCount).toBe(2)
    const top = after.topLevels.records[0]
    expect(top.deleted).toBe(true)
    expect(top.replies).toHaveLength(2)
    expect(after.topLevels.total).toBe(1)
  })

  it('刪除沒有回覆的頂層留言：墓碑仍顯示，計數為 0', async () => {
    const parent = await seedThread(0)
    await commentService.delete(parent.uuid)
    const res = await commentService.list(ARTICLE, 1, 20, 'newest')
    expect(res.totalCommentCount).toBe(0)
    expect(res.topLevels.records).toHaveLength(1)
    expect(res.topLevels.records[0].deleted).toBe(true)
  })

  it('刪除回覆：計數減 1', async () => {
    const parent = await seedThread(2)
    const replies = await commentService.listReplies(parent.uuid, 1, 10)
    await commentService.delete(replies.records[0].uuid)
    const res = await commentService.list(ARTICLE, 1, 20, 'newest')
    expect(res.totalCommentCount).toBe(2)
  })
})
