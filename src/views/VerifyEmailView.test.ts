import { waitFor } from '@testing-library/vue'
import { renderWithRouterAsync } from '../test-utils'
import VerifyEmailView from './VerifyEmailView.vue'
import { authService } from '../api/authService'

vi.mock('../api/authService', () => ({
  authService: {
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
}))

describe('VerifyEmailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('進入頁面自動驗證', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue(undefined)

    await renderWithRouterAsync(VerifyEmailView, {}, '/verify-email?token=valid-token')

    expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token')
  })

  it('驗證成功顯示成功訊息', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue(undefined)

    const { getByText } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email?token=valid-token',
    )

    await waitFor(() => {
      expect(getByText('信箱驗證成功！')).toBeInTheDocument()
    })
  })

  it('驗證失敗顯示錯誤', async () => {
    vi.mocked(authService.verifyEmail).mockRejectedValue(new Error('Token 已過期'))

    const { getByText } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email?token=expired-token',
    )

    await waitFor(() => {
      expect(getByText('驗證失敗')).toBeInTheDocument()
    })
  })

  it('無 token 顯示無效連結', async () => {
    const { getByText } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email',
    )

    expect(getByText('無效的驗證連結')).toBeInTheDocument()
    expect(authService.verifyEmail).not.toHaveBeenCalled()
  })
})
