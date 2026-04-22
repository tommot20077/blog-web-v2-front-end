import { test, expect } from '@playwright/test'
import { AuthRegisterPage } from './pages/auth-register.page'
import { AUTHOR_CREDENTIALS } from './fixtures/auth'

test.describe('註冊流程', () => {
  test('成功註冊後重導至登入頁並顯示成功 toast', async ({ page }) => {
    const registerPage = new AuthRegisterPage(page)
    await registerPage.goto()

    await registerPage.register(
      `newuser-${Date.now()}@test.com`,
      `testuser${Date.now()}`,
      'NewUser',
      'Password1!',
    )

    await expect(page.getByText('註冊成功！請至信箱驗證您的帳號')).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })

  test('使用已存在的 Email 註冊顯示錯誤 toast', async ({ page }) => {
    const registerPage = new AuthRegisterPage(page)
    await registerPage.goto()

    await registerPage.register(AUTHOR_CREDENTIALS.email, 'someuser', 'SomeNick', 'Password1!')

    await expect(page.getByText('此 Email 已被註冊')).toBeVisible({ timeout: 5000 })
  })

  test('點「已有帳號？登入」連結導至登入頁', async ({ page }) => {
    const registerPage = new AuthRegisterPage(page)
    await registerPage.goto()

    await registerPage.loginLink.click()

    await expect(page).toHaveURL('/login')
  })
})
