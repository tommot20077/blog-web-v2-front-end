import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { renderWithRouterAsync } from '../test-utils'
import CheckEmailView from './CheckEmailView.vue'
import { authService } from '../api/authService'
import { useToast } from '../composables/useToast'

vi.mock('../api/authService', () => ({
  authService: {
    resendVerification: vi.fn(),
    verifyEmailCode: vi.fn(),
  },
}))

describe('CheckEmailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const { toasts, removeToast } = useToast()
    toasts.value.forEach(toast => removeToast(toast.id))
  })

  it('從 query email 顯示註冊信箱', async () => {
    const { getByTestId } = await renderWithRouterAsync(
      CheckEmailView,
      {},
      '/check-email?email=test@example.com',
    )

    expect(getByTestId('auth-check-email-address')).toHaveTextContent('test@example.com')
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('將信箱、驗證碼與重送操作集中在同一張卡片', async () => {
    const { getByTestId } = await renderWithRouterAsync(
      CheckEmailView,
      {},
      '/check-email?email=test@example.com',
    )

    const card = getByTestId('auth-check-email-card')

    expect(within(card).getByTestId('auth-check-email-card-heading')).toHaveTextContent('完成信箱驗證')
    expect(within(card).getByTestId('auth-check-email-address')).toHaveTextContent('test@example.com')
    expect(within(card).getByTestId('auth-check-email-field')).toBeInTheDocument()
    expect(within(card).getByTestId('auth-check-email-code-field')).toBeInTheDocument()
    expect(within(card).getByTestId('auth-check-email-verify-code')).toBeInTheDocument()
    expect(within(card).getByTestId('auth-check-email-resend')).toBeInTheDocument()
  })

  it('驗證卡片顯示在置中 overlay 並帶有暗化背景', async () => {
    const { getByTestId } = await renderWithRouterAsync(
      CheckEmailView,
      {},
      '/check-email?email=test@example.com',
    )

    const overlay = getByTestId('auth-check-email-overlay')
    const card = getByTestId('auth-check-email-card')

    expect(getByTestId('auth-check-email-backdrop')).toBeInTheDocument()
    expect(overlay).toContainElement(card)
  })

  it('按重新發送驗證信會呼叫 resendVerification 並在卡片內顯示成功訊息', async () => {
    vi.mocked(authService.resendVerification).mockResolvedValue(undefined)
    await renderWithRouterAsync(CheckEmailView, {}, '/check-email?email=test@example.com')

    await fireEvent.click(screen.getByTestId('auth-check-email-resend'))

    await waitFor(() => {
      expect(authService.resendVerification).toHaveBeenCalledWith('test@example.com')
      expect(screen.getByTestId('auth-check-email-feedback')).toHaveTextContent('驗證信已重新發送，請查看信箱')
      const { toasts } = useToast()
      expect(toasts.value.some(t => t.message === '驗證信已重新發送，請查看信箱')).toBe(false)
    })
  })

  it('沒有 query email 時可手動輸入 email 後重發', async () => {
    vi.mocked(authService.resendVerification).mockResolvedValue(undefined)
    await renderWithRouterAsync(CheckEmailView, {}, '/check-email')

    await fireEvent.update(screen.getByTestId('auth-check-email-field'), 'manual@example.com')
    await fireEvent.click(screen.getByTestId('auth-check-email-resend'))

    await waitFor(() => {
      expect(authService.resendVerification).toHaveBeenCalledWith('manual@example.com')
    })
  })

  it('輸入驗證碼後會呼叫 verifyEmailCode 並導回登入頁', async () => {
    vi.mocked(authService.verifyEmailCode).mockResolvedValue(undefined)
    const { router } = await renderWithRouterAsync(
      CheckEmailView,
      {},
      '/check-email?email=test@example.com',
    )

    await fireEvent.update(screen.getByTestId('auth-check-email-code-field'), '123456')
    await fireEvent.click(screen.getByTestId('auth-check-email-verify-code'))

    await waitFor(() => {
      expect(authService.verifyEmailCode).toHaveBeenCalledWith('test@example.com', '123456')
      expect(router.currentRoute.value.path).toBe('/login')
    })
  })

  it('驗證碼錯誤時在卡片內顯示錯誤且不新增 toast', async () => {
    vi.mocked(authService.verifyEmailCode).mockRejectedValue(new Error('驗證碼無效或已過期'))
    await renderWithRouterAsync(
      CheckEmailView,
      {},
      '/check-email?email=test@example.com',
    )

    await fireEvent.update(screen.getByTestId('auth-check-email-code-field'), '123456')
    await fireEvent.click(screen.getByTestId('auth-check-email-verify-code'))

    await waitFor(() => {
      const card = screen.getByTestId('auth-check-email-card')

      expect(within(card).getByText('驗證碼無效或已過期')).toBeInTheDocument()
      const { toasts } = useToast()
      expect(toasts.value.some(t => t.message === '驗證碼無效或已過期')).toBe(false)
    })
  })
})
