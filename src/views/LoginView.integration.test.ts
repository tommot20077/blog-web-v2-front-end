import { fireEvent, waitFor } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { renderWithRouter } from '../test-utils'
import LoginView from './LoginView.vue'
import { authService } from '../api/authService'

vi.mock('../api/authService', () => ({
  authService: {
    login: vi.fn(),
    getMe: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
}))

describe('LoginView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.login).mockResolvedValue({ accessToken: 'tok', expiresIn: 3600 })
    vi.mocked(authService.getMe).mockResolvedValue({
      uuid: 'u1', email: 'a@b.com', nickname: 'User',
      avatarUrl: null, role: 'USER', emailVerified: true, createdAt: '2026-01-01',
    })
  })

  it('登入成功後呼叫 authService.login，再呼叫 getMe 取得使用者資料', async () => {
    const { getByLabelText, getByRole } = renderWithRouter(LoginView, {}, '/login')
    await flushPromises()

    await fireEvent.update(getByLabelText('Email'), 'a@b.com')
    await fireEvent.update(getByLabelText('密碼'), 'Password1!')
    await fireEvent.click(getByRole('button', { name: '登入' }))

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({ identifier: 'a@b.com', password: 'Password1!' })
    })
    await waitFor(() => {
      expect(authService.getMe).toHaveBeenCalled()
    })
  })
})
