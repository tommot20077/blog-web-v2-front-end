import { flushPromises } from '@vue/test-utils'
import { render, screen, waitFor, within } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import MyArticlesView from './MyArticlesView.vue'
import { renderWithRouter, createMockMyArticle, createMockPageResult } from '../test-utils'
import { myArticlesService } from '../api/myArticlesService'

vi.mock('../api/myArticlesService')

const mockShowToast = vi.fn()
vi.mock('../composables/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockGetMyArticles = vi.mocked(myArticlesService.getMyArticles)
const mockDeleteArticle = vi.mocked(myArticlesService.deleteArticle)
const mockSubmitForReview = vi.mocked(myArticlesService.submitForReview)

function buildDraftArticle(overrides = {}) {
  return createMockMyArticle({ status: 'DRAFT', title: '草稿文章', ...overrides })
}

function buildPendingArticle(overrides = {}) {
  return createMockMyArticle({ status: 'PENDING_REVIEW', title: '待審文章', uuid: 'pending-uuid', ...overrides })
}

function buildPublishedArticle(overrides = {}) {
  return createMockMyArticle({ status: 'PUBLISHED', title: '已發布文章', uuid: 'pub-uuid', ...overrides })
}

function buildRejectedArticle(overrides = {}) {
  return createMockMyArticle({
    status: 'REJECTED',
    title: '被退回文章',
    uuid: 'rejected-uuid',
    rejectReason: '內容需要修改',
    ...overrides,
  })
}

describe('MyArticlesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMyArticles.mockResolvedValue(createMockPageResult([buildDraftArticle()]))
  })

  // ── 結構 ───────────────────────────────────────────────────────────────────
  describe('結構', () => {
    it('渲染外層 my-root', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByTestId('my-root')).toBeInTheDocument()
    })

    it('渲染頁面標題', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByTestId('my-header-title')).toBeInTheDocument()
    })

    it('渲染 New Article 按鈕', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByTestId('my-new-btn')).toBeInTheDocument()
    })
  })

  // ── 初始載入 ───────────────────────────────────────────────────────────────
  describe('初始載入', () => {
    it('顯示 loading 指示器（getMyArticles 尚未 resolve 時）', () => {
      mockGetMyArticles.mockReturnValue(new Promise(() => {}))
      renderWithRouter(MyArticlesView)
      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    it('載入後顯示文章列表', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByText('草稿文章')).toBeInTheDocument()
    })

    it('空結果時顯示「目前沒有文章」提示', async () => {
      mockGetMyArticles.mockResolvedValue(createMockPageResult([]))
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByText(/目前沒有文章/)).toBeInTheDocument()
    })

    it('初始以 status=ALL, page=1, size=10 呼叫 getMyArticles', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(mockGetMyArticles).toHaveBeenCalledWith('ALL', 1, 10)
    })
  })

  // ── 狀態過濾 Tabs ──────────────────────────────────────────────────────────
  describe('狀態過濾 Tabs', () => {
    it('渲染 6 個 tab 按鈕', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(6)
    })

    it('初始「全部」tab 有 aria-selected=true', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      const allTab = screen.getByRole('tab', { name: /全部/ })
      expect(allTab).toHaveAttribute('aria-selected', 'true')
    })

    it('my-tab-draft 存在', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByTestId('my-tab-draft')).toBeInTheDocument()
    })

    it('my-tab-published 存在', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByTestId('my-tab-published')).toBeInTheDocument()
    })

    it('my-tab-archived 存在', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByTestId('my-tab-archived')).toBeInTheDocument()
    })

    it('點擊「草稿」tab → 以 status=DRAFT 重新呼叫 getMyArticles', async () => {
      const user = userEvent.setup()
      renderWithRouter(MyArticlesView)
      await flushPromises()

      await user.click(screen.getByTestId('my-tab-draft'))
      await flushPromises()

      expect(mockGetMyArticles).toHaveBeenCalledWith('DRAFT', 1, 10)
    })

    it('切換 tab 重置回第 1 頁', async () => {
      // 設定多頁環境
      const articles = Array.from({ length: 10 }, (_, i) =>
        buildDraftArticle({ uuid: `a-${i}`, title: `文章 ${i}` }),
      )
      mockGetMyArticles.mockResolvedValue(
        createMockPageResult(articles, { total: 20, pages: 2, size: 10 }),
      )

      const user = userEvent.setup()
      renderWithRouter(MyArticlesView)
      await flushPromises()

      // 移到第 2 頁
      await user.click(screen.getByText(/下一頁/))
      await flushPromises()
      expect(mockGetMyArticles).toHaveBeenCalledWith('ALL', 2, 10)

      // 切換 tab，應重置到第 1 頁
      mockGetMyArticles.mockResolvedValue(createMockPageResult([]))
      await user.click(screen.getByRole('tab', { name: /待審/ }))
      await flushPromises()
      expect(mockGetMyArticles).toHaveBeenCalledWith('PENDING_REVIEW', 1, 10)
    })
  })

  // ── 文章列表 ───────────────────────────────────────────────────────────────
  describe('文章列表', () => {
    it('顯示文章標題', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByText('草稿文章')).toBeInTheDocument()
    })

    it('顯示狀態文字', async () => {
      renderWithRouter(MyArticlesView)
      await flushPromises()
      const table = screen.getByRole('table')
      expect(within(table).getByText('草稿')).toBeInTheDocument()
    })

    it('REJECTED 文章顯示 rejectReason', async () => {
      mockGetMyArticles.mockResolvedValue(createMockPageResult([buildRejectedArticle()]))
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByText('內容需要修改')).toBeInTheDocument()
    })

    it('PENDING_REVIEW 文章不顯示 rejectReason', async () => {
      mockGetMyArticles.mockResolvedValue(
        createMockPageResult([buildPendingArticle({ rejectReason: '不應顯示' })]),
      )
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.queryByText('不應顯示')).not.toBeInTheDocument()
    })

    it('渲染文章 row 並帶正確 testid', async () => {
      const draft = buildDraftArticle({ uuid: 'draft-uuid' })
      mockGetMyArticles.mockResolvedValue(createMockPageResult([draft]))
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByTestId('my-row-draft-uuid')).toBeInTheDocument()
    })
  })

  // ── 操作按鈕 ───────────────────────────────────────────────────────────────
  describe('操作按鈕', () => {
    it('DRAFT 文章：顯示「編輯」「送出審核」「刪除」', async () => {
      const draft = buildDraftArticle({ uuid: 'draft-uuid' })
      mockGetMyArticles.mockResolvedValue(createMockPageResult([draft]))
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByTestId('my-row-action-edit-draft-uuid')).toBeInTheDocument()
      expect(screen.getByText('送出審核')).toBeInTheDocument()
      expect(screen.getByTestId('my-row-action-delete-draft-uuid')).toBeInTheDocument()
    })

    it('REJECTED 文章：僅顯示「編輯」按鈕', async () => {
      mockGetMyArticles.mockResolvedValue(createMockPageResult([buildRejectedArticle()]))
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByTestId('my-row-action-edit-rejected-uuid')).toBeInTheDocument()
      expect(screen.queryByText('送出審核')).not.toBeInTheDocument()
      expect(screen.queryByTestId('my-row-action-delete-rejected-uuid')).not.toBeInTheDocument()
    })

    it('PUBLISHED 文章：不顯示任何操作按鈕', async () => {
      mockGetMyArticles.mockResolvedValue(createMockPageResult([buildPublishedArticle()]))
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.queryByTestId('my-row-action-edit-pub-uuid')).not.toBeInTheDocument()
      expect(screen.queryByText('送出審核')).not.toBeInTheDocument()
      expect(screen.queryByTestId('my-row-action-delete-pub-uuid')).not.toBeInTheDocument()
    })

    it('點擊「送出審核」呼叫 submitForReview(uuid)', async () => {
      const draft = buildDraftArticle({ uuid: 'draft-uuid' })
      mockGetMyArticles.mockResolvedValue(createMockPageResult([draft]))
      mockSubmitForReview.mockResolvedValue(undefined)

      const user = userEvent.setup()
      renderWithRouter(MyArticlesView)
      await flushPromises()

      await user.click(screen.getByText('送出審核'))
      await flushPromises()

      expect(mockSubmitForReview).toHaveBeenCalledWith('draft-uuid')
    })

    it('submitForReview 成功後重載列表並顯示 toast', async () => {
      mockGetMyArticles.mockResolvedValue(createMockPageResult([buildDraftArticle()]))
      mockSubmitForReview.mockResolvedValue(undefined)

      const user = userEvent.setup()
      renderWithRouter(MyArticlesView)
      await flushPromises()

      await user.click(screen.getByText('送出審核'))
      await flushPromises()

      // 重載（第二次呼叫）
      expect(mockGetMyArticles).toHaveBeenCalledTimes(2)
      expect(mockShowToast).toHaveBeenCalledWith('已送出審核', 'success')
    })

    it('點擊「刪除」呼叫 deleteArticle(uuid)', async () => {
      const draft = buildDraftArticle({ uuid: 'draft-uuid' })
      mockGetMyArticles.mockResolvedValue(createMockPageResult([draft]))
      mockDeleteArticle.mockResolvedValue(undefined)

      const user = userEvent.setup()
      renderWithRouter(MyArticlesView)
      await flushPromises()

      await user.click(screen.getByTestId('my-row-action-delete-draft-uuid'))
      await flushPromises()

      expect(mockDeleteArticle).toHaveBeenCalledWith('draft-uuid')
    })

    it('deleteArticle 成功後重載列表', async () => {
      const draft = buildDraftArticle({ uuid: 'draft-uuid' })
      mockGetMyArticles.mockResolvedValue(createMockPageResult([draft]))
      mockDeleteArticle.mockResolvedValue(undefined)

      const user = userEvent.setup()
      renderWithRouter(MyArticlesView)
      await flushPromises()

      await user.click(screen.getByTestId('my-row-action-delete-draft-uuid'))
      await flushPromises()

      expect(mockGetMyArticles).toHaveBeenCalledTimes(2)
    })

    it('deleteArticle 失敗後顯示 toast error', async () => {
      const draft = buildDraftArticle({ uuid: 'draft-uuid' })
      mockGetMyArticles.mockResolvedValue(createMockPageResult([draft]))
      mockDeleteArticle.mockRejectedValue(new Error('刪除失敗'))

      const user = userEvent.setup()
      renderWithRouter(MyArticlesView)
      await flushPromises()

      await user.click(screen.getByTestId('my-row-action-delete-draft-uuid'))
      await flushPromises()

      expect(mockShowToast).toHaveBeenCalledWith('刪除失敗', 'error')
    })
  })

  // ── 分頁 ──────────────────────────────────────────────────────────────────
  describe('分頁', () => {
    function buildMultiPageResult() {
      const articles = Array.from({ length: 10 }, (_, i) =>
        buildDraftArticle({ uuid: `a-${i}`, title: `文章 ${i}` }),
      )
      return createMockPageResult(articles, { total: 20, pages: 2, size: 10 })
    }

    it('多頁時顯示「上一頁」「下一頁」', async () => {
      mockGetMyArticles.mockResolvedValue(buildMultiPageResult())
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByText(/上一頁/)).toBeInTheDocument()
      expect(screen.getByText(/下一頁/)).toBeInTheDocument()
    })

    it('第一頁「上一頁」disabled', async () => {
      mockGetMyArticles.mockResolvedValue(buildMultiPageResult())
      renderWithRouter(MyArticlesView)
      await flushPromises()
      expect(screen.getByText(/上一頁/)).toBeDisabled()
    })

    it('最後頁「下一頁」disabled', async () => {
      mockGetMyArticles.mockResolvedValue(
        createMockPageResult([], { total: 0, pages: 1 }),
      )
      renderWithRouter(MyArticlesView)
      await flushPromises()
      // 單頁時不顯示分頁，但也可測最後頁狀態
      // 改用 2 頁且到第 2 頁
      mockGetMyArticles.mockResolvedValue(buildMultiPageResult())
      renderWithRouter(MyArticlesView)
      await flushPromises()

      const user = userEvent.setup()
      mockGetMyArticles.mockResolvedValue(
        createMockPageResult([], { total: 20, pages: 2, current: 2, size: 10 }),
      )
      await user.click(screen.getAllByText(/下一頁/)[0])
      await flushPromises()
      expect(screen.getAllByText(/下一頁/)[0]).toBeDisabled()
    })

    it('點「下一頁」以 page=2 重呼叫 getMyArticles', async () => {
      mockGetMyArticles.mockResolvedValue(buildMultiPageResult())
      const user = userEvent.setup()
      renderWithRouter(MyArticlesView)
      await flushPromises()

      await user.click(screen.getByText(/下一頁/))
      await flushPromises()

      expect(mockGetMyArticles).toHaveBeenCalledWith('ALL', 2, 10)
    })
  })
})
