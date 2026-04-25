import { fireEvent, waitFor } from '@testing-library/vue'
import { renderWithRouterAsync } from '../test-utils'
import ResetPasswordView from './ResetPasswordView.vue'
import { authService } from '../api/authService'

vi.mock('../api/authService', () => ({
  authService: {
    resetPassword: vi.fn(),
    login: vi.fn(), getMe: vi.fn(), refresh: vi.fn(), logout: vi.fn(),
    register: vi.fn(), forgotPassword: vi.fn(), verifyEmail: vi.fn(), resendVerification: vi.fn(),
  },
}))

describe('ResetPasswordView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined)
  })

  it('帶有 token 查詢參數時提交後呼叫 authService.resetPassword', async () => {
    const { getByLabelText, getByRole } = await renderWithRouterAsync(
      ResetPasswordView, {}, '/reset-password?token=reset-tok-123'
    )

    await fireEvent.update(getByLabelText('新密碼'), 'NewPassword1!')
    await fireEvent.update(getByLabelText('確認密碼'), 'NewPassword1!')
    await fireEvent.click(getByRole('button', { name: '重設密碼' }))

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith('reset-tok-123', 'NewPassword1!')
    })
  })
})
