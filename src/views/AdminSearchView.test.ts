import { flushPromises } from '@vue/test-utils'
import { screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import AdminSearchView from './AdminSearchView.vue'
import { renderWithRouter } from '../test-utils'
import { adminService } from '../api/adminService'
import type { SearchIndexStatus } from '../types/search'

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

describe('AdminSearchView（Task A9：搜尋索引頁實內容）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSearchStatus.mockResolvedValue(buildStatus())
    mockReindexSearch.mockResolvedValue(undefined)
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

    it('reindexSearch 完成後重新拉取 getSearchStatus，顯示 toast success，解除執行中狀態', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminSearchView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-search-reindex-btn'))
      await user.click(screen.getByTestId('admin-search-confirm-confirm'))
      await flushPromises()

      expect(mockGetSearchStatus).toHaveBeenCalledTimes(2)
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success')
      expect(screen.getByTestId('admin-search-reindex-btn')).not.toBeDisabled()
    })

    it('reindexSearch 失敗時顯示 toast error(error.message)，解除執行中狀態，不重新拉取狀態', async () => {
      mockReindexSearch.mockRejectedValue(new Error('ES 連線逾時'))
      const user = userEvent.setup()
      renderWithRouter(AdminSearchView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-search-reindex-btn'))
      await user.click(screen.getByTestId('admin-search-confirm-confirm'))
      await flushPromises()

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('ES 連線逾時', 'error')
      })
      expect(screen.getByTestId('admin-search-reindex-btn')).not.toBeDisabled()
      expect(mockGetSearchStatus).toHaveBeenCalledTimes(1)
    })
  })
})
