import { flushPromises } from '@vue/test-utils'
import { screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { reactive, nextTick } from 'vue'
import Navbar from './Navbar.vue'
import { renderWithRouter } from '../test-utils'
import { useAuthStore } from '../stores/auth'
import { adminService } from '../api/adminService'

vi.mock('../stores/auth')
vi.mock('../api/adminService')

const mockUseAuthStore = vi.mocked(useAuthStore)
const mockGetPendingCount = vi.mocked(adminService.getPendingCount)

function makeAuthState(overrides: Partial<{
  isAuthenticated: boolean
  isAdmin: boolean
  isAuthor: boolean
  logout: ReturnType<typeof vi.fn>
}> = {}) {
  return {
    isAuthenticated: false,
    isAdmin: false,
    isAuthor: false,
    logout: vi.fn(),
    ...overrides,
  }
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPendingCount.mockResolvedValue(0)
  })

  // ── 未登入 ────────────────────────────────────────────────────────────────
  describe('未登入（isAuthenticated=false）', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue(makeAuthState() as any)
    })

    it('顯示「首頁」連結', () => {
      renderWithRouter(Navbar)
      expect(screen.getByRole('link', { name: /首頁/ })).toBeInTheDocument()
    })

    it('顯示「文章」連結', () => {
      renderWithRouter(Navbar)
      expect(screen.getByRole('link', { name: /文章/ })).toBeInTheDocument()
    })

    it('顯示「登入」連結', () => {
      renderWithRouter(Navbar)
      expect(screen.getByRole('link', { name: /登入/ })).toBeInTheDocument()
    })

    it('不顯示「我的文章」', () => {
      renderWithRouter(Navbar)
      expect(screen.queryByRole('link', { name: /我的文章/ })).not.toBeInTheDocument()
    })

    it('不顯示「登出」按鈕', () => {
      renderWithRouter(Navbar)
      expect(screen.queryByRole('button', { name: /登出/ })).not.toBeInTheDocument()
    })

    it('不顯示「待審核」連結', () => {
      renderWithRouter(Navbar)
      expect(screen.queryByRole('link', { name: /待審核/ })).not.toBeInTheDocument()
    })
  })

  // ── 已登入 AUTHOR ─────────────────────────────────────────────────────────
  describe('已登入 AUTHOR（isAuthenticated=true, isAdmin=false）', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue(
        makeAuthState({ isAuthenticated: true, isAuthor: true }) as any,
      )
    })

    it('顯示「首頁」「文章」', () => {
      renderWithRouter(Navbar)
      expect(screen.getByRole('link', { name: /首頁/ })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '文章' })).toBeInTheDocument()
    })

    it('顯示「我的文章」連結', () => {
      renderWithRouter(Navbar)
      expect(screen.getByRole('link', { name: /我的文章/ })).toBeInTheDocument()
    })

    it('顯示「新建文章」連結', () => {
      renderWithRouter(Navbar)
      expect(screen.getByRole('link', { name: /新建文章/ })).toBeInTheDocument()
    })

    it('顯示「登出」按鈕', () => {
      renderWithRouter(Navbar)
      expect(screen.getByRole('button', { name: /登出/ })).toBeInTheDocument()
    })

    it('不顯示「登入」連結', () => {
      renderWithRouter(Navbar)
      expect(screen.queryByRole('link', { name: /登入/ })).not.toBeInTheDocument()
    })

    it('不顯示「待審核」連結', () => {
      renderWithRouter(Navbar)
      expect(screen.queryByRole('link', { name: /待審核/ })).not.toBeInTheDocument()
    })

    it('點「登出」呼叫 authStore.logout()', async () => {
      const mockLogout = vi.fn().mockResolvedValue(undefined)
      mockUseAuthStore.mockReturnValue(
        makeAuthState({ isAuthenticated: true, isAuthor: true, logout: mockLogout }) as any,
      )
      const user = userEvent.setup()
      renderWithRouter(Navbar)
      await user.click(screen.getByRole('button', { name: /登出/ }))
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  // ── 已登入 ADMIN ──────────────────────────────────────────────────────────
  describe('已登入 ADMIN（isAuthenticated=true, isAdmin=true）', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue(
        makeAuthState({ isAuthenticated: true, isAdmin: true, isAuthor: true }) as any,
      )
    })

    it('顯示「待審核」連結指向 /admin/review', async () => {
      mockGetPendingCount.mockResolvedValue(3)
      renderWithRouter(Navbar)
      await flushPromises()
      const link = screen.getByRole('link', { name: /待審核/ })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/admin/review')
    })

    it('待審核徽章顯示正確數字', async () => {
      mockGetPendingCount.mockResolvedValue(5)
      renderWithRouter(Navbar)
      await flushPromises()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('getPendingCount 回傳 0 時不顯示徽章數字', async () => {
      mockGetPendingCount.mockResolvedValue(0)
      renderWithRouter(Navbar)
      await flushPromises()
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })

  // ── 動態 isAdmin 變更 ─────────────────────────────────────────────────────
  describe('isAdmin 動態變更', () => {
    it('isAdmin 從 false 變 true 時重新 fetch pendingCount', async () => {
      const authState = reactive(makeAuthState({ isAuthenticated: true, isAdmin: false }))
      mockUseAuthStore.mockReturnValue(authState as any)
      mockGetPendingCount.mockResolvedValue(7)

      renderWithRouter(Navbar)
      await flushPromises()
      // 初始 isAdmin=false，不應呼叫
      expect(mockGetPendingCount).not.toHaveBeenCalled()

      // 角色升級
      authState.isAdmin = true
      await nextTick()
      await flushPromises()
      expect(mockGetPendingCount).toHaveBeenCalledTimes(1)
    })

    it('isAuthenticated 從 true 變 false 時 pendingCount 重置為 0', async () => {
      const authState = reactive(makeAuthState({ isAuthenticated: true, isAdmin: true }))
      mockUseAuthStore.mockReturnValue(authState as any)
      mockGetPendingCount.mockResolvedValue(4)

      renderWithRouter(Navbar)
      await flushPromises()
      expect(screen.getByText('4')).toBeInTheDocument()

      // 登出
      authState.isAuthenticated = false
      authState.isAdmin = false
      await nextTick()
      await flushPromises()
      // badge 應消失（count reset 為 0）
      expect(screen.queryByText('4')).not.toBeInTheDocument()
    })
  })
})
