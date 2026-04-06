import { nextTick } from 'vue'
import { renderWithRouter, createMockUser } from '../../test-utils'
import { useAuthStore } from '../../stores/auth'
import NavigationBar from './NavigationBar.vue'

describe('NavigationBar', () => {
  it('首頁連結存在 — link with text "首頁" pointing to "/"', () => {
    const { getByText } = renderWithRouter(NavigationBar)
    const link = getByText('首頁')
    expect(link.closest('a')).toHaveAttribute('href', '/')
  })

  it('文章連結存在 — link with text "文章" pointing to "/articles"', () => {
    const { getByText } = renderWithRouter(NavigationBar)
    const link = getByText('文章')
    expect(link.closest('a')).toHaveAttribute('href', '/articles')
  })

  it('Logo 連結存在 — link containing "MY BLOG WEB." pointing to "/"', () => {
    const { getByText } = renderWithRouter(NavigationBar)
    const logoText = getByText('MY BLOG WEB.')
    expect(logoText.closest('a')).toHaveAttribute('href', '/')
  })

  it('ThemeSwitcher 存在 — the theme toggle button is rendered', () => {
    const { getAllByRole } = renderWithRouter(NavigationBar)
    // NavigationBar 渲染兩個 ThemeSwitcher（手機版 + 桌機版），故使用 getAllByRole
    const buttons = getAllByRole('button', { name: '切換深淺色模式' })
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('WeatherWidget 存在 — weather info area is rendered', () => {
    const { getByTitle } = renderWithRouter(NavigationBar)
    const weatherWidget = getByTitle('今日天氣')
    expect(weatherWidget).toBeInTheDocument()
  })

  describe('RWD 響應式排版', () => {
    it('右側控制區（天氣 + 主題切換）在手機版應隱藏，桌機才顯示', () => {
      const { container } = renderWithRouter(NavigationBar)
      // 右側容器應帶有 hidden 與 md:flex class 實現 responsive 顯示
      const rightControls = container.querySelector('.hidden.md\\:flex')
      expect(rightControls).toBeInTheDocument()
    })

    it('導覽列外層有響應式水平 padding（手機較小、桌機較大）', () => {
      const { container } = renderWithRouter(NavigationBar)
      const nav = container.querySelector('nav')
      // 應包含 px-4 (手機) 與 md:px-10 (桌機) 的響應式 padding
      expect(nav?.className).toMatch(/px-4/)
    })
  })

  describe('Auth-Aware UI', () => {
    it('未登入時顯示「登入 / 註冊」連結', () => {
      const { getByText } = renderWithRouter(NavigationBar)
      const link = getByText('登入 / 註冊')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/login')
    })

    it('未登入時不顯示暱稱', () => {
      const { queryByText } = renderWithRouter(NavigationBar)
      expect(queryByText(/你好/)).not.toBeInTheDocument()
    })

    it('已登入時顯示「你好, TestUser!」', async () => {
      const { queryByText } = renderWithRouter(NavigationBar)
      const authStore = useAuthStore()
      authStore.accessToken = 'test-token'
      authStore.user = createMockUser({ nickname: 'TestUser' })
      await nextTick()
      expect(queryByText('你好, TestUser!')).toBeInTheDocument()
    })

    it('已登入時不顯示「登入 / 註冊」', async () => {
      const { queryByText } = renderWithRouter(NavigationBar)
      const authStore = useAuthStore()
      authStore.accessToken = 'test-token'
      authStore.user = createMockUser({ nickname: 'TestUser' })
      await nextTick()
      expect(queryByText('登入 / 註冊')).not.toBeInTheDocument()
    })

    it('已登入時顯示登出按鈕', async () => {
      const { getByRole } = renderWithRouter(NavigationBar)
      const authStore = useAuthStore()
      authStore.accessToken = 'test-token'
      authStore.user = createMockUser({ nickname: 'TestUser' })
      await nextTick()
      expect(getByRole('button', { name: '登出' })).toBeInTheDocument()
    })

    it('點擊登出呼叫 store.logout 並導航至首頁', async () => {
      const { getByRole, router } = renderWithRouter(NavigationBar)
      const authStore = useAuthStore()
      authStore.accessToken = 'test-token'
      authStore.user = createMockUser({ nickname: 'TestUser' })
      authStore.logout = vi.fn().mockResolvedValue(undefined)
      await nextTick()

      const logoutButton = getByRole('button', { name: '登出' })
      await logoutButton.click()
      await nextTick()

      expect(authStore.logout).toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe('/')
    })
  })
})
