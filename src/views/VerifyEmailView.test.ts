import { waitFor, fireEvent } from '@testing-library/vue'
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

    const { getByTestId } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email?token=valid-token',
    )

    await waitFor(() => {
      expect(getByTestId('auth-verify-success')).toBeInTheDocument()
    })
  })

  it('驗證成功訊息不含驚嘆號', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue(undefined)

    const { getByTestId } = await renderWithRouterAsync(
      VerifyEmailView,
      {},
      '/verify-email?token=valid-token',
    )

    await waitFor(() => {
      expect(getByTestId('auth-verify-success')).toBeInTheDocument()
    })

    const successBlock = getByTestId('auth-verify-success')
    expect(successBlock.textContent).toContain('信箱驗證成功')
    expect(successBlock.textContent).not.toContain('！')
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

  // 驗證失敗後的重寄流程：token 屬憑證且常已過期，故重寄以 email 指認帳號，
  // 而非重試同一個 token（見 VerifyEmailView.vue 說明）
  describe('驗證失敗後重新發送驗證信', () => {
    beforeEach(() => {
      vi.mocked(authService.verifyEmail).mockRejectedValue(new Error('Token 已過期'))
    })

    it('顯示 email 輸入框', async () => {
      const { getByTestId } = await renderWithRouterAsync(
        VerifyEmailView,
        {},
        '/verify-email?token=expired-token',
      )
      await waitFor(() => {
        expect(getByTestId('auth-verify-failure')).toBeInTheDocument()
      })
      expect(getByTestId('auth-verify-resend-email')).toBeInTheDocument()
    })

    it('輸入 email 後點重寄 → 呼叫 resendVerification 並顯示已寄出', async () => {
      vi.mocked(authService.resendVerification).mockResolvedValue(undefined)
      const { getByTestId } = await renderWithRouterAsync(
        VerifyEmailView,
        {},
        '/verify-email?token=expired-token',
      )
      await waitFor(() => {
        expect(getByTestId('auth-verify-failure')).toBeInTheDocument()
      })

      await fireEvent.update(getByTestId('auth-verify-resend-email'), 'user@example.com')
      await fireEvent.click(getByTestId('auth-verify-resend-btn'))

      await waitFor(() => {
        expect(authService.resendVerification).toHaveBeenCalledWith('user@example.com')
        expect(getByTestId('auth-verify-resend-done')).toBeInTheDocument()
      })
    })

    it('email 空白時點重寄 → 不呼叫 resendVerification', async () => {
      const { getByTestId } = await renderWithRouterAsync(
        VerifyEmailView,
        {},
        '/verify-email?token=expired-token',
      )
      await waitFor(() => {
        expect(getByTestId('auth-verify-failure')).toBeInTheDocument()
      })

      await fireEvent.click(getByTestId('auth-verify-resend-btn'))

      expect(authService.resendVerification).not.toHaveBeenCalled()
    })

    it('重寄失敗（限流）顯示後端錯誤訊息', async () => {
      vi.mocked(authService.resendVerification).mockRejectedValue(new Error('每分鐘限 1 次'))
      const { getByTestId, getByText } = await renderWithRouterAsync(
        VerifyEmailView,
        {},
        '/verify-email?token=expired-token',
      )
      await waitFor(() => {
        expect(getByTestId('auth-verify-failure')).toBeInTheDocument()
      })

      await fireEvent.update(getByTestId('auth-verify-resend-email'), 'user@example.com')
      await fireEvent.click(getByTestId('auth-verify-resend-btn'))

      await waitFor(() => {
        expect(getByText('每分鐘限 1 次')).toBeInTheDocument()
      })
    })
  })
})
