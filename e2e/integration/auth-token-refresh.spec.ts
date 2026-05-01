import { test, expect, type Page } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = 'http://localhost:9010'

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
   * 若 src/api/apiClient.ts 重構移除 processQueue, 此 spec 預期會壞，請對應調整。
   */
  test('A7 強化: concurrent 401 應只觸發一次 /auth/refresh', async ({ page }) => {
    const author = getCredentials('author');

    // 先正常登入
    await page.goto('/login');
    await page.getByTestId('auth-login-field-email').fill(author.email);
    await page.getByTestId('auth-login-field-password').fill(author.password);
    await page.getByTestId('auth-login-submit').click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'));

    let refreshCount = 0;
    let articleCallCount = 0;

    // 攔截 refresh：計數但放行
    await page.route('**/api/v1/auth/refresh', async (route) => {
      refreshCount++;
      await route.continue();
    });

    // 攔截目標 API：前兩次回 401（模擬兩個並行請求都遇到過期 token），後續放行
    await page.route('**/api/v1/articles/me*', async (route) => {
      articleCallCount++;
      if (articleCallCount <= 2) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'A0005', message: 'Token 已過期', data: null }),
        });
      } else {
        await route.continue();
      }
    });

    // 觸發兩個並行對 /articles/me 的請求
    await Promise.all([page.goto('/my-articles'), page.goto('/my-articles?status=DRAFT')]);

    // 等 page idle
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // 斷言 /auth/refresh 只被叫一次
    expect(refreshCount).toBe(1);
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
