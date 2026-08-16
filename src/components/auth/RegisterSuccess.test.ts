import { fireEvent, waitFor } from '@testing-library/vue';
import { renderWithRouter } from '../../test-utils';
import RegisterSuccess from './RegisterSuccess.vue';
import { authService } from '../../api/authService';
import { useToast } from '../../composables/useToast';

// D1「右欄原地切換」：註冊成功後顯示的成功狀態畫面。
// 只驗證行為契約（testid、回顯 email、登入連結、重寄呼叫既有 API），不重覆測 CSS。
vi.mock('../../api/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    getMe: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    verifyEmailCode: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

describe('RegisterSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('顯示 auth-register-success 根節點與回顯的 email', () => {
    const { getByTestId } = renderWithRouter(RegisterSuccess, {
      props: { email: 'yuan@test.local' },
    });

    expect(getByTestId('auth-register-success')).toBeTruthy();
    expect(getByTestId('auth-register-success-email').textContent).toContain('yuan@test.local');
  });

  it('「前往登入」連結指向 /login', () => {
    const { getByTestId } = renderWithRouter(RegisterSuccess, {
      props: { email: 'yuan@test.local' },
    });

    const link = getByTestId('auth-register-success-login');
    expect(link.getAttribute('href')).toBe('/login');
  });

  it('點擊「重寄驗證信」呼叫既有的 authService.resendVerification（不得自行發明後端端點）', async () => {
    vi.mocked(authService.resendVerification).mockResolvedValue(undefined);

    const { getByTestId } = renderWithRouter(RegisterSuccess, {
      props: { email: 'resend-me@test.local' },
    });

    await fireEvent.click(getByTestId('auth-register-success-resend'));

    await waitFor(() => {
      expect(authService.resendVerification).toHaveBeenCalledWith('resend-me@test.local');
    });
  });

  it('重寄失敗時顯示錯誤 toast，而不是靜默失敗', async () => {
    vi.mocked(authService.resendVerification).mockRejectedValue(new Error('每分鐘限 1 次'));

    const { getByTestId } = renderWithRouter(RegisterSuccess, {
      props: { email: 'resend-me@test.local' },
    });

    await fireEvent.click(getByTestId('auth-register-success-resend'));

    await waitFor(() => {
      const { toasts } = useToast();
      const errorToast = toasts.value.find(t => t.message === '每分鐘限 1 次' && t.type === 'error');
      expect(errorToast).toBeTruthy();
    });
  });
});
