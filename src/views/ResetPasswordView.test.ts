import { fireEvent, waitFor } from '@testing-library/vue'
import { renderWithRouterAsync } from '../test-utils'
import ResetPasswordView from './ResetPasswordView.vue'
import { authService } from '../api/authService'

vi.mock('../api/authService', () => ({
  authService: {
    resetPassword: vi.fn(),
  },
}))

describe('ResetPasswordView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染新密碼和確認密碼欄位', async () => {
    const { getByLabelText } = await renderWithRouterAsync(
      ResetPasswordView,
      {},
      '/reset-password?token=valid-token',
    )

    expect(getByLabelText('新密碼')).toBeInTheDocument()
    expect(getByLabelText('確認密碼')).toBeInTheDocument()
  })

  it('密碼不一致顯示錯誤', async () => {
    const { getByLabelText, getByRole, getAllByTestId } = await renderWithRouterAsync(
      ResetPasswordView,
      {},
      '/reset-password?token=valid-token',
    )

    await fireEvent.update(getByLabelText('新密碼'), 'Password123')
    await fireEvent.update(getByLabelText('確認密碼'), 'DifferentPass')
    await fireEvent.click(getByRole('button', { name: '重設密碼' }))

    await waitFor(() => {
      const errors = getAllByTestId('form-field-error')
      const matchError = errors.find(el => el.textContent?.includes('兩次輸入不一致'))
      expect(matchError).toBeTruthy()
    })
  })

  it('重設成功導向 /login', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined)

    const { getByLabelText, getByRole, router } = await renderWithRouterAsync(
      ResetPasswordView,
      {},
      '/reset-password?token=valid-token',
    )

    await fireEvent.update(getByLabelText('新密碼'), 'NewPassword123')
    await fireEvent.update(getByLabelText('確認密碼'), 'NewPassword123')
    await fireEvent.click(getByRole('button', { name: '重設密碼' }))

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/login')
    })
    expect(authService.resetPassword).toHaveBeenCalledWith('valid-token', 'NewPassword123')
  })

  it('無 token 顯示錯誤訊息', async () => {
    const { getByText } = await renderWithRouterAsync(
      ResetPasswordView,
      {},
      '/reset-password',
    )

    expect(getByText('無效的重設連結')).toBeInTheDocument()
  })
})
