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

  it('讀取 token 後立即從網址移除，且不影響驗證流程', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue(undefined)

    const { router, getByTestId } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email?token=valid-token',
    )

    // token 留在網址會進入瀏覽器歷史、書籤與分享連結
    await waitFor(() => {
      expect(router.currentRoute.value.query.token).toBeUndefined()
    })

    // 清掉網址參數後，驗證仍須以原 token 送出，且成功畫面不得被誤判為「無效連結」
    expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token')
    await waitFor(() => {
      expect(getByTestId('auth-verify-success')).toBeInTheDocument()
    })
  })

  it('驗證成功顯示成功訊息', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue(undefined)

    const { getByTestId } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email?token=valid-token',
    )

    await waitFor(() => {
      expect(getByTestId('auth-verify-success')).toBeInTheDocument()
    })
  })

  it('驗證失敗顯示錯誤', async () => {
    vi.mocked(authService.verifyEmail).mockRejectedValue(new Error('Token 已過期'))

    const { getByTestId } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email?token=expired-token',
    )

    await waitFor(() => {
      expect(getByTestId('auth-verify-failure')).toBeInTheDocument()
    })
  })

  it('無 token 顯示無效連結', async () => {
    const { getByTestId } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email',
    )

    expect(getByTestId('auth-verify-no-token')).toBeInTheDocument()
    expect(authService.verifyEmail).not.toHaveBeenCalled()
  })

  // data-testid assertions
  it('data-testid: auth-verify-title 存在', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue(undefined)
    const { getByTestId } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email?token=valid-token',
    )
    expect(getByTestId('auth-verify-title')).toBeInTheDocument()
  })

  it('data-testid: auth-verify-resend-btn 存在（驗證失敗時）', async () => {
    vi.mocked(authService.verifyEmail).mockRejectedValue(new Error('Token 已過期'))
    const { getByTestId } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email?token=expired-token',
    )
    await waitFor(() => {
      expect(getByTestId('auth-verify-resend-btn')).toBeInTheDocument()
    })
  })
})
