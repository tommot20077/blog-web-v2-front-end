import { flushPromises } from '@vue/test-utils'
import { screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import AdminReviewView from './AdminReviewView.vue'
import { renderWithRouter, createMockMyArticle, createMockPageResult } from '../test-utils'
import { adminService } from '../api/adminService'

vi.mock('../api/adminService')

const mockShowToast = vi.fn()
vi.mock('../composables/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockGetPendingArticles = vi.mocked(adminService.getPendingArticles)
const mockPublishArticle = vi.mocked(adminService.publishArticle)
const mockRejectArticle = vi.mocked(adminService.rejectArticle)

function buildPending(overrides = {}) {
  return createMockMyArticle({
    status: 'PENDING_REVIEW',
    title: '待審文章',
    uuid: 'pending-uuid-1',
    ...overrides,
  })
}

function buildPageResult(articles = [buildPending()]) {
  return createMockPageResult(articles, { total: articles.length, pages: 1 })
}

describe('AdminReviewView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPendingArticles.mockResolvedValue(buildPageResult())
  })

  // ── 初始載入 ───────────────────────────────────────────────────────────────
  describe('初始載入', () => {
    it('顯示 loading 指示器（getPendingArticles 尚未 resolve 時）', () => {
      mockGetPendingArticles.mockReturnValue(new Promise(() => {}))
      renderWithRouter(AdminReviewView)
      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    it('載入後顯示「共 N 篇待審核」', async () => {
      mockGetPendingArticles.mockResolvedValue(buildPageResult([buildPending(), buildPending({ uuid: 'p2' })]))
      renderWithRouter(AdminReviewView)
      await flushPromises()
      expect(screen.getByText(/共\s*2\s*篇/)).toBeInTheDocument()
    })

    it('空狀態顯示「目前沒有待審核文章」', async () => {
      mockGetPendingArticles.mockResolvedValue(createMockPageResult([], { total: 0, pages: 1 }))
      renderWithRouter(AdminReviewView)
      await flushPromises()
      expect(screen.getByText(/目前沒有待審核文章/)).toBeInTheDocument()
    })

    it('初始以 page=1, size=10 呼叫 getPendingArticles', async () => {
      renderWithRouter(AdminReviewView)
      await flushPromises()
      expect(mockGetPendingArticles).toHaveBeenCalledWith(1, 10)
    })

    it('getPendingArticles 失敗時顯示 toast error 並離開 loading 狀態', async () => {
      mockGetPendingArticles.mockRejectedValue(new Error('network error'))
      renderWithRouter(AdminReviewView)
      await flushPromises()
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'error')
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
  })

  // ── 文章列表 ───────────────────────────────────────────────────────────────
  describe('文章列表', () => {
    it('顯示文章標題', async () => {
      renderWithRouter(AdminReviewView)
      await flushPromises()
      expect(screen.getByText('待審文章')).toBeInTheDocument()
    })

    it('每篇有「通過」「退回」按鈕', async () => {
      renderWithRouter(AdminReviewView)
      await flushPromises()
      expect(screen.getByText('通過')).toBeInTheDocument()
      expect(screen.getByText('退回')).toBeInTheDocument()
    })
  })

  // ── 通過操作 ───────────────────────────────────────────────────────────────
  describe('通過操作', () => {
    it('點「通過」呼叫 publishArticle(uuid)', async () => {
      mockPublishArticle.mockResolvedValue({ uuid: 'pending-uuid-1', status: 'PUBLISHED' } as any)
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()
      await user.click(screen.getByText('通過'))
      expect(mockPublishArticle).toHaveBeenCalledWith('pending-uuid-1')
    })

    it('成功後從列表移除該文章（不重載 API）', async () => {
      mockPublishArticle.mockResolvedValue({ uuid: 'pending-uuid-1', status: 'PUBLISHED' } as any)
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()

      expect(screen.getByText('待審文章')).toBeInTheDocument()
      await user.click(screen.getByText('通過'))
      await flushPromises()

      expect(screen.queryByText('待審文章')).not.toBeInTheDocument()
      // API 只呼叫一次（不重載）
      expect(mockGetPendingArticles).toHaveBeenCalledTimes(1)
    })

    it('成功後顯示 toast success', async () => {
      mockPublishArticle.mockResolvedValue({ uuid: 'pending-uuid-1', status: 'PUBLISHED' } as any)
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()
      await user.click(screen.getByText('通過'))
      await flushPromises()
      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('通過'), 'success')
    })

    it('失敗後顯示 toast error', async () => {
      mockPublishArticle.mockRejectedValue(new Error('fail'))
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()
      await user.click(screen.getByText('通過'))
      await flushPromises()
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'error')
    })
  })

  // ── 退回操作 ───────────────────────────────────────────────────────────────
  describe('退回操作', () => {
    it('預設不顯示退回輸入框', async () => {
      renderWithRouter(AdminReviewView)
      await flushPromises()
      expect(screen.queryByPlaceholderText(/退回理由/)).not.toBeInTheDocument()
    })

    it('點「退回」顯示 textarea + 確認 + 取消', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()
      await user.click(screen.getByText('退回'))
      expect(screen.getByPlaceholderText(/退回理由/)).toBeInTheDocument()
      expect(screen.getByText('確認退回')).toBeInTheDocument()
      expect(screen.getByText('取消')).toBeInTheDocument()
    })

    it('輸入框初始為空', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()
      await user.click(screen.getByText('退回'))
      const textarea = screen.getByPlaceholderText(/退回理由/) as HTMLTextAreaElement
      expect(textarea.value).toBe('')
    })

    it('理由為空時「確認退回」disabled', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()
      await user.click(screen.getByText('退回'))
      expect(screen.getByText('確認退回')).toBeDisabled()
    })

    it('點「取消」收起輸入框', async () => {
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()
      await user.click(screen.getByText('退回'))
      expect(screen.getByPlaceholderText(/退回理由/)).toBeInTheDocument()
      await user.click(screen.getByText('取消'))
      expect(screen.queryByPlaceholderText(/退回理由/)).not.toBeInTheDocument()
    })

    it('同時只有一篇展開退回框（切換時清空理由）', async () => {
      const articles = [
        buildPending({ uuid: 'p1', title: '文章 A' }),
        buildPending({ uuid: 'p2', title: '文章 B' }),
      ]
      mockGetPendingArticles.mockResolvedValue(buildPageResult(articles))

      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()

      // 開啟第一篇的退回框，輸入理由
      const rejectButtons = screen.getAllByText('退回')
      await user.click(rejectButtons[0])
      const textarea = screen.getByPlaceholderText(/退回理由/) as HTMLTextAreaElement
      await user.type(textarea, '舊理由')
      expect(textarea.value).toBe('舊理由')

      // 切換到第二篇
      await user.click(rejectButtons[1])
      const newTextarea = screen.getByPlaceholderText(/退回理由/) as HTMLTextAreaElement
      // 應清空
      expect(newTextarea.value).toBe('')
    })

    it('輸入理由後點「確認退回」呼叫 rejectArticle(uuid, reason)', async () => {
      mockRejectArticle.mockResolvedValue({ uuid: 'pending-uuid-1', status: 'REJECTED' } as any)
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()

      await user.click(screen.getByText('退回'))
      await user.type(screen.getByPlaceholderText(/退回理由/), '需要修改內容')
      await user.click(screen.getByText('確認退回'))

      expect(mockRejectArticle).toHaveBeenCalledWith('pending-uuid-1', '需要修改內容')
    })

    it('rejectArticle 成功後從列表移除', async () => {
      mockRejectArticle.mockResolvedValue({ uuid: 'pending-uuid-1', status: 'REJECTED' } as any)
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()

      await user.click(screen.getByText('退回'))
      await user.type(screen.getByPlaceholderText(/退回理由/), '需要修改')
      await user.click(screen.getByText('確認退回'))
      await flushPromises()

      expect(screen.queryByText('待審文章')).not.toBeInTheDocument()
    })

    it('rejectArticle 成功後顯示 toast success', async () => {
      mockRejectArticle.mockResolvedValue({ uuid: 'pending-uuid-1', status: 'REJECTED' } as any)
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()

      await user.click(screen.getByText('退回'))
      await user.type(screen.getByPlaceholderText(/退回理由/), '理由說明')
      await user.click(screen.getByText('確認退回'))
      await flushPromises()

      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success')
    })
  })

  // ── 分頁 ──────────────────────────────────────────────────────────────────
  describe('分頁', () => {
    function buildMultiPageResult() {
      const articles = Array.from({ length: 10 }, (_, i) =>
        buildPending({ uuid: `p-${i}`, title: `文章 ${i}` }),
      )
      return createMockPageResult(articles, { total: 20, pages: 2, size: 10 })
    }

    it('多頁時顯示「上一頁」「下一頁」', async () => {
      mockGetPendingArticles.mockResolvedValue(buildMultiPageResult())
      renderWithRouter(AdminReviewView)
      await flushPromises()
      expect(screen.getByText(/上一頁/)).toBeInTheDocument()
      expect(screen.getByText(/下一頁/)).toBeInTheDocument()
    })

    it('最後頁「下一頁」disabled', async () => {
      const lastPageResult = createMockPageResult(
        [buildPending()],
        { total: 20, pages: 2, current: 2, size: 10 },
      )
      // 先第一頁，再翻頁到最後頁
      mockGetPendingArticles
        .mockResolvedValueOnce(buildMultiPageResult())
        .mockResolvedValueOnce(lastPageResult)

      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()

      await user.click(screen.getByText(/下一頁/))
      await flushPromises()
      expect(screen.getByText(/下一頁/)).toBeDisabled()
    })

    it('點「下一頁」以 page=2 重呼叫 getPendingArticles', async () => {
      mockGetPendingArticles.mockResolvedValue(buildMultiPageResult())
      const user = userEvent.setup()
      renderWithRouter(AdminReviewView)
      await flushPromises()

      await user.click(screen.getByText(/下一頁/))
      await flushPromises()
      expect(mockGetPendingArticles).toHaveBeenCalledWith(2, 10)
    })
  })
})
