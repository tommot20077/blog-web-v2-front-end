import { test, expect, AUTHOR_CREDENTIALS } from '../fixtures/auth'

test.describe('認證流程', () => {
  test('錯誤密碼登入 → 顯示 toast 錯誤訊息', async ({ page }) => {
    await page.goto('/login')

    await page.getByTestId('auth-login-field-email').fill(AUTHOR_CREDENTIALS.email)
    await page.getByTestId('auth-login-field-password').fill('WrongPassword999')
    await page.getByTestId('auth-login-submit').click()

    await expect(page.getByText('帳號或密碼錯誤')).toBeVisible({ timeout: 5000 })
  })

  test('登入成功 → navbar 顯示用戶名稱問候語', async ({ page }) => {
    await page.goto('/login')

    await page.getByTestId('auth-login-field-email').fill(AUTHOR_CREDENTIALS.email)
    await page.getByTestId('auth-login-field-password').fill(AUTHOR_CREDENTIALS.password)
    await page.getByTestId('auth-login-submit').click()

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })

    // Use testid + partial match to be tolerant of different nicknames across environments
    await expect(page.getByTestId('navbar-user-greeting')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('navbar-user-greeting')).toContainText('你好')
  })

  test('已登入後訪問 /login（guestOnly 路由）→ 重導至首頁', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('auth-login-field-email').fill(AUTHOR_CREDENTIALS.email)
    await page.getByTestId('auth-login-field-password').fill(AUTHOR_CREDENTIALS.password)
    await page.getByTestId('auth-login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })

    await page.evaluate(() => {
      const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
      return router.push('/login')
    })

    await expect(page).toHaveURL('/', { timeout: 5000 })
  })

  test('登出後 navbar 顯示「登入 / 註冊」連結', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('auth-login-field-email').fill(AUTHOR_CREDENTIALS.email)
    await page.getByTestId('auth-login-field-password').fill(AUTHOR_CREDENTIALS.password)
    await page.getByTestId('auth-login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })
    await expect(page.getByTestId('navbar-user-greeting')).toBeVisible({ timeout: 5000 })

    await page.getByTestId('navbar-logout-btn').click()

    await expect(page.getByTestId('navbar-login-btn')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('navbar-user-greeting')).not.toBeVisible()
  })
})
