import { fireEvent, waitFor } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import LoginView from './LoginView.vue'
import { renderWithRouter } from '../test-utils'
import { authService } from '../api/authService'
import { useToast } from '../composables/useToast'
import { useAuthStore } from '../stores/auth'

vi.mock('../api/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
}))

const mockLogin = vi.mocked(authService.login)
const mockGetMe = vi.mocked(authService.getMe)

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染 Email 和密碼欄位', () => {
    const { getByLabelText } = renderWithRouter(LoginView, {}, '/login')

    expect(getByLabelText('Email')).toBeInTheDocument()
    expect(getByLabelText('密碼')).toBeInTheDocument()
  })

  it('渲染登入按鈕', () => {
    const { getByRole } = renderWithRouter(LoginView, {}, '/login')

    expect(getByRole('button', { name: '登入' })).toBeInTheDocument()
  })

  it('空表單提交顯示驗證錯誤', async () => {
    const { getByRole, getAllByText } = renderWithRouter(LoginView, {}, '/login')

    await fireEvent.click(getByRole('button', { name: '登入' }))

    const errors = getAllByText('此欄位為必填')
    expect(errors).toHaveLength(2)
  })

  it('有效資料提交呼叫 store.login', async () => {
    mockLogin.mockResolvedValue({ accessToken: 'token', expiresIn: 3600 })
    mockGetMe.mockResolvedValue({
      uuid: 'u1', email: 'test@test.com', nickname: 'Test',
      avatarUrl: null, role: 'USER', emailVerified: true, createdAt: '2026-01-01',
    })

    const { getByLabelText, getByRole } = renderWithRouter(LoginView, {}, '/login')

    await fireEvent.update(getByLabelText('Email'), 'test@test.com')
    await fireEvent.update(getByLabelText('密碼'), 'password123')
    await fireEvent.click(getByRole('button', { name: '登入' }))

    await flushPromises()

    expect(mockLogin).toHaveBeenCalledWith({ identifier: 'test@test.com', password: 'password123' })
  })

  it('login 成功導向首頁', async () => {
    mockLogin.mockResolvedValue({ accessToken: 'token', expiresIn: 3600 })
    mockGetMe.mockResolvedValue({
      uuid: 'u1', email: 'test@test.com', nickname: 'Test',
      avatarUrl: null, role: 'USER', emailVerified: true, createdAt: '2026-01-01',
    })

    const { getByLabelText, getByRole, router } = renderWithRouter(LoginView, {}, '/login')

    await fireEvent.update(getByLabelText('Email'), 'test@test.com')
    await fireEvent.update(getByLabelText('密碼'), 'password123')
    await fireEvent.click(getByRole('button', { name: '登入' }))

    await flushPromises()

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/')
    })
  })

  it('login 失敗顯示 toast 錯誤', async () => {
    mockLogin.mockRejectedValue(new Error('帳號或密碼錯誤'))

    const { getByLabelText, getByRole } = renderWithRouter(LoginView, {}, '/login')

    await fireEvent.update(getByLabelText('Email'), 'test@test.com')
    await fireEvent.update(getByLabelText('密碼'), 'password123')
    await fireEvent.click(getByRole('button', { name: '登入' }))

    await flushPromises()

    const { toasts } = useToast()
    expect(toasts.value.some(t => t.message === '帳號或密碼錯誤' && t.type === 'error')).toBe(true)
  })

  it('忘記密碼連結指向 /forgot-password', () => {
    const { getByTestId } = renderWithRouter(LoginView, {}, '/login')

    const link = getByTestId('auth-login-forgot-link')
    expect(link.closest('a')).toHaveAttribute('href', '/forgot-password')
  })

  it('註冊連結指向 /register', () => {
    const { getByTestId } = renderWithRouter(LoginView, {}, '/login')

    const link = getByTestId('auth-login-alt-link')
    expect(link.closest('a')).toHaveAttribute('href', '/register')
  })

  it('登入成功後 returnUrl 存在時重導至 returnUrl', async () => {
    mockLogin.mockResolvedValue({ accessToken: 'token', expiresIn: 3600 })
    mockGetMe.mockResolvedValue({
      uuid: 'u1', email: 'test@test.com', nickname: 'Test',
      avatarUrl: null, role: 'USER', emailVerified: true, createdAt: '2026-01-01',
    })

    const { getByLabelText, getByRole, router, pinia } = renderWithRouter(LoginView, {}, '/login')

    // 在元件渲染後設置 returnUrl（元件已連結至此 pinia）
    setActivePinia(pinia)
    const authStore = useAuthStore()
    authStore.setReturnUrl('/editor')

    await fireEvent.update(getByLabelText('Email'), 'test@test.com')
    await fireEvent.update(getByLabelText('密碼'), 'password123')
    await fireEvent.click(getByRole('button', { name: '登入' }))

    await flushPromises()

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/editor')
    })
  })

  it('提交中按鈕 disabled 且顯示「登入中...」', async () => {
    // 讓 login 永遠不 resolve，保持 loading 狀態
    mockLogin.mockReturnValue(new Promise(() => {}))

    const { getByLabelText, getByRole } = renderWithRouter(LoginView, {}, '/login')

    await fireEvent.update(getByLabelText('Email'), 'test@test.com')
    await fireEvent.update(getByLabelText('密碼'), 'password123')
    await fireEvent.click(getByRole('button', { name: '登入' }))

    await flushPromises()

    await waitFor(() => {
      const button = getByRole('button', { name: '登入中...' })
      expect(button).toBeDisabled()
    })
  })

  // data-testid assertions
  it('data-testid: auth-login-title 存在', () => {
    const { getByTestId } = renderWithRouter(LoginView, {}, '/login')
    expect(getByTestId('auth-login-title')).toBeInTheDocument()
  })

  it('data-testid: auth-login-submit 存在', () => {
    const { getByTestId } = renderWithRouter(LoginView, {}, '/login')
    expect(getByTestId('auth-login-submit')).toBeInTheDocument()
  })

  it('data-testid: auth-login-field-email 存在', () => {
    const { getByTestId } = renderWithRouter(LoginView, {}, '/login')
    expect(getByTestId('auth-login-field-email')).toBeInTheDocument()
  })

  it('data-testid: auth-login-field-password 存在', () => {
    const { getByTestId } = renderWithRouter(LoginView, {}, '/login')
    expect(getByTestId('auth-login-field-password')).toBeInTheDocument()
  })

  it('data-testid: auth-login-alt-link 존在', () => {
    const { getByTestId } = renderWithRouter(LoginView, {}, '/login')
    expect(getByTestId('auth-login-alt-link')).toBeInTheDocument()
  })
})
