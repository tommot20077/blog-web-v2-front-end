import { flushPromises } from '@vue/test-utils'
import { screen, fireEvent, waitFor } from '@testing-library/vue'
import { renderWithRouter } from '../test-utils'
import AdminDashboardView from './AdminDashboardView.vue'
import { adminService } from '../api/adminService'
import type { CategoryResponse, AdminTagResponse } from '../types/editor'
import type { SearchIndexStatus } from '../types/search'

vi.mock('../api/adminService')

const mockGetPendingCount = vi.mocked(adminService.getPendingCount)
const mockGetCategoriesFull = vi.mocked(adminService.getCategoriesFull)
const mockGetTagsFull = vi.mocked(adminService.getTagsFull)
const mockGetSearchStatus = vi.mocked(adminService.getSearchStatus)

function mkCategory(overrides: Partial<CategoryResponse> = {}): CategoryResponse {
  return { uuid: 'cat-1', name: '分類', slug: 'cat', description: null, sortOrder: 0, ...overrides }
}

function mkTag(overrides: Partial<AdminTagResponse> = {}): AdminTagResponse {
  return {
    id: 'tag-1',
    name: '標籤',
    slug: 'tag',
    color: null,
    icon: null,
    description: null,
    parentId: null,
    usageCount: 0,
    ...overrides,
  }
}

function mkSearchStatus(overrides: Partial<SearchIndexStatus> = {}): SearchIndexStatus {
  return { documentCount: 42, lastReindexAt: '2026-07-20T21:30:00', healthy: true, ...overrides }
}

