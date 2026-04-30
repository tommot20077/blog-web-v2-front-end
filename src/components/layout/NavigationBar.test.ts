import { nextTick } from 'vue'
import { renderWithRouter, createMockUser } from '../../test-utils'
import { useAuthStore } from '../../stores/auth'
import NavigationBar from './NavigationBar.vue'

describe('NavigationBar', () => {
  it('navbar root element exists with data-testid', () => {
    const { getByTestId } = renderWithRouter(NavigationBar)
    expect(getByTestId('navbar-root')).toBeInTheDocument()
  })

  it('logo link exists pointing to "/"', () => {
    const { getByTestId } = renderWithRouter(NavigationBar)
    const logo = getByTestId('navbar-logo')
    // RouterLink renders as <a> so the element itself is the anchor
    expect(logo).toHaveAttribute('href', '/')
  })

  it('home link exists pointing to "/"', () => {
    const { getByTestId } = renderWithRouter(NavigationBar)
    // RouterLink renders as <a>, so the element with data-testid IS the anchor
    const link = getByTestId('navbar-link-home')
    expect(link).toHaveAttribute('href', '/')
  })

  it('articles link exists pointing to "/articles"', () => {
    const { getByTestId } = renderWithRouter(NavigationBar)
    const link = getByTestId('navbar-link-articles')
    expect(link).toHaveAttribute('href', '/articles')
  })

  it('theme toggle button is rendered', () => {
    const { getByTestId } = renderWithRouter(NavigationBar)
    expect(getByTestId('navbar-theme-toggle')).toBeInTheDocument()
  })

  describe('Auth-Aware UI', () => {
    it('未登入時顯示 login button with data-testid', () => {
      const { getByTestId } = renderWithRouter(NavigationBar)
      expect(getByTestId('navbar-login-btn')).toBeInTheDocument()
    })

    it('未登入時不顯示 user menu', () => {
      const { queryByTestId } = renderWithRouter(NavigationBar)
      expect(queryByTestId('navbar-user-menu')).not.toBeInTheDocument()
    })

    it('已登入時顯示 user menu', async () => {
      const { queryByTestId } = renderWithRouter(NavigationBar)
      const authStore = useAuthStore()
      authStore.accessToken = 'test-token'
      authStore.user = createMockUser({ nickname: 'TestUser' })
      await nextTick()
      expect(queryByTestId('navbar-user-menu')).toBeInTheDocument()
    })

    it('已登入時不顯示 login button', async () => {
      const { queryByTestId } = renderWithRouter(NavigationBar)
      const authStore = useAuthStore()
      authStore.accessToken = 'test-token'
      authStore.user = createMockUser({ nickname: 'TestUser' })
      await nextTick()
      expect(queryByTestId('navbar-login-btn')).not.toBeInTheDocument()
    })

    it('點擊登出呼叫 store.logout 並導航至首頁', async () => {
      const { getByTestId, router } = renderWithRouter(NavigationBar)
      const authStore = useAuthStore()
      authStore.accessToken = 'test-token'
      authStore.user = createMockUser({ nickname: 'TestUser' })
      authStore.logout = vi.fn().mockResolvedValue(undefined)
      await nextTick()

      const logoutButton = getByTestId('navbar-logout-btn')
      await logoutButton.click()
      await nextTick()

      expect(authStore.logout).toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe('/')
    })
  })
})
