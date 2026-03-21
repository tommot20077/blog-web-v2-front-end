import { flushPromises } from '@vue/test-utils'
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
