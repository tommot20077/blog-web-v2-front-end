import { flushPromises } from '@vue/test-utils'
import { screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import AdminTagsView from './AdminTagsView.vue'
import { renderWithRouter } from '../test-utils'
import { adminService } from '../api/adminService'
import type { AdminTagResponse } from '../types/editor'

/**
 * AdminTagsView — Boundary Analysis 場景表（Task A8）
 *
 * | # | 場景                                                            | 分類     |
 * |---|-----------------------------------------------------------------|----------|
 * | 1 | Admin 殼層渲染，「標籤管理」為 active                            | 殼層     |
 * | 2 | loading 指示器（getTagsFull 未 resolve）                         | 初始載入 |
 * | 3 | 載入後表格顯示六欄：name/slug/usageCount/color/icon/description  | 初始載入 |
 * | 4 | 空狀態顯示「目前沒有標籤」                                       | 初始載入 |
 * | 5 | getTagsFull 失敗 → toast error 且離開 loading                    | 初始載入 |
 * | 6 | 點「編輯」開啟表單，name/slug 唯讀呈現（無 input）且值正確        | 編輯     |
 * | 7 | 編輯表單帶入既有 color/icon/description                         | 編輯     |
 * | 8 | 送出時呼叫 updateTag(id, payload)，payload 只含三欄（無 name/slug）| 編輯     |
 * | 9 | 編輯成功後關表單、重新拉列表、toast success                       | 編輯     |
 * |10 | 編輯失敗顯示 toast error 訊息                                    | 編輯     |
 * |11 | usageCount > 0 時刪除按鈕 disabled                               | 刪除防護 |
 * |12 | usageCount = 0 時刪除按鈕可點擊                                  | 刪除防護 |
 * |13 | 點「刪除」（usageCount=0）顯示確認對話框                          | 刪除     |
 * |14 | 點「取消」不呼叫 API 且關閉對話框                                 | 刪除     |
 * |15 | 點「確認刪除」呼叫 deleteTag(id)                                 | 刪除     |
 * |16 | 刪除成功後重新拉列表、toast success                               | 刪除     |
 * |17 | 刪除失敗（一般錯誤）toast error，不重新拉列表                      | 刪除     |
 * |18 | 刪除失敗為 TAG_IN_USE 業務錯誤，明確呈現訊息、不靜默失敗、項目仍在  | 刪除兜底 |
 */

vi.mock('../api/adminService')

const mockShowToast = vi.fn()
vi.mock('../composables/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockGetTagsFull = vi.mocked(adminService.getTagsFull)
const mockUpdateTag = vi.mocked(adminService.updateTag)
const mockDeleteTag = vi.mocked(adminService.deleteTag)

function buildTag(overrides: Partial<AdminTagResponse> = {}): AdminTagResponse {
  return {
    id: 'tag-uuid-1',
    name: '技術',
    slug: 'tech',
    color: '#FF8D28',
    icon: '🏷️',
    description: '技術相關文章的標籤',
    usageCount: 5,
    ...overrides,
  }
}

describe('AdminTagsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTagsFull.mockResolvedValue([buildTag()])
    mockUpdateTag.mockResolvedValue(buildTag())
    mockDeleteTag.mockResolvedValue(undefined)
  })

  // ── Admin 殼層 ─────────────────────────────────────────────────────────────
  describe('Admin 殼層', () => {
    it('渲染 admin 殼層，且「標籤管理」項目為 active', async () => {
      renderWithRouter(AdminTagsView)
      await flushPromises()
      expect(screen.getByTestId('admin-tags-root')).toBeInTheDocument()
      expect(screen.getByTestId('admin-rail-link-admin-tags').className).toContain('active')
    })
  })

  // ── 初始載入 ───────────────────────────────────────────────────────────────
  describe('初始載入', () => {
    it('顯示 loading 指示器（getTagsFull 尚未 resolve 時）', () => {
      mockGetTagsFull.mockReturnValue(new Promise(() => {}))
      renderWithRouter(AdminTagsView)
      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    it('載入後表格顯示 name/slug/usageCount/color/icon/description', async () => {
      renderWithRouter(AdminTagsView)
      await flushPromises()
      const row = screen.getByTestId('admin-tags-row-tag-uuid-1')
      expect(row.textContent).toContain('技術')
      expect(row.textContent).toContain('tech')
      expect(row.textContent).toContain('5')
      expect(row.textContent).toContain('#FF8D28')
      expect(row.textContent).toContain('🏷️')
      expect(row.textContent).toContain('技術相關文章的標籤')
    })

    it('空狀態顯示「目前沒有標籤」', async () => {
      mockGetTagsFull.mockResolvedValue([])
      renderWithRouter(AdminTagsView)
      await flushPromises()
      expect(screen.getByText(/目前沒有標籤/)).toBeInTheDocument()
    })

    it('getTagsFull 失敗時顯示 toast error 並離開 loading 狀態', async () => {
      mockGetTagsFull.mockRejectedValue(new Error('network error'))
      renderWithRouter(AdminTagsView)
      await flushPromises()
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'error')
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
  })

  // ── 編輯標籤 ───────────────────────────────────────────────────────────────
  describe('編輯標籤', () => {
    it('點「編輯」開啟表單，name/slug 唯讀呈現（無輸入框）且值正確', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-edit-tag-uuid-1'))

      const nameField = screen.getByTestId('admin-tags-form-name')
      const slugField = screen.getByTestId('admin-tags-form-slug')
      expect(nameField.tagName.toLowerCase()).not.toBe('input')
      expect(slugField.tagName.toLowerCase()).not.toBe('input')
      expect(nameField.textContent).toContain('技術')
      expect(slugField.textContent).toContain('tech')
    })

    it('編輯表單帶入既有 color/icon/description', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-edit-tag-uuid-1'))

      expect((screen.getByTestId('admin-tags-form-color') as HTMLInputElement).value).toBe('#FF8D28')
      expect((screen.getByTestId('admin-tags-form-icon') as HTMLInputElement).value).toBe('🏷️')
      expect((screen.getByTestId('admin-tags-form-description') as HTMLInputElement).value).toBe(
        '技術相關文章的標籤',
      )
    })

    it('送出時呼叫 updateTag(id, payload)，payload 只含 color/icon/description（無 name/slug）', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-edit-tag-uuid-1'))
      const colorInput = screen.getByTestId('admin-tags-form-color') as HTMLInputElement
      await user.clear(colorInput)
      await user.type(colorInput, '#123456')
      const iconInput = screen.getByTestId('admin-tags-form-icon') as HTMLInputElement
      await user.clear(iconInput)
      await user.type(iconInput, '⭐')
      const descInput = screen.getByTestId('admin-tags-form-description') as HTMLInputElement
      await user.clear(descInput)
      await user.type(descInput, '新描述')

      await user.click(screen.getByTestId('admin-tags-form-submit'))

      expect(mockUpdateTag).toHaveBeenCalledWith('tag-uuid-1', {
        color: '#123456',
        icon: '⭐',
        description: '新描述',
      })
      const payload = mockUpdateTag.mock.calls[0]?.[1]
      expect(payload).not.toHaveProperty('name')
      expect(payload).not.toHaveProperty('slug')
    })

    it('編輯成功後關閉表單、重新拉列表、顯示 toast success', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-edit-tag-uuid-1'))
      await user.click(screen.getByTestId('admin-tags-form-submit'))
      await flushPromises()

      expect(screen.queryByTestId('admin-tags-form')).not.toBeInTheDocument()
      expect(mockGetTagsFull).toHaveBeenCalledTimes(2)
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success')
    })

    it('編輯失敗時顯示 toast error 訊息', async () => {
      mockUpdateTag.mockRejectedValue(new Error('顏色格式不正確'))
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-edit-tag-uuid-1'))
      await user.click(screen.getByTestId('admin-tags-form-submit'))
      await flushPromises()

      expect(mockShowToast).toHaveBeenCalledWith('顏色格式不正確', 'error')
    })
  })

  // ── 刪除標籤 ───────────────────────────────────────────────────────────────
  describe('刪除標籤', () => {
    it('usageCount > 0 時刪除按鈕 disabled', async () => {
      renderWithRouter(AdminTagsView)
      await flushPromises()
      const btn = screen.getByTestId('admin-tags-delete-tag-uuid-1') as HTMLButtonElement
      expect(btn.disabled).toBe(true)
    })

    it('usageCount = 0 時刪除按鈕可點擊（非 disabled）', async () => {
      mockGetTagsFull.mockResolvedValue([buildTag({ id: 'tag-uuid-2', usageCount: 0 })])
      renderWithRouter(AdminTagsView)
      await flushPromises()
      const btn = screen.getByTestId('admin-tags-delete-tag-uuid-2') as HTMLButtonElement
      expect(btn.disabled).toBe(false)
    })

    it('usageCount = 0 時點「刪除」顯示確認對話框', async () => {
      mockGetTagsFull.mockResolvedValue([buildTag({ id: 'tag-uuid-2', usageCount: 0 })])
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-delete-tag-uuid-2'))

      expect(screen.getByTestId('admin-tags-delete-confirm')).toBeInTheDocument()
    })

    it('點「取消」不呼叫 API 且關閉對話框', async () => {
      mockGetTagsFull.mockResolvedValue([buildTag({ id: 'tag-uuid-2', usageCount: 0 })])
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-delete-tag-uuid-2'))
      await user.click(screen.getByTestId('admin-tags-delete-cancel'))

      expect(mockDeleteTag).not.toHaveBeenCalled()
      expect(screen.queryByTestId('admin-tags-delete-confirm')).not.toBeInTheDocument()
    })

    it('點「確認刪除」呼叫 deleteTag(id)', async () => {
      mockGetTagsFull.mockResolvedValue([buildTag({ id: 'tag-uuid-2', usageCount: 0 })])
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-delete-tag-uuid-2'))
      await user.click(screen.getByTestId('admin-tags-delete-confirm-btn'))

      expect(mockDeleteTag).toHaveBeenCalledWith('tag-uuid-2')
    })

    it('刪除成功後重新拉列表、顯示 toast success', async () => {
      mockGetTagsFull.mockResolvedValue([buildTag({ id: 'tag-uuid-2', usageCount: 0 })])
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-delete-tag-uuid-2'))
      await user.click(screen.getByTestId('admin-tags-delete-confirm-btn'))
      await flushPromises()

      expect(mockGetTagsFull).toHaveBeenCalledTimes(2)
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success')
    })

    it('刪除失敗（一般錯誤）時顯示 toast error，且不重新拉列表', async () => {
      mockGetTagsFull.mockResolvedValue([buildTag({ id: 'tag-uuid-2', usageCount: 0 })])
      mockDeleteTag.mockRejectedValue(new Error('刪除失敗，請稍後再試'))
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-delete-tag-uuid-2'))
      await user.click(screen.getByTestId('admin-tags-delete-confirm-btn'))
      await flushPromises()

      expect(mockShowToast).toHaveBeenCalledWith('刪除失敗，請稍後再試', 'error')
      expect(mockGetTagsFull).toHaveBeenCalledTimes(1)
    })

    it('刪除失敗為 TAG_IN_USE 業務錯誤時，明確呈現「此標籤仍有文章使用中，無法刪除」，不可靜默失敗', async () => {
      // 清單數字可能過期：usageCount=0 但後端仍拒絕（第二層兜底）
      mockGetTagsFull.mockResolvedValue([buildTag({ id: 'tag-uuid-2', usageCount: 0 })])
      mockDeleteTag.mockRejectedValue(new Error('此標籤仍有文章使用中，無法刪除'))
      const user = userEvent.setup()
      renderWithRouter(AdminTagsView)
      await flushPromises()

      await user.click(screen.getByTestId('admin-tags-delete-tag-uuid-2'))
      await user.click(screen.getByTestId('admin-tags-delete-confirm-btn'))
      await flushPromises()

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('此標籤仍有文章使用中，無法刪除', 'error')
      })
      // 標籤項目仍在列表中（未被靜默移除）
      expect(screen.getByTestId('admin-tags-row-tag-uuid-2')).toBeInTheDocument()
      // 不應重新拉列表（失敗不重載）
      expect(mockGetTagsFull).toHaveBeenCalledTimes(1)
    })
  })
})
