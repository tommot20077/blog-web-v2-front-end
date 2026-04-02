import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import RegisterView from './RegisterView.vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';

// Mock authService 避免實際 API 呼叫
vi.mock('../api/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    getMe: vi.fn(),
  },
}));

function createTestSetup() {
  const pinia = createPinia();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/register', component: RegisterView },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    ],
  });
  router.push('/register');

  return { pinia, router };
}

function renderRegisterView() {
  const { pinia, router } = createTestSetup();
  setActivePinia(pinia);

  const result = render(RegisterView, {
    global: {
      plugins: [pinia, router],
    },
  });

  return { ...result, pinia, router };
}

describe('RegisterView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染 Email、暱稱和密碼欄位', () => {
    renderRegisterView();

    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('暱稱')).toBeTruthy();
    expect(screen.getByText('密碼')).toBeTruthy();

    expect(screen.getByPlaceholderText('請輸入 Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('請輸入暱稱')).toBeTruthy();
    expect(screen.getByPlaceholderText('請輸入密碼')).toBeTruthy();
  });

  it('渲染註冊按鈕', () => {
    renderRegisterView();

    const button = screen.getByRole('button', { name: '註冊' });
    expect(button).toBeTruthy();
  });

  it('空表單提交顯示驗證錯誤', async () => {
    renderRegisterView();

    const button = screen.getByRole('button', { name: '註冊' });
    await fireEvent.click(button);

    const errors = screen.getAllByTestId('form-field-error');
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it('輸入密碼時顯示密碼強度指示器', async () => {
    renderRegisterView();

    const passwordInput = screen.getByPlaceholderText('請輸入密碼');
    await fireEvent.update(passwordInput, 'Abcdef1234');

    expect(screen.getByTestId('password-strength')).toBeTruthy();
  });

  it('註冊成功顯示成功 toast 並導向 /login', async () => {
    const { router, pinia } = renderRegisterView();
    setActivePinia(pinia);

    const authStore = useAuthStore();
    authStore.register = vi.fn().mockResolvedValue(undefined);

    const emailInput = screen.getByPlaceholderText('請輸入 Email');
    const nicknameInput = screen.getByPlaceholderText('請輸入暱稱');
    const passwordInput = screen.getByPlaceholderText('請輸入密碼');

    await fireEvent.update(emailInput, 'test@example.com');
    await fireEvent.update(nicknameInput, 'TestUser');
    await fireEvent.update(passwordInput, 'Password123');

    const button = screen.getByRole('button', { name: '註冊' });
    await fireEvent.click(button);

    await waitFor(() => {
      const { toasts } = useToast();
      const successToast = toasts.value.find(
        t => t.message === '註冊成功！請至信箱驗證您的帳號' && t.type === 'success',
      );
      expect(successToast).toBeTruthy();
    });

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/login');
    });
  });

  it('註冊失敗顯示錯誤 toast', async () => {
    const { pinia } = renderRegisterView();
    setActivePinia(pinia);

    const authStore = useAuthStore();
    authStore.register = vi.fn().mockRejectedValue(new Error('Email 已被使用'));

    const emailInput = screen.getByPlaceholderText('請輸入 Email');
    const nicknameInput = screen.getByPlaceholderText('請輸入暱稱');
    const passwordInput = screen.getByPlaceholderText('請輸入密碼');

    await fireEvent.update(emailInput, 'test@example.com');
    await fireEvent.update(nicknameInput, 'TestUser');
    await fireEvent.update(passwordInput, 'Password123');

    const button = screen.getByRole('button', { name: '註冊' });
    await fireEvent.click(button);

    await waitFor(() => {
      const { toasts } = useToast();
      const errorToast = toasts.value.find(
        t => t.message === 'Email 已被使用' && t.type === 'error',
      );
      expect(errorToast).toBeTruthy();
    });
  });

  it('已有帳號連結指向 /login', () => {
    renderRegisterView();

    const link = screen.getByText('登入');
    expect(link.closest('a')?.getAttribute('href')).toBe('/login');
  });
});
