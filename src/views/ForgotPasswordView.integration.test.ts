import { fireEvent, waitFor } from '@testing-library/vue'
import { renderWithRouter } from '../test-utils'
import ForgotPasswordView from './ForgotPasswordView.vue'
import { authService } from '../api/authService'

vi.mock('../api/authService', () => ({
  authService: {
    forgotPassword: vi.fn(),
    login: vi.fn(), getMe: vi.fn(), refresh: vi.fn(), logout: vi.fn(),
    register: vi.fn(), resetPassword: vi.fn(), verifyEmail: vi.fn(), resendVerification: vi.fn(),
  },
}))

describe('ForgotPasswordView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.forgotPassword).mockResolvedValue(undefined)
  })

  it('輸入 email 送出後呼叫 authService.forgotPassword', async () => {
    const { getByLabelText, getByRole } = renderWithRouter(ForgotPasswordView, {}, '/forgot-password')

    await fireEvent.update(getByLabelText('Email'), 'reset@test.com')
    await fireEvent.click(getByRole('button', { name: /發送重設連結/i }))

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith('reset@test.com')
    })
  })
})
