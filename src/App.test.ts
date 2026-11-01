import { flushPromises } from '@vue/test-utils'
import { screen } from '@testing-library/vue'
import { renderWithRouter } from './test-utils'
import App from './App.vue'

vi.mock('./api/authService', () => ({
  authService: {
    refresh: vi.fn().mockRejectedValue(new Error('no token')),
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}))

describe('App', () => {
  it('onMounted 時呼叫 authStore.refreshToken 進行靜默刷新', async () => {
    renderWithRouter(App)
    await flushPromises()
    const { authService } = await import('./api/authService')
    expect(authService.refresh).toHaveBeenCalled()
  })
})

describe('App 錯誤邊界（FE-01）', () => {
  it('路由頁面 render 拋錯時顯示 fallback，導覽列仍在', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { router } = renderWithRouter(App)
    const Thrower = {
      name: 'AppThrower',
      setup() {
        return () => {
          throw new Error('page boom')
        }
      },
    }
    router.addRoute({ path: '/boom', component: Thrower })
    await router.push('/boom')
    await flushPromises()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('此區塊載入失敗')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '主導覽' })).toBeInTheDocument()
  })
})
