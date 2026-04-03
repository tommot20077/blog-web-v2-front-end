import { describe, it, expect, beforeEach } from 'vitest'
import {
  publishArticleMock,
  rejectArticleMock,
  getPendingCountMock,
} from './adminMockService'
import { resetEditorArticleStore } from './data'

beforeEach(() => {
  resetEditorArticleStore()
})

describe('getPendingCountMock', () => {
  it('回傳待審核文章數量（大於 0）', async () => {
    const count = await getPendingCountMock()
    expect(count).toBeGreaterThanOrEqual(2) // 種子資料有 2 篇 PENDING_REVIEW
  })

  it('發布後數量減少', async () => {
    const before = await getPendingCountMock()
    await publishArticleMock('editor-pending-1')
    const after = await getPendingCountMock()
    expect(after).toBe(before - 1)
  })
})

describe('publishArticleMock', () => {
  it('發布待審核文章，狀態變為 PUBLISHED', async () => {
    const result = await publishArticleMock('editor-pending-1')
    expect(result.status).toBe('PUBLISHED')
    expect(result.uuid).toBe('editor-pending-1')
  })

  it('發布不存在的文章拋出錯誤', async () => {
    await expect(publishArticleMock('no-such-uuid')).rejects.toThrow()
  })
})

describe('rejectArticleMock', () => {
  it('退回待審核文章，狀態變為 REJECTED 且 rejectReason 被設置', async () => {
    const reason = '文章需要更多內容補充，請加入至少三個實際案例。'
    const result = await rejectArticleMock('editor-pending-1', reason)
    expect(result.status).toBe('REJECTED')
    expect(result.rejectReason).toBe(reason)
  })

  it('退回不存在的文章拋出錯誤', async () => {
    await expect(
      rejectArticleMock('no-such-uuid', '原因')
    ).rejects.toThrow()
  })
})
