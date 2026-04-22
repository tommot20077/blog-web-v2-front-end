import { test, expect } from '@playwright/test'
import { AuthForgotPasswordPage } from './pages/auth-forgot-password.page'
import { getCredentials } from './fixtures/auth'

test.describe('忘記密碼流程', () => {
  test('送出後顯示成功訊息，表單消失', async ({ page }) => {
    const forgotPage = new AuthForgotPasswordPage(page)
    await forgotPage.goto()

    const email = getCredentials('reader').email
    await forgotPage.submit(email)

    await expect(forgotPage.successMessage).toBeVisible({ timeout: 5000 })
    await expect(forgotPage.emailField).not.toBeVisible()
  })

  test('點「回到登入」連結導至登入頁', async ({ page }) => {
    const forgotPage = new AuthForgotPasswordPage(page)
    await forgotPage.goto()

    await forgotPage.loginLink.click()

    await expect(page).toHaveURL('/login')
  })
})
