import { flushPromises } from '@vue/test-utils'
import { screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import AdminCategoriesView from './AdminCategoriesView.vue'
import { renderWithRouter } from '../test-utils'
import { adminService } from '../api/adminService'
import type { CategoryResponse } from '../types/editor'

vi.mock('../api/adminService')

const mockShowToast = vi.fn()
vi.mock('../composables/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockGetCategoriesFull = vi.mocked(adminService.getCategoriesFull)
const mockCreateCategory = vi.mocked(adminService.createCategory)
const mockUpdateCategory = vi.mocked(adminService.updateCategory)
const mockDeleteCategory = vi.mocked(adminService.deleteCategory)

function buildCategory(overrides: Partial<CategoryResponse> = {}): CategoryResponse {
  return {
    uuid: 'cat-uuid-1',
    name: '技術',
    slug: 'tech',
    description: '技術相關文章',
    sortOrder: 1,
    ...overrides,
  }
}

describe('AdminCategoriesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCategoriesFull.mockResolvedValue([buildCategory()])
    mockCreateCategory.mockResolvedValue(buildCategory({ uuid: 'cat-uuid-new' }))
    mockUpdateCategory.mockResolvedValue(buildCategory())
    mockDeleteCategory.mockResolvedValue(undefined)
  })

  // ── Admin 殼層 ─────────────────────────────────────────────────────────────
  describe('Admin 殼層', () => {
    it('渲染 admin 殼層，且「分類管理」項目為 active', async () => {
      renderWithRouter(AdminCategoriesView)
      await flushPromises()
      expect(screen.getByTestId('admin-categories-root')).toBeInTheDocument()
      expect(screen.getByTestId('admin-rail-link-admin-categories').className).toContain('active')
    })
  })

  // ── 初始載入 ───────────────────────────────────────────────────────────────
  describe('初始載入', () => {
    it('顯示 loading 指示器（getCategoriesFull 尚未 resolve 時）', () => {
      mockGetCategoriesFull.mockReturnValue(new Promise(() => {}))
      renderWithRouter(AdminCategoriesView)
      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    it('載入後表格顯示 name/slug/description/sortOrder', async () => {
      renderWithRouter(AdminCategoriesView)
      await flushPromises()
      const row = screen.getByTestId('admin-categories-row-cat-uuid-1')
      expect(row.textContent).toContain('技術')
      expect(row.textContent).toContain('tech')
      expect(row.textContent).toContain('技術相關文章')
      expect(row.textContent).toContain('1')
    })

    it('空狀態顯示「目前沒有分類」', async () => {
      mockGetCategoriesFull.mockResolvedValue([])
      renderWithRouter(AdminCategoriesView)
      await flushPromises()
      expect(screen.getByText(/目前沒有分類/)).toBeInTheDocument()
    })

    it('getCategoriesFull 失敗時顯示 toast error 並離開 loading 狀態', async () => {
      mockGetCategoriesFull.mockRejectedValue(new Error('network error'))
      renderWithRouter(AdminCategoriesView)
      await flushPromises()
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'error')
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    it('getCategoriesFull 失敗時顯示獨立的錯誤狀態與重試按鈕，且不顯示空狀態文案', async () => {
      mockGetCategoriesFull.mockRejectedValue(new Error('network error'))
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      expect(screen.getByTestId('admin-categories-error')).toBeInTheDocument()
      expect(screen.getByTestId('admin-categories-retry-btn')).toBeInTheDocument()
      expect(screen.queryByText('目前沒有分類')).not.toBeInTheDocument()
    })

    it('載入失敗後點擊重試按鈕會重新呼叫 getCategoriesFull，成功後離開錯誤狀態', async () => {
      mockGetCategoriesFull.mockRejectedValueOnce(new Error('network error'))
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()
      expect(screen.getByTestId('admin-categories-error')).toBeInTheDocument()

      mockGetCategoriesFull.mockResolvedValueOnce([buildCategory()])
      await user.click(screen.getByTestId('admin-categories-retry-btn'))
      await flushPromises()

      expect(mockGetCategoriesFull).toHaveBeenCalledTimes(2)
      expect(screen.queryByTestId('admin-categories-error')).not.toBeInTheDocument()
      expect(screen.getByTestId('admin-categories-row-cat-uuid-1')).toBeInTheDocument()
    })
  })

  // ── 新增分類 ───────────────────────────────────────────────────────────────
  describe('新增分類', () => {
    it('點「新增分類」開啟表單，四欄初始為空', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-add-btn'))

      expect((screen.getByTestId('admin-categories-form-name') as HTMLInputElement).value).toBe('')
      expect((screen.getByTestId('admin-categories-form-slug') as HTMLInputElement).value).toBe('')
      expect((screen.getByTestId('admin-categories-form-description') as HTMLInputElement).value).toBe('')
    })

    it('填寫並送出時呼叫 createCategory 且 payload 正確', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-add-btn'))
      await user.type(screen.getByTestId('admin-categories-form-name'), 'API 開發')
      await user.type(screen.getByTestId('admin-categories-form-slug'), 'api-dev')
      await user.type(screen.getByTestId('admin-categories-form-description'), '欄位測試')
      const sortOrderInput = screen.getByTestId('admin-categories-form-sortOrder') as HTMLInputElement
      await user.clear(sortOrderInput)
      await user.type(sortOrderInput, '3')

      await user.click(screen.getByTestId('admin-categories-form-submit'))

      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: 'API 開發',
        slug: 'api-dev',
        description: '欄位測試',
        sortOrder: 3,
      })
    })

    it('描述留空時送出 description 為 null', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-add-btn'))
      await user.type(screen.getByTestId('admin-categories-form-name'), '前端')
      await user.type(screen.getByTestId('admin-categories-form-slug'), 'frontend')

      await user.click(screen.getByTestId('admin-categories-form-submit'))

      expect(mockCreateCategory).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
      )
    })

    it('新增成功後關閉表單、重新拉列表、顯示 toast success', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-add-btn'))
      await user.type(screen.getByTestId('admin-categories-form-name'), '前端')
      await user.type(screen.getByTestId('admin-categories-form-slug'), 'frontend')
      await user.click(screen.getByTestId('admin-categories-form-submit'))
      await flushPromises()

      expect(screen.queryByTestId('admin-categories-form')).not.toBeInTheDocument()
      expect(mockGetCategoriesFull).toHaveBeenCalledTimes(2)
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success')
    })

    it('新增失敗時顯示 toast error 訊息', async () => {
      mockCreateCategory.mockRejectedValue(new Error('分類名稱重複'))
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-add-btn'))
      await user.type(screen.getByTestId('admin-categories-form-name'), '前端')
      await user.type(screen.getByTestId('admin-categories-form-slug'), 'frontend')
      await user.click(screen.getByTestId('admin-categories-form-submit'))
      await flushPromises()

      expect(mockShowToast).toHaveBeenCalledWith('分類名稱重複', 'error')
    })
  })

  // ── 編輯分類 ───────────────────────────────────────────────────────────────
  describe('編輯分類', () => {
    it('點「編輯」開啟表單並帶入既有值', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-edit-cat-uuid-1'))

      expect((screen.getByTestId('admin-categories-form-name') as HTMLInputElement).value).toBe('技術')
      expect((screen.getByTestId('admin-categories-form-slug') as HTMLInputElement).value).toBe('tech')
      expect((screen.getByTestId('admin-categories-form-description') as HTMLInputElement).value).toBe('技術相關文章')
      expect((screen.getByTestId('admin-categories-form-sortOrder') as HTMLInputElement).value).toBe('1')
    })

    it('送出時呼叫 updateCategory(uuid, payload) 且 payload 正確', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-edit-cat-uuid-1'))
      const nameInput = screen.getByTestId('admin-categories-form-name') as HTMLInputElement
      await user.clear(nameInput)
      await user.type(nameInput, '技術文章')
      await user.click(screen.getByTestId('admin-categories-form-submit'))

      expect(mockUpdateCategory).toHaveBeenCalledWith('cat-uuid-1', {
        name: '技術文章',
        slug: 'tech',
        description: '技術相關文章',
        sortOrder: 1,
      })
    })

    it('編輯成功後重新拉列表、顯示 toast success', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-edit-cat-uuid-1'))
      await user.click(screen.getByTestId('admin-categories-form-submit'))
      await flushPromises()

      expect(mockGetCategoriesFull).toHaveBeenCalledTimes(2)
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success')
    })

    it('編輯失敗時顯示 toast error 訊息', async () => {
      mockUpdateCategory.mockRejectedValue(new Error('slug 已被使用'))
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-edit-cat-uuid-1'))
      await user.click(screen.getByTestId('admin-categories-form-submit'))
      await flushPromises()

      expect(mockShowToast).toHaveBeenCalledWith('slug 已被使用', 'error')
    })
  })

  // ── 刪除分類 ───────────────────────────────────────────────────────────────
  describe('刪除分類', () => {
    it('點「刪除」顯示確認對話框', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-delete-cat-uuid-1'))

      expect(screen.getByTestId('admin-categories-delete-confirm')).toBeInTheDocument()
    })

    it('點「取消」不呼叫 API 且關閉對話框', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-delete-cat-uuid-1'))
      await user.click(screen.getByTestId('admin-categories-delete-cancel'))

      expect(mockDeleteCategory).not.toHaveBeenCalled()
      expect(screen.queryByTestId('admin-categories-delete-confirm')).not.toBeInTheDocument()
    })

    it('點「確認刪除」呼叫 deleteCategory(uuid)', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-delete-cat-uuid-1'))
      await user.click(screen.getByTestId('admin-categories-delete-confirm-btn'))

      expect(mockDeleteCategory).toHaveBeenCalledWith('cat-uuid-1')
    })

    it('刪除成功後重新拉列表、顯示 toast success', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-delete-cat-uuid-1'))
      await user.click(screen.getByTestId('admin-categories-delete-confirm-btn'))
      await flushPromises()

      expect(mockGetCategoriesFull).toHaveBeenCalledTimes(2)
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success')
    })

    it('刪除失敗（一般錯誤）時顯示 toast error，且不重新拉列表', async () => {
      mockDeleteCategory.mockRejectedValue(new Error('刪除失敗，請稍後再試'))
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-delete-cat-uuid-1'))
      await user.click(screen.getByTestId('admin-categories-delete-confirm-btn'))
      await flushPromises()

      expect(mockShowToast).toHaveBeenCalledWith('刪除失敗，請稍後再試', 'error')
      expect(mockGetCategoriesFull).toHaveBeenCalledTimes(1)
    })

    it('刪除失敗為 CATEGORY_HAS_ARTICLES 業務錯誤時，明確呈現「該分類下仍有文章，無法刪除」，不可靜默失敗', async () => {
      mockDeleteCategory.mockRejectedValue(new Error('該分類下仍有文章，無法刪除'))
      const user = userEvent.setup()
      renderWithRouter(AdminCategoriesView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-categories-delete-cat-uuid-1'))
      await user.click(screen.getByTestId('admin-categories-delete-confirm-btn'))
      await flushPromises()

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('該分類下仍有文章，無法刪除', 'error')
      })
      // 分類項目仍在列表中（未被靜默移除）
      expect(screen.getByTestId('admin-categories-row-cat-uuid-1')).toBeInTheDocument()
      // 不應重新拉列表（失敗不重載）
      expect(mockGetCategoriesFull).toHaveBeenCalledTimes(1)
    })
  })
})
