import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getPendingArticlesMock,
  publishArticleMock,
  rejectArticleMock,
  getPendingCountMock,
  getCategoriesFullMock,
  getTagsFullMock,
  getSearchStatusMock,
  reindexSearchMock,
  resetAdminSearchMockState,
  setMockReindexOutcome,
  MOCK_REINDEX_DURATION_MS,
  MOCK_REINDEX_FAIL_AT_MS,
  MOCK_REINDEX_TOTAL,
} from './adminMockService'
import { resetEditorArticleStore } from './data'
import { mockApiFailure, resetMockApiFailures } from './mockApiFailureState'

beforeEach(() => {
  resetEditorArticleStore()
  resetMockApiFailures()
  resetAdminSearchMockState()
})

describe('mockApiFailure 的生效時機', () => {
  it('註冊失敗後才發出的請求會失敗', async () => {
    mockApiFailure('**/api/v1/admin/articles/pending*', { message: '載入失敗' }, 500)

    await expect(getPendingArticlesMock(1, 10)).rejects.toThrow('載入失敗')
  })

  it('請求已經在飛行中才註冊失敗時，該次請求仍然成功', async () => {
    // e2e 的 mockApiFailure 是在「上一次載入還沒回來」時註冊的；若失敗狀態是在
    // Promise resolve 當下才判定，飛行中的請求會被追溯成失敗，畫面因此多出一個
    // 錯誤 toast（e2e 會撞上 strict mode violation）。失敗狀態必須在呼叫當下決定。
    const inFlight = getPendingArticlesMock(1, 10)
    mockApiFailure('**/api/v1/admin/articles/pending*', { message: '載入失敗' }, 500)

    const result = await inFlight
    expect(result.records.length).toBeGreaterThan(0)
  })
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

describe('reindexSearchMock / getSearchStatusMock：背景重建作業（D1）', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-07T10:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('尚未重建過：status.reindex 為 null', async () => {
    expect((await getSearchStatusMock()).reindex).toBeNull()
  })

  it('reindexSearchMock 回傳 RUNNING 作業（processed=0、finishedAt/error=null）', async () => {
    const job = await reindexSearchMock()
    expect(job).toMatchObject({ state: 'RUNNING', processed: 0, finishedAt: null, error: null })
    expect(typeof job.jobId).toBe('string')
    expect(job.startedAt).toBe('2026-11-07T10:00:00.000Z')
  })

  it('status.reindex 依時間推進 processed，且不超過 total', async () => {
    await reindexSearchMock()
    vi.advanceTimersByTime(MOCK_REINDEX_DURATION_MS / 2)
    const mid = (await getSearchStatusMock()).reindex!
    expect(mid.state).toBe('RUNNING')
    expect(mid.total).toBe(MOCK_REINDEX_TOTAL)
    expect(mid.processed).toBeGreaterThan(0)
    expect(mid.processed).toBeLessThan(MOCK_REINDEX_TOTAL)
  })

  it('經過 duration 後變成 COMPLETED：processed=total、有 finishedAt，lastReindexAt 更新', async () => {
    await reindexSearchMock()
    vi.advanceTimersByTime(MOCK_REINDEX_DURATION_MS)
    const status = await getSearchStatusMock()
    expect(status.reindex).toMatchObject({
      state: 'COMPLETED',
      processed: MOCK_REINDEX_TOTAL,
      total: MOCK_REINDEX_TOTAL,
      error: null,
    })
    expect(status.reindex!.finishedAt).not.toBeNull()
    expect(status.lastReindexAt).toBe(status.reindex!.finishedAt)
  })

  it('已有作業 RUNNING 時再觸發：拒絕 409／A0501（與後端一致）', async () => {
    await reindexSearchMock()
    await expect(reindexSearchMock()).rejects.toMatchObject({
      response: { status: 409, data: { code: 'A0501' } },
    })
  })

  it('作業結束後可再觸發新作業（新 jobId）', async () => {
    const first = await reindexSearchMock()
    vi.advanceTimersByTime(MOCK_REINDEX_DURATION_MS)
    const second = await reindexSearchMock()
    expect(second.jobId).not.toBe(first.jobId)
    expect(second.state).toBe('RUNNING')
  })

  it('setMockReindexOutcome(FAILED)：進行到 failAt 後變 FAILED 並帶 error 摘要，不更新 lastReindexAt', async () => {
    const before = (await getSearchStatusMock()).lastReindexAt
    setMockReindexOutcome('FAILED')
    await reindexSearchMock()
    vi.advanceTimersByTime(MOCK_REINDEX_FAIL_AT_MS)
    const status = await getSearchStatusMock()
    expect(status.reindex!.state).toBe('FAILED')
    expect(status.reindex!.error).toBeTruthy()
    expect(status.reindex!.finishedAt).not.toBeNull()
    expect(status.lastReindexAt).toBe(before)
  })

  it('mockApiFailure 註冊 POST reindex 的失敗（例如 409）時，reindexSearchMock 拒絕且不建立作業', async () => {
    mockApiFailure('/api/v1/admin/search/reindex', { code: 'A0501', message: '已有搜尋索引重建作業執行中' }, 409)
    await expect(reindexSearchMock()).rejects.toMatchObject({ response: { status: 409, data: { code: 'A0501' } } })
    resetMockApiFailures()
    expect((await getSearchStatusMock()).reindex).toBeNull()
  })

  it('resetAdminSearchMockState 清掉作業與 outcome', async () => {
    setMockReindexOutcome('FAILED')
    await reindexSearchMock()
    resetAdminSearchMockState()
    expect((await getSearchStatusMock()).reindex).toBeNull()
  })
})
