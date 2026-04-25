import { fireEvent, waitFor } from '@testing-library/vue'
import { renderWithRouter } from '../test-utils'
import RegisterView from './RegisterView.vue'
import { authService } from '../api/authService'

vi.mock('../api/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(), getMe: vi.fn(), refresh: vi.fn(), logout: vi.fn(),
    forgotPassword: vi.fn(), resetPassword: vi.fn(), verifyEmail: vi.fn(), resendVerification: vi.fn(),
  },
}))

describe('RegisterView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.register).mockResolvedValue(undefined)
  })

  it('正確填寫表單後呼叫 authService.register', async () => {
    const { getByLabelText, getByRole } = renderWithRouter(RegisterView, {}, '/register')

    await fireEvent.update(getByLabelText('Email'), 'user@test.com')
    await fireEvent.update(getByLabelText('使用者名稱'), 'testuser')
    await fireEvent.update(getByLabelText('暱稱'), 'TestUser')
    await fireEvent.update(getByLabelText('密碼'), 'Password1!')
    await fireEvent.click(getByRole('button', { name: '註冊' }))

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@test.com', nickname: 'TestUser', username: 'testuser' })
      )
    })
  })
})