describe('AdminDashboardView（Task A6：總覽儀表板實內容）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPendingCount.mockResolvedValue(3)
    mockGetCategoriesFull.mockResolvedValue([mkCategory()])
    mockGetTagsFull.mockResolvedValue([mkTag()])
    mockGetSearchStatus.mockResolvedValue(mkSearchStatus())
  })

  // ── 殼層 ─────────────────────────────────────────────────────────────────
  describe('殼層', () => {
    it('渲染 admin 殼層，且「總覽」項目為 active', async () => {
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-root')).toBeInTheDocument()
      expect(screen.getByTestId('admin-rail-link-admin-dashboard').className).toContain('active')
    })
  })

  // ── Loading ──────────────────────────────────────────────────────────────
  describe('Loading', () => {
    it('四格資料尚未 resolve 時，各自顯示 loading 指示器', () => {
      mockGetPendingCount.mockReturnValue(new Promise(() => {}))
      mockGetCategoriesFull.mockReturnValue(new Promise(() => {}))
      mockGetTagsFull.mockReturnValue(new Promise(() => {}))
      mockGetSearchStatus.mockReturnValue(new Promise(() => {}))

      renderWithRouter(AdminDashboardView)

      expect(screen.getByTestId('admin-dashboard-pending-loading')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-categories-loading')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-tags-loading')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-search-loading')).toBeInTheDocument()
    })
  })

  // ── 真實資料顯示 ─────────────────────────────────────────────────────────
  describe('真實資料顯示', () => {
    it('待審文章數格顯示 getPendingCount 回傳值', async () => {
      mockGetPendingCount.mockResolvedValue(7)
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-pending-value').textContent).toContain('7')
    })

    it('分類數格顯示 getCategoriesFull 長度', async () => {
      mockGetCategoriesFull.mockResolvedValue([mkCategory(), mkCategory(), mkCategory()])
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-categories-value').textContent).toContain('3')
    })

    it('標籤數格顯示 getTagsFull 長度', async () => {
      mockGetTagsFull.mockResolvedValue([mkTag(), mkTag()])
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-tags-value').textContent).toContain('2')
    })

    it('搜尋索引格 healthy 時顯示文件數與最後重建時間', async () => {
      mockGetSearchStatus.mockResolvedValue(mkSearchStatus({ documentCount: 42, lastReindexAt: '2026-07-20T21:30:00', healthy: true }))
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-search-value').textContent).toContain('42')
      expect(screen.getByTestId('admin-dashboard-search-last-reindex').textContent).toContain('2026-07-20 21:30')
    })
  })

  // ── 搜尋索引邊界狀態 ─────────────────────────────────────────────────────
  describe('搜尋索引邊界狀態', () => {
    it('healthy===false 時顯示「ES 離線」，且不顯示文件數', async () => {
      mockGetSearchStatus.mockResolvedValue(mkSearchStatus({ documentCount: null, lastReindexAt: null, healthy: false }))
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-search-offline').textContent).toContain('ES 離線')
      expect(screen.queryByTestId('admin-dashboard-search-value')).not.toBeInTheDocument()
    })

    it('lastReindexAt===null 且 healthy 時顯示「從未重建」', async () => {
      mockGetSearchStatus.mockResolvedValue(mkSearchStatus({ documentCount: 0, lastReindexAt: null, healthy: true }))
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-search-never').textContent).toContain('從未重建')
    })
  })

  // ── 單格失敗隔離 ─────────────────────────────────────────────────────────
  describe('單格失敗隔離', () => {
    it('getPendingCount reject 時該格顯示錯誤，其餘三格仍正常渲染', async () => {
      mockGetPendingCount.mockRejectedValue(new Error('network error'))
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-pending-error')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-categories-value')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-tags-value')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-search-value')).toBeInTheDocument()
    })

    it('getCategoriesFull reject 時分類格顯示錯誤，其餘三格仍正常渲染', async () => {
      mockGetCategoriesFull.mockRejectedValue(new Error('network error'))
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-categories-error')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-pending-value')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-tags-value')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-search-value')).toBeInTheDocument()
    })

    it('getTagsFull reject 時標籤格顯示錯誤，其餘三格仍正常渲染', async () => {
      mockGetTagsFull.mockRejectedValue(new Error('network error'))
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-tags-error')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-pending-value')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-categories-value')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-search-value')).toBeInTheDocument()
    })

    it('getSearchStatus reject 時搜尋格顯示錯誤，其餘三格仍正常渲染', async () => {
      mockGetSearchStatus.mockRejectedValue(new Error('network error'))
      renderWithRouter(AdminDashboardView)
      await flushPromises()
      expect(screen.getByTestId('admin-dashboard-search-error')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-pending-value')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-categories-value')).toBeInTheDocument()
      expect(screen.getByTestId('admin-dashboard-tags-value')).toBeInTheDocument()
    })
  })

  // ── 點擊導向 ─────────────────────────────────────────────────────────────
  describe('點擊導向', () => {
    it('點擊待審文章格導向 /admin/review', async () => {
      const { router } = renderWithRouter(AdminDashboardView)
      await flushPromises()
      await fireEvent.click(screen.getByTestId('admin-dashboard-card-pending'))
      await waitFor(() => expect(router.currentRoute.value.path).toBe('/admin/review'))
    })

    it('點擊分類格導向 /admin/categories', async () => {
      const { router } = renderWithRouter(AdminDashboardView)
      await flushPromises()
      await fireEvent.click(screen.getByTestId('admin-dashboard-card-categories'))
      await waitFor(() => expect(router.currentRoute.value.path).toBe('/admin/categories'))
    })

    it('點擊標籤格導向 /admin/tags', async () => {
      const { router } = renderWithRouter(AdminDashboardView)
      await flushPromises()
      await fireEvent.click(screen.getByTestId('admin-dashboard-card-tags'))
      await waitFor(() => expect(router.currentRoute.value.path).toBe('/admin/tags'))
    })

    it('點擊搜尋格導向 /admin/search', async () => {
      const { router } = renderWithRouter(AdminDashboardView)
      await flushPromises()
      await fireEvent.click(screen.getByTestId('admin-dashboard-card-search'))
      await waitFor(() => expect(router.currentRoute.value.path).toBe('/admin/search'))
    })
  })
})
