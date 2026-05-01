import { test, expect } from '../fixtures/auth';
import { getCredentials } from '../fixtures/auth';

test.describe('A 域 logout (A9)', () => {
  test('A9: 登入後點 logout, cookie 清空, redirect /, 再訪 /editor 被導去 /login', async ({ page, context }) => {
    const author = getCredentials('author');

    // 登入
    await page.goto('/login');
    await page.getByTestId('auth-login-field-email').fill(author.email);
    await page.getByTestId('auth-login-field-password').fill(author.password);
    await page.getByTestId('auth-login-submit').click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 });

    // 確認登入完成
    await expect(page.getByTestId('navbar-user-greeting')).toBeVisible();
    const cookiesBefore = await context.cookies();
    expect(cookiesBefore.find((c) => c.name === 'refreshToken')).toBeDefined();

    // 點登出
    const logoutResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST',
    );
    await page.getByTestId('navbar-logout-btn').click();
    const resp = await logoutResponse;
    expect(resp.status()).toBeLessThan(400);

    // 等 redirect /
    await page.waitForURL('/', { timeout: 5000 });

    // 確認 navbar 切回 guest
    await expect(page.getByTestId('navbar-login-btn')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('navbar-user-greeting')).not.toBeVisible();

    // refreshToken cookie 應已清空
    const cookiesAfter = await context.cookies();
    const refreshCookie = cookiesAfter.find((c) => c.name === 'refreshToken');
    expect(refreshCookie?.value ?? '').toBe('');

    // 試訪受保護路由：應被導去 /login
    await page.goto('/editor');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});
