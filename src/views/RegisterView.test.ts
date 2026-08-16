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

  // D1「右欄原地切換」（Yuan 2026-07-19 定案）：
  // 註冊成功後不再跳頁、不再彈一閃即逝的 toast，改為右欄原地換成
  // 帶有 auth-register-success 的成功狀態畫面，並回顯註冊用 email。
  // 舊斷言「顯示成功 toast 並導向 /login」對應的是已被明確廢棄的行為，故整條改寫，
  // 而非弱化：新斷言同樣要求「不留在半殘狀態」，只是驗證的目標行為改變了。
  it('註冊成功後右欄原地顯示成功畫面並回顯 email（不跳頁、不彈 toast）', async () => {
    const { router, pinia } = renderRegisterView();
    setActivePinia(pinia);

    const authStore = useAuthStore();
    authStore.register = vi.fn().mockResolvedValue(undefined);

    // router setup 的初始 push('/register') 未 await，先等它 settle，
    // 才能在提交後可靠地斷言「路徑沒有因為送出表單而改變」。
    await router.isReady();
    const pathBeforeSubmit = router.currentRoute.value.path;

    const emailInput = screen.getByPlaceholderText('請輸入 Email');
    const usernameInput = screen.getByPlaceholderText('請輸入使用者名稱（英文、數字）');
    const nicknameInput = screen.getByPlaceholderText('請輸入暱稱');
    const passwordInput = screen.getByPlaceholderText('請輸入密碼');

    await fireEvent.update(emailInput, 'test@example.com');
    await fireEvent.update(usernameInput, 'test_user');
    await fireEvent.update(nicknameInput, 'TestUser');
    await fireEvent.update(passwordInput, 'Password123!');

    const button = screen.getByRole('button', { name: '註冊' });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('auth-register-success')).toBeTruthy();
    });

    expect(screen.getByTestId('auth-register-success-email').textContent).toContain(
      'test@example.com',
    );

    // 送出表單不應觸發任何導航 —— 不再自動跳轉到 /login
    expect(router.currentRoute.value.path).toBe(pathBeforeSubmit);

    // 不再彈出「註冊成功」toast —— 已改為右欄原地呈現的持久成功畫面
    const { toasts } = useToast();
    const successToast = toasts.value.find(t => t.type === 'success');
    expect(successToast).toBeFalsy();
  });

  it('註冊失敗顯示錯誤 toast', async () => {
    const { pinia } = renderRegisterView();
    setActivePinia(pinia);

    const authStore = useAuthStore();
    authStore.register = vi.fn().mockRejectedValue(new Error('Email 已被使用'));

    const emailInput = screen.getByPlaceholderText('請輸入 Email');
    const usernameInput = screen.getByPlaceholderText('請輸入使用者名稱（英文、數字）');
    const nicknameInput = screen.getByPlaceholderText('請輸入暱稱');
    const passwordInput = screen.getByPlaceholderText('請輸入密碼');

    await fireEvent.update(emailInput, 'test@example.com');
    await fireEvent.update(usernameInput, 'test_user');
    await fireEvent.update(nicknameInput, 'TestUser');
    await fireEvent.update(passwordInput, 'Password123!');

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

  // data-testid assertions
  it('data-testid: auth-register-title 存在', () => {
    renderRegisterView();
    expect(screen.getByTestId('auth-register-title')).toBeTruthy();
  });

  it('data-testid: auth-register-submit 存在', () => {
    renderRegisterView();
    expect(screen.getByTestId('auth-register-submit')).toBeTruthy();
  });

  it('data-testid: auth-register-field-email 存在', () => {
    renderRegisterView();
    expect(screen.getByTestId('auth-register-field-email')).toBeTruthy();
  });

  it('data-testid: auth-register-field-username 存在', () => {
    renderRegisterView();
    expect(screen.getByTestId('auth-register-field-username')).toBeTruthy();
  });

  it('data-testid: auth-register-field-password 存在', () => {
    renderRegisterView();
    expect(screen.getByTestId('auth-register-field-password')).toBeTruthy();
  });

  it('data-testid: auth-register-alt-link 存在', () => {
    renderRegisterView();
    expect(screen.getByTestId('auth-register-alt-link')).toBeTruthy();
  });
});
