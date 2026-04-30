import { fireEvent, waitFor } from '@testing-library/vue'
import { renderWithRouter } from '../test-utils'
import ForgotPasswordView from './ForgotPasswordView.vue'
import { authService } from '../api/authService'

vi.mock('../api/authService', () => ({
  authService: {
    forgotPassword: vi.fn(),
  },
}))

describe('ForgotPasswordView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染 Email 欄位和發送按鈕', () => {
    const { getByLabelText, getByRole } = renderWithRouter(ForgotPasswordView)

    expect(getByLabelText('Email')).toBeInTheDocument()
    expect(getByRole('button', { name: '發送重設連結' })).toBeInTheDocument()
  })

  it('空表單提交顯示驗證錯誤', async () => {
    const { getByRole, getByTestId } = renderWithRouter(ForgotPasswordView)

    await fireEvent.click(getByRole('button', { name: '發送重設連結' }))

    await waitFor(() => {
      expect(getByTestId('form-field-error')).toBeInTheDocument()
    })
    expect(authService.forgotPassword).not.toHaveBeenCalled()
  })

  it('提交成功顯示「重設連結已寄出」', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue(undefined)

    const { getByLabelText, getByRole, getByTestId } = renderWithRouter(ForgotPasswordView)

    await fireEvent.update(getByLabelText('Email'), 'test@example.com')
    await fireEvent.click(getByRole('button', { name: '發送重設連結' }))

    await waitFor(() => {
      expect(getByTestId('auth-forgot-success')).toBeInTheDocument()
    })
    expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com')
  })

  it('回到登入連結指向 /login', () => {
    const { getByTestId } = renderWithRouter(ForgotPasswordView)

    const link = getByTestId('auth-forgot-alt-link')
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })

  // data-testid assertions
  it('data-testid: auth-forgot-title 存在', () => {
    const { getByTestId } = renderWithRouter(ForgotPasswordView)
    expect(getByTestId('auth-forgot-title')).toBeInTheDocument()
  })

  it('data-testid: auth-forgot-submit 存在', () => {
    const { getByTestId } = renderWithRouter(ForgotPasswordView)
    expect(getByTestId('auth-forgot-submit')).toBeInTheDocument()
  })

  it('data-testid: auth-forgot-field-email 存在', () => {
    const { getByTestId } = renderWithRouter(ForgotPasswordView)
    expect(getByTestId('auth-forgot-field-email')).toBeInTheDocument()
  })

  it('data-testid: auth-forgot-alt-link 存在', () => {
    const { getByTestId } = renderWithRouter(ForgotPasswordView)
    expect(getByTestId('auth-forgot-alt-link')).toBeInTheDocument()
  })
})
