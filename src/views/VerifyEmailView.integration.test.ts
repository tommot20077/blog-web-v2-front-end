import { waitFor } from '@testing-library/vue'
import { renderWithRouterAsync } from '../test-utils'
import VerifyEmailView from './VerifyEmailView.vue'
import { authService } from '../api/authService'

vi.mock('../api/authService', () => ({
  authService: {
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    login: vi.fn(), getMe: vi.fn(), refresh: vi.fn(), logout: vi.fn(),
    register: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn(),
  },
}))

describe('VerifyEmailView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.verifyEmail).mockResolvedValue(undefined)
  })

  it('從 query param 取出 token 並呼叫 authService.verifyEmail（§2.2 GET+query 修正）', async () => {
    await renderWithRouterAsync(VerifyEmailView, {}, '/verify-email?token=verify-tok-abc')

    await waitFor(() => {
      expect(authService.verifyEmail).toHaveBeenCalledWith('verify-tok-abc')
    })
  })

  it('無 token 時不呼叫 verifyEmail', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue(undefined)
    await renderWithRouterAsync(VerifyEmailView, {}, '/verify-email')
    await waitFor(() => {
      expect(authService.verifyEmail).not.toHaveBeenCalled()
    }, { timeout: 500 }).catch(() => {})
    expect(authService.verifyEmail).not.toHaveBeenCalled()
  })
})
