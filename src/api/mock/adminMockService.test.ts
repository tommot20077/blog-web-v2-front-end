import { describe, it, expect, beforeEach } from 'vitest'
import {
  publishArticleMock,
  rejectArticleMock,
  getPendingCountMock,
  getCategoriesFullMock,
  getTagsFullMock,
  getSearchStatusMock,
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

describe('getCategoriesFullMock', () => {
  it('回傳至少 2 筆分類，含 description 與 sortOrder', async () => {
    const result = await getCategoriesFullMock()
    expect(result.length).toBeGreaterThanOrEqual(2)
    result.forEach(category => {
      expect(category).toHaveProperty('uuid')
      expect(category).toHaveProperty('name')
      expect(category).toHaveProperty('slug')
      expect(category).toHaveProperty('sortOrder')
      expect(category).toHaveProperty('description')
    })
  })

  it('至少一筆 description 為 null，覆蓋 null 情境', async () => {
    const result = await getCategoriesFullMock()
    expect(result.some(category => category.description === null)).toBe(true)
  })
})

describe('getTagsFullMock', () => {
  it('回傳至少 2 筆標籤，含 color/icon/description/usageCount', async () => {
    const result = await getTagsFullMock()
    expect(result.length).toBeGreaterThanOrEqual(2)
    result.forEach(tag => {
      expect(tag).toHaveProperty('id')
      expect(tag).toHaveProperty('name')
      expect(tag).toHaveProperty('slug')
      expect(tag).toHaveProperty('color')
      expect(tag).toHaveProperty('icon')
      expect(tag).toHaveProperty('description')
      expect(tag).toHaveProperty('usageCount')
    })
  })

  it('至少一筆 usageCount > 0、一筆 usageCount = 0，供刪除防呆情境測試', async () => {
    const result = await getTagsFullMock()
    expect(result.some(tag => tag.usageCount > 0)).toBe(true)
    expect(result.some(tag => tag.usageCount === 0)).toBe(true)
  })
})

describe('getSearchStatusMock', () => {
  it('回傳 healthy=true、documentCount 為正整數、lastReindexAt 為 ISO 字串', async () => {
    const result = await getSearchStatusMock()
    expect(result.healthy).toBe(true)
    expect(typeof result.documentCount).toBe('number')
    expect(result.documentCount).toBeGreaterThan(0)
    expect(Number.isInteger(result.documentCount)).toBe(true)
    expect(typeof result.lastReindexAt).toBe('string')
    expect(() => new Date(result.lastReindexAt as string).toISOString()).not.toThrow()
  })
})
