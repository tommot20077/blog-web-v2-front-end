import { test, expect } from './fixtures/fullstack-red'

test.describe('P0 full-stack red - auth lifecycle', () => {
  test('註冊後未驗證帳號不得透過 API 或 UI 登入', async ({
    backendUrl,
    page,
    request,
    waitForBackend,
  }) => {
    await waitForBackend()

    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`
    const email = `p0-auth-${unique}@test.local`
    const username = `p0auth${unique}`.slice(0, 30)
    const nickname = `P0 Auth ${unique.slice(-6)}`
    const password = 'AuthRed123!'

    await page.goto('/register')
    await page.getByTestId('auth-register-field-email').fill(email)
    await page.getByTestId('auth-register-field-username').fill(username)
    await page.getByTestId('auth-register-field-nickname').fill(nickname)
    await page.getByTestId('auth-register-field-password').fill(password)
    await page.getByTestId('auth-register-submit').click()

    await expect(page.locator('body')).toContainText(/註冊成功|信箱驗證|驗證您的帳號|verify/i, {
      timeout: 5000,
    })

    const loginBeforeVerification = await request.post(`${backendUrl}/api/v1/auth/login`, {
      data: { identifier: email, password },
    })
    expect(loginBeforeVerification.status()).toBeGreaterThanOrEqual(400)

    await page.goto('/login')
    await page.getByTestId('auth-login-field-email').fill(email)
    await page.getByTestId('auth-login-field-password').fill(password)
    await page.getByTestId('auth-login-submit').click()

    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('body')).toContainText(/未驗證|驗證|verify|email|信箱/i, {
      timeout: 5000,
    })
  })
})
