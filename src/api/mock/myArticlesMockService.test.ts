import { describe, it, expect, beforeEach } from 'vitest'
import {
  getMyArticlesMock,
  deleteMyArticleMock,
  submitForReviewMock,
} from './myArticlesMockService'
import { resetEditorArticleStore } from './data'

beforeEach(() => {
  resetEditorArticleStore()
})

describe('getMyArticlesMock', () => {
  it('不帶 status 時回傳所有文章', async () => {
    const result = await getMyArticlesMock('ALL', 1, 20)
    expect(result.total).toBeGreaterThan(0)
    expect(result.records.length).toBeGreaterThan(0)
  })

  it('篩選 DRAFT 只回傳草稿文章', async () => {
    const result = await getMyArticlesMock('DRAFT', 1, 20)
    result.records.forEach(a => expect(a.status).toBe('DRAFT'))
  })

  it('篩選 PENDING_REVIEW 只回傳待審文章', async () => {
    const result = await getMyArticlesMock('PENDING_REVIEW', 1, 20)
    result.records.forEach(a => expect(a.status).toBe('PENDING_REVIEW'))
    expect(result.total).toBeGreaterThanOrEqual(2) // 種子資料有 2 篇
  })

  it('篩選 REJECTED 的文章含有 rejectReason', async () => {
    const result = await getMyArticlesMock('REJECTED', 1, 20)
    expect(result.records.length).toBeGreaterThan(0)
    result.records.forEach(a => expect(a.rejectReason).not.toBeNull())
  })

  it('分頁計算正確', async () => {
    const result = await getMyArticlesMock('ALL', 1, 2)
    expect(result.size).toBe(2)
    expect(result.records.length).toBeLessThanOrEqual(2)
    expect(result.pages).toBe(Math.ceil(result.total / 2))
  })
})

describe('deleteMyArticleMock', () => {
  it('刪除存在的文章後，查詢時不再出現', async () => {
    await deleteMyArticleMock('editor-draft-1')
    const result = await getMyArticlesMock('DRAFT', 1, 20)
    const uuids = result.records.map(a => a.uuid)
    expect(uuids).not.toContain('editor-draft-1')
  })

  it('刪除不存在的文章拋出錯誤', async () => {
    await expect(deleteMyArticleMock('no-such-uuid')).rejects.toThrow()
  })
})

describe('submitForReviewMock', () => {
  it('提交草稿後狀態變為 PENDING_REVIEW', async () => {
    await submitForReviewMock('editor-draft-1')
    const result = await getMyArticlesMock('PENDING_REVIEW', 1, 20)
    const uuids = result.records.map(a => a.uuid)
    expect(uuids).toContain('editor-draft-1')
  })

  it('提交不存在的文章拋出錯誤', async () => {
    await expect(submitForReviewMock('no-such-uuid')).rejects.toThrow()
  })
})
