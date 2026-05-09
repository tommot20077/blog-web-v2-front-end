import { test, expect, type Page } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8080'

interface PiniaWindow {
  __pinia: { state: { value: { auth: { accessToken: string | null } } } }
  __router: { push: (path: string) => Promise<void> }
}

async function loginUI(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForURL(/\/login/, { timeout: 5000 })
  await page.getByTestId('auth-login-field-email').fill(email)
  await page.getByTestId('auth-login-field-password').fill(password)
  await page.getByTestId('auth-login-submit').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })
}

test.describe.configure({ mode: 'serial' })

test.describe('Auth token refresh (A6/A7/A8)', () => {
  test('A6: 未驗證帳號 login 顯示驗證提示', async ({ page, request }) => {
    const ts = Date.now()
    const email = `unverified_${ts}@test.local`
    const reg = await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: { email, username: `u${ts}`, nickname: `Un${ts}`, password: 'Test1234!' },
    })
    expect((await reg.json()).code).toBe('00000')

    await page.goto('/login')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    await page.getByTestId('auth-login-field-email').fill(email)
    await page.getByTestId('auth-login-field-password').fill('Test1234!')
    await page.getByTestId('auth-login-submit').click()

    // 預期：仍停留 /login 且看到驗證相關訊息
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('body')).toContainText(/驗證|verify/i, { timeout: 5000 })
  })

  test('A7: access token 過期 → axios interceptor 自動 refresh + retry 成功', async ({ page }) => {
    const author = getCredentials('author')
    await loginUI(page, author.email, author.password)

    // 把 Pinia auth.accessToken 換成 invalid 觸發 401
    await page.evaluate(() => {
      const w = window as unknown as PiniaWindow
      w.__pinia.state.value.auth.accessToken = 'invalid.token.payload'
    })

    // 訪 /my-articles 觸發 protected API call (GET /articles/me)
    await page.evaluate(() => {
      const w = window as unknown as PiniaWindow
      return w.__router.push('/my-articles')
    })
    await page.waitForURL('/my-articles', { timeout: 5000 })

    // 等 axios interceptor 完成 refresh + retry
    await page.waitForTimeout(3000)

    // 不應該被 redirect 到 /login
    await expect(page).not.toHaveURL(/\/login/)

    // access token 應已被更新成有效值（不再是 invalid 那個）
    const newToken = await page.evaluate(() => {
      const w = window as unknown as PiniaWindow
      return w.__pinia.state.value.auth.accessToken
    })
    expect(newToken).not.toBe('invalid.token.payload')
    expect(newToken).toMatch(/^eyJ/) // JWT 開頭
  })

  /**
   * A7 強化：兩個並行 401 應只觸發一次 /auth/refresh。
   * 驗 axios interceptor 的 isRefreshing flag + failedQueue 機制。
   *
   * 觸發機制：透過 window.__apiClient（dev mode expose）在 page.evaluate 內
   * Promise.all 兩個並行 axios.get，達到真實 concurrent。Mock 兩個不同 endpoint
   * 都首次回 401，第二次放行；驗 /auth/refresh 只被叫一次。
   *
   * 若 src/api/apiClient.ts 重構移除 processQueue, 此 spec 預期會壞，請對應調整。
   */
  test('A7 強化: concurrent 401 應只觸發一次 /auth/refresh', async ({ page }) => {
    const author = getCredentials('author');

    // 先正常登入並等 page idle，避免 auth store 自動 fetchUser 影響後續斷言
    await page.goto('/login');
    await page.getByTestId('auth-login-field-email').fill(author.email);
    await page.getByTestId('auth-login-field-password').fill(author.password);
    await page.getByTestId('auth-login-submit').click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'));
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    let refreshCount = 0;
    const articleFirstCalled = { fired: false };
    const userFirstCalled = { fired: false };

    // 攔截 refresh：計數但放行（讓真實 refresh 真的拿到新 token）
    await page.route('**/api/v1/auth/refresh', async (route) => {
      refreshCount++;
      await route.continue();
    });

    // 兩個不同 endpoint：首次 401 模擬 concurrent 過期，retry 時放行
    await page.route('**/api/v1/articles/me*', async (route) => {
      if (!articleFirstCalled.fired) {
        articleFirstCalled.fired = true;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'A0005', message: 'Token 已過期', data: null }),
        });
      } else {
        await route.continue();
      }
    });
    await page.route('**/api/v1/users/me', async (route) => {
      if (!userFirstCalled.fired) {
        userFirstCalled.fired = true;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'A0005', message: 'Token 已過期', data: null }),
        });
      } else {
        await route.continue();
      }
    });

    // 透過 dev backdoor __apiClient 觸發兩個真並行 axios.get
    const result = await page.evaluate(async () => {
      const apiClient = (window as unknown as Record<string, { get: (url: string) => Promise<unknown> }>).__apiClient;
      const results = await Promise.allSettled([
        apiClient.get('/api/v1/articles/me'),
        apiClient.get('/api/v1/users/me'),
      ]);
      return results.map((r) => r.status);
    });

    // 兩個 axios.get 都應因 retry 成功而 fulfilled
    expect(result).toEqual(['fulfilled', 'fulfilled']);

    // /auth/refresh 應只被叫一次（isRefreshing flag + failedQueue 生效）
    expect(refreshCount).toBe(1);
  });

  /**
   * A8 強化：refresh 也回 401 時應 logout (清 store + 清 cookie) 並 redirect /login。
   */
  test('A8 強化: refresh 失敗應 logout 並 redirect /login', async ({ page, context }) => {
    const author = getCredentials('author');

    // 先正常登入並停在已登入頁，讓 __apiClient 有 valid access token
    await page.goto('/login');
    await page.getByTestId('auth-login-field-email').fill(author.email);
    await page.getByTestId('auth-login-field-password').fill(author.password);
    await page.getByTestId('auth-login-submit').click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'));
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // mock /auth/refresh 永遠 401（模擬 refresh token 失效）
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'A0005', message: 'Refresh token invalid', data: null }),
      });
    });

    // mock 目標 API 永遠 401（refresh 失敗後不應再 retry）
    let articleCallCount = 0;
    await page.route('**/api/v1/articles/me*', async (route) => {
      articleCallCount++;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'A0005', message: 'Token expired', data: null }),
      });
    });

    // 透過 __apiClient 觸發 401，避免 page.goto full reload 重置 Pinia state
    // 走 interceptor 完整路徑：401 → refresh → refresh 401 → authStore.logout → /auth/logout → 清 cookie
    const logoutResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/logout'),
      { timeout: 10000 }
    );
    const result = await page.evaluate(async () => {
      const apiClient = (window as unknown as Record<string, { get: (url: string) => Promise<unknown> }>).__apiClient;
      try {
        await apiClient.get('/api/v1/articles/me');
        return 'unexpected-success';
      } catch (e) {
        return 'rejected-as-expected';
      }
    });
    expect(result).toBe('rejected-as-expected');

    // 等 /auth/logout 完成（authStore.logout 內 fire-and-forget）
    await logoutResponsePromise;

    // refreshToken cookie 應已清空
    const cookies = await context.cookies();
    const refreshCookie = cookies.find((c) => c.name === 'refreshToken');
    expect(refreshCookie?.value ?? '').toBe('');

    // refresh 失敗後不應再 retry articles/me
    expect(articleCallCount).toBe(1);

    // 觸發 navigation 讓 router guard 看見 unauthenticated → 應導 /login
    await page.evaluate(() => {
      const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router;
      return router.push('/my-articles');
    });
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');

    // navbar 應顯示 guest 狀態
    await expect(page.getByTestId('navbar-login-btn')).toBeVisible({ timeout: 5000 });
  });

  test('A8: refresh token 也過期（cookie 清空）→ redirect 到 /login', async ({ page, context }) => {
    const author = getCredentials('author')
    await loginUI(page, author.email, author.password)

    // 清 cookies (refresh token 沒了) + 把 access token 設成 invalid
    await context.clearCookies()
    await page.evaluate(() => {
      const w = window as unknown as PiniaWindow
      w.__pinia.state.value.auth.accessToken = 'invalid.token.payload'
    })

    // 訪 protected page → axios 401 → refresh fail → store logout (token 清空)
    await page.evaluate(() => {
      const w = window as unknown as PiniaWindow
      return w.__router.push('/my-articles')
    })

    // 等 logout 完成 (accessToken 變 null)
    await page.waitForFunction(() => {
      const w = window as unknown as PiniaWindow
      return w.__pinia.state.value.auth.accessToken === null
    }, { timeout: 8000 })

    // 再次嘗試 protected navigation → router guard 偵測 unauthenticated → redirect /login
    await page.evaluate(() => {
      const w = window as unknown as PiniaWindow
      return w.__router.push('/settings')
    })
    await page.waitForURL(/\/login/, { timeout: 5000 })
  })
})
