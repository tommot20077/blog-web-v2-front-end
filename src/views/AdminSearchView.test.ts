import { flushPromises } from '@vue/test-utils'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import AdminSearchView from './AdminSearchView.vue'
import { renderWithRouter } from '../test-utils'
import { adminService } from '../api/adminService'
import type { SearchIndexStatus, SearchReindexJob } from '../types/search'

vi.mock('../api/adminService')

const mockShowToast = vi.fn()
vi.mock('../composables/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockGetSearchStatus = vi.mocked(adminService.getSearchStatus)
const mockReindexSearch = vi.mocked(adminService.reindexSearch)

function buildStatus(overrides: Partial<SearchIndexStatus> = {}): SearchIndexStatus {
  return {
    documentCount: 13,
    lastReindexAt: '2026-07-20T21:30:00',
    healthy: true,
    ...overrides,
  }
}

function buildJob(overrides: Partial<SearchReindexJob> = {}): SearchReindexJob {
  return {
    jobId: 'job-1',
    state: 'RUNNING',
    processed: 0,
    total: null,
    startedAt: '2026-11-07T10:00:00',
    finishedAt: null,
    error: null,
    ...overrides,
  }
}

async function startReindex() {
  await fireEvent.click(screen.getByTestId('admin-search-reindex-btn'))
  await fireEvent.click(screen.getByTestId('admin-search-confirm-confirm'))
  await flushPromises()
}

/** 與元件的輪詢間隔／連續失敗上限一致（見 AdminSearchView.vue 的 POLL_INTERVAL_MS／MAX_CONSECUTIVE_POLL_FAILURES） */
const POLL_MS = 2000
const MAX_FAILURES = 3

describe('AdminSearchView（Task A9：搜尋索引頁實內容）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSearchStatus.mockResolvedValue(buildStatus())
    mockReindexSearch.mockResolvedValue(buildJob())
  })

  // ── Admin 殼層 ─────────────────────────────────────────────────────────────
  describe('Admin 殼層', () => {
    it('渲染 admin 殼層，且「搜尋索引」項目為 active', async () => {
      renderWithRouter(AdminSearchView)
      await flushPromises()
      expect(screen.getByTestId('admin-search-root')).toBeInTheDocument()
      expect(screen.getByTestId('admin-rail-link-admin-search').className).toContain('active')
    })
  })

  // ── 初始載入 ───────────────────────────────────────────────────────────────
  describe('初始載入', () => {
    it('顯示 loading 指示器（getSearchStatus 尚未 resolve 時）', () => {
      mockGetSearchStatus.mockReturnValue(new Promise(() => {}))
      renderWithRouter(AdminSearchView)
      expect(screen.getByTestId('admin-search-loading')).toBeInTheDocument()
    })

    it('getSearchStatus 失敗時顯示 toast error 並離開 loading 狀態', async () => {
      mockGetSearchStatus.mockRejectedValue(new Error('network error'))
      renderWithRouter(AdminSearchView)
      await flushPromises()
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'error')
      expect(screen.queryByTestId('admin-search-loading')).not.toBeInTheDocument()
    })
  })

  // ── 索引狀態顯示：正常 ─────────────────────────────────────────────────────
  describe('索引狀態顯示（正常）', () => {
    it('healthy 且有 lastReindexAt 時顯示文件數與最後重建時間', async () => {
      mockGetSearchStatus.mockResolvedValue(
        buildStatus({ documentCount: 13, lastReindexAt: '2026-07-20T21:30:00', healthy: true }),
      )
      renderWithRouter(AdminSearchView)
      await flushPromises()
      expect(screen.getByTestId('admin-search-document-count').textContent).toContain('13')
      expect(screen.getByTestId('admin-search-last-reindex').textContent).toContain('2026-07-20 21:30')
    })
  })

  // ── 索引狀態顯示：ES 離線 ──────────────────────────────────────────────────
  describe('索引狀態顯示（ES 離線）', () => {
    it('healthy===false 時顯示「ES 離線」，不顯示文件數', async () => {
      mockGetSearchStatus.mockResolvedValue(
        buildStatus({ documentCount: null, lastReindexAt: null, healthy: false }),
      )
      renderWithRouter(AdminSearchView)
      await flushPromises()
      expect(screen.getByTestId('admin-search-offline').textContent).toContain('ES 離線')
      expect(screen.queryByTestId('admin-search-document-count')).not.toBeInTheDocument()
    })
  })

  // ── 索引狀態顯示：從未重建 ─────────────────────────────────────────────────
  describe('索引狀態顯示（從未重建）', () => {
    it('lastReindexAt===null 且 healthy 時顯示「從未重建」', async () => {
      mockGetSearchStatus.mockResolvedValue(
        buildStatus({ documentCount: 0, lastReindexAt: null, healthy: true }),
      )
      renderWithRouter(AdminSearchView)
      await flushPromises()
      expect(screen.getByTestId('admin-search-never-reindexed').textContent).toContain('從未重建')
    })
  })

  // ── 重建索引流程 ──────────────────────────────────────────────────────────
  describe('重建索引流程', () => {
    it('點擊「重建索引」顯示確認對話框，尚未呼叫 reindexSearch', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminSearchView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-search-reindex-btn'))

      expect(screen.getByTestId('admin-search-confirm')).toBeInTheDocument()
      expect(mockReindexSearch).not.toHaveBeenCalled()
    })

    it('確認對話框點「取消」，不呼叫 API 且關閉對話框', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminSearchView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-search-reindex-btn'))
      await user.click(screen.getByTestId('admin-search-confirm-cancel'))

      expect(mockReindexSearch).not.toHaveBeenCalled()
      expect(screen.queryByTestId('admin-search-confirm')).not.toBeInTheDocument()
    })

    it('確認後進入執行中狀態：按鈕 disabled 且呼叫 reindexSearch', async () => {
      mockReindexSearch.mockReturnValue(new Promise(() => {}))
      const user = userEvent.setup()
      renderWithRouter(AdminSearchView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-search-reindex-btn'))
      await user.click(screen.getByTestId('admin-search-confirm-confirm'))
      await flushPromises()

      expect(screen.getByTestId('admin-search-reindex-btn')).toBeDisabled()
      expect(mockReindexSearch).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('admin-search-confirm')).not.toBeInTheDocument()
    })

    it('reindexSearch 失敗（非 409）時顯示 toast error(error.message)，解除執行中狀態，不輪詢、不重新拉取狀態', async () => {
      vi.useFakeTimers()
      try {
        mockReindexSearch.mockRejectedValue(new Error('ES 連線逾時'))
        renderWithRouter(AdminSearchView)
        await flushPromises()

        await startReindex()

        expect(mockShowToast).toHaveBeenCalledWith('ES 連線逾時', 'error')
        expect(screen.getByTestId('admin-search-reindex-btn')).not.toBeDisabled()
        await vi.advanceTimersByTimeAsync(POLL_MS * 3)
        expect(mockGetSearchStatus).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  // ── 背景重建＋輪詢（D1：後端 202 + status.reindex） ───────────────────────────
  describe('背景重建與輪詢', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    async function tick(ms = POLL_MS) {
      await vi.advanceTimersByTimeAsync(ms)
    }

    it('202 之後顯示「已開始重建」而不是「索引重建完成」，並在間隔後開始輪詢 status', async () => {
      renderWithRouter(AdminSearchView)
      await flushPromises()
      expect(mockGetSearchStatus).toHaveBeenCalledTimes(1)

      await startReindex()

      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('已開始'), expect.any(String))
      expect(mockShowToast).not.toHaveBeenCalledWith(expect.stringContaining('索引重建完成'), expect.anything())
      expect(mockGetSearchStatus).toHaveBeenCalledTimes(1)

      mockGetSearchStatus.mockResolvedValue(buildStatus({ reindex: buildJob({ processed: 10, total: 40 }) }))
      await tick()
      expect(mockGetSearchStatus).toHaveBeenCalledTimes(2)
    })

    it('RUNNING 時顯示 processed / total，輪詢期間停用重建按鈕', async () => {
      renderWithRouter(AdminSearchView)
      await flushPromises()
      await startReindex()

      mockGetSearchStatus.mockResolvedValue(buildStatus({ reindex: buildJob({ processed: 10, total: 40 }) }))
      await tick()

      expect(screen.getByTestId('admin-search-progress').textContent).toContain('10 / 40')
      expect(screen.getByTestId('admin-search-reindex-btn')).toBeDisabled()

      mockGetSearchStatus.mockResolvedValue(buildStatus({ reindex: buildJob({ processed: 25, total: 40 }) }))
      await tick()
      expect(screen.getByTestId('admin-search-progress').textContent).toContain('25 / 40')
    })

    it('total 為 null 時只顯示已處理篇數', async () => {
      renderWithRouter(AdminSearchView)
      await flushPromises()
      await startReindex()

      mockGetSearchStatus.mockResolvedValue(buildStatus({ reindex: buildJob({ processed: 7, total: null }) }))
      await tick()

      const text = screen.getByTestId('admin-search-progress').textContent ?? ''
      expect(text).toContain('7')
      expect(text).not.toContain('/')
    })

    it('COMPLETED：停止輪詢、顯示成功 toast、重新載入 status、解除按鈕', async () => {
      renderWithRouter(AdminSearchView)
      await flushPromises()
      await startReindex()

      const done = buildStatus({
        documentCount: 40,
        reindex: buildJob({ state: 'COMPLETED', processed: 40, total: 40, finishedAt: '2026-11-07T10:01:00' }),
      })
      mockGetSearchStatus.mockResolvedValue(done)
      await tick()

      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('索引重建完成'), 'success')
      expect(screen.getByTestId('admin-search-reindex-btn')).not.toBeDisabled()
      expect(screen.queryByTestId('admin-search-progress')).not.toBeInTheDocument()
      expect(screen.getByTestId('admin-search-document-count').textContent).toContain('40')

      const callsAfterDone = mockGetSearchStatus.mock.calls.length
      await tick(POLL_MS * 5)
      expect(mockGetSearchStatus).toHaveBeenCalledTimes(callsAfterDone)
      expect(vi.getTimerCount()).toBe(0)
    })

    it('FAILED：停止輪詢並以 error toast 顯示 error 摘要', async () => {
      renderWithRouter(AdminSearchView)
      await flushPromises()
      await startReindex()

      mockGetSearchStatus.mockResolvedValue(
        buildStatus({ reindex: buildJob({ state: 'FAILED', processed: 12, total: 40, error: 'bulk 寫入逾時' }) }),
      )
      await tick()

      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('bulk 寫入逾時'), 'error')
      expect(mockShowToast).not.toHaveBeenCalledWith(expect.stringContaining('索引重建完成'), expect.anything())
      expect(screen.getByTestId('admin-search-reindex-btn')).not.toBeDisabled()

      const calls = mockGetSearchStatus.mock.calls.length
      await tick(POLL_MS * 5)
      expect(mockGetSearchStatus).toHaveBeenCalledTimes(calls)
    })

    it('409（A0501）：提示「已有重建作業進行中」並開始輪詢，讓使用者看到既有作業進度', async () => {
      mockReindexSearch.mockRejectedValue(Object.assign(new Error('已有搜尋索引重建作業執行中'), { status: 409, code: 'A0501' }))
      mockGetSearchStatus.mockResolvedValue(buildStatus())
      renderWithRouter(AdminSearchView)
      await flushPromises()

      mockGetSearchStatus.mockResolvedValue(buildStatus({ reindex: buildJob({ processed: 3, total: 9 }) }))
      await startReindex()

      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('已有重建作業進行中'), expect.any(String))
      expect(mockShowToast).not.toHaveBeenCalledWith(expect.stringContaining('已開始'), expect.anything())
      // 409 時不必等一個間隔：馬上抓一次，讓進度立刻出現
      await tick(0)
      expect(mockGetSearchStatus.mock.calls.length).toBeGreaterThanOrEqual(2)
      expect(screen.getByTestId('admin-search-progress').textContent).toContain('3 / 9')
      expect(screen.getByTestId('admin-search-reindex-btn')).toBeDisabled()

      // 之後維持一般間隔輪詢
      const calls = mockGetSearchStatus.mock.calls.length
      await tick()
      expect(mockGetSearchStatus).toHaveBeenCalledTimes(calls + 1)
    })

    it('元件卸載時清掉 timer 並停止輪詢', async () => {
      const { unmount } = renderWithRouter(AdminSearchView)
      await flushPromises()
      await startReindex()
      expect(vi.getTimerCount()).toBeGreaterThan(0)

      unmount()

      expect(vi.getTimerCount()).toBe(0)
      const calls = mockGetSearchStatus.mock.calls.length
      await tick(POLL_MS * 5)
      expect(mockGetSearchStatus).toHaveBeenCalledTimes(calls)
    })

    it('卸載時若有輪詢請求還在飛行，其結果不再寫入、不再排下一輪', async () => {
      let resolvePoll: (s: SearchIndexStatus) => void = () => {}
      const { unmount } = renderWithRouter(AdminSearchView)
      await flushPromises()
      await startReindex()

      mockGetSearchStatus.mockReturnValue(new Promise<SearchIndexStatus>((r) => { resolvePoll = r }))
      await tick()
      unmount()
      resolvePoll(buildStatus({ reindex: buildJob({ processed: 1, total: 2 }) }))
      await flushPromises()

      expect(vi.getTimerCount()).toBe(0)
    })

    it('頁面載入時 status.reindex 為 RUNNING：不需點擊就自動接續輪詢並顯示進度、停用按鈕', async () => {
      mockGetSearchStatus.mockResolvedValue(buildStatus({ reindex: buildJob({ processed: 4, total: 20 }) }))
      renderWithRouter(AdminSearchView)
      await flushPromises()

      expect(mockReindexSearch).not.toHaveBeenCalled()
      expect(screen.getByTestId('admin-search-progress').textContent).toContain('4 / 20')
      expect(screen.getByTestId('admin-search-reindex-btn')).toBeDisabled()

      mockGetSearchStatus.mockResolvedValue(buildStatus({ reindex: buildJob({ processed: 8, total: 20 }) }))
      await tick()
      expect(mockGetSearchStatus).toHaveBeenCalledTimes(2)
      expect(screen.getByTestId('admin-search-progress').textContent).toContain('8 / 20')
    })

    it('頁面載入時 reindex 為 COMPLETED／FAILED／null：不輪詢、不跳 toast、按鈕可用', async () => {
      mockGetSearchStatus.mockResolvedValue(
        buildStatus({ reindex: buildJob({ state: 'COMPLETED', processed: 5, total: 5, finishedAt: '2026-11-07T10:01:00' }) }),
      )
      renderWithRouter(AdminSearchView)
      await flushPromises()
      await tick(POLL_MS * 3)

      expect(mockGetSearchStatus).toHaveBeenCalledTimes(1)
      expect(mockShowToast).not.toHaveBeenCalled()
      expect(screen.getByTestId('admin-search-reindex-btn')).not.toBeDisabled()
      expect(vi.getTimerCount()).toBe(0)
    })

    it('單次輪詢失敗不中斷：之後成功就繼續，失敗計數歸零', async () => {
      renderWithRouter(AdminSearchView)
      await flushPromises()
      await startReindex()

      // 失敗 MAX-1 次、成功一次、再失敗 MAX-1 次：總失敗 > MAX 但從未「連續」達上限
      for (let round = 0; round < 2; round += 1) {
        mockGetSearchStatus.mockRejectedValue(new Error('network'))
        for (let i = 0; i < MAX_FAILURES - 1; i += 1) await tick()
        mockGetSearchStatus.mockResolvedValue(buildStatus({ reindex: buildJob({ processed: 1, total: 5 }) }))
        await tick()
      }

      expect(mockShowToast).not.toHaveBeenCalledWith(expect.anything(), 'error')
      expect(screen.getByTestId('admin-search-reindex-btn')).toBeDisabled()
      expect(vi.getTimerCount()).toBeGreaterThan(0)
    })

    it('連續失敗達上限才停止輪詢、提示使用者並解除按鈕', async () => {
      renderWithRouter(AdminSearchView)
      await flushPromises()
      await startReindex()

      mockGetSearchStatus.mockRejectedValue(new Error('network'))
      for (let i = 0; i < MAX_FAILURES - 1; i += 1) await tick()
      expect(mockShowToast).not.toHaveBeenCalledWith(expect.anything(), 'error')

      await tick()

      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('無法取得重建進度'), 'error')
      expect(screen.getByTestId('admin-search-reindex-btn')).not.toBeDisabled()
      const calls = mockGetSearchStatus.mock.calls.length
      await tick(POLL_MS * 5)
      expect(mockGetSearchStatus).toHaveBeenCalledTimes(calls)
      expect(vi.getTimerCount()).toBe(0)
    })

    it('輪詢中 status.reindex 變 null（後端讀不到作業）視同一次失敗，連續達上限即停止', async () => {
      renderWithRouter(AdminSearchView)
      await flushPromises()
      await startReindex()

      mockGetSearchStatus.mockResolvedValue(buildStatus({ reindex: null }))
      for (let i = 0; i < MAX_FAILURES; i += 1) await tick()

      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('無法取得重建進度'), 'error')
      expect(vi.getTimerCount()).toBe(0)
    })
  })
})
