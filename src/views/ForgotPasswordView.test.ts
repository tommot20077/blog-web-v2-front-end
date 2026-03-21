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

    const { getByLabelText, getByRole, getByText } = renderWithRouter(ForgotPasswordView)

    await fireEvent.update(getByLabelText('Email'), 'test@example.com')
    await fireEvent.click(getByRole('button', { name: '發送重設連結' }))

    await waitFor(() => {
      expect(getByText('重設密碼連結已寄出，請查看信箱')).toBeInTheDocument()
    })
    expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com')
  })

  it('回到登入連結指向 /login', () => {
    const { getByText } = renderWithRouter(ForgotPasswordView)

    const link = getByText('回到登入')
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })
})
