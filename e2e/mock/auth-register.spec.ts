import { test, expect } from '@playwright/test'
import { AuthRegisterPage } from '../pages/auth-register.page'
import { AUTHOR_CREDENTIALS } from '../fixtures/auth'

test.describe('註冊流程', () => {
  // D1「右欄原地切換」：註冊成功後刻意不跳頁、也不再用一閃即逝的 toast，
  // 改由 RegisterSuccess.vue 在右欄原地顯示持久的成功畫面（見 RegisterView.vue 的註解）。
  test('成功註冊後右欄原地切換為成功畫面並帶出收件信箱', async ({ page }) => {
    const registerPage = new AuthRegisterPage(page)
    await registerPage.goto()

    const ts = Date.now()
    const email = `newuser-${ts}@test.com`
    await registerPage.register(email, `testuser${ts}`, `NewUser${ts}`, 'Password1!')

    const success = page.getByTestId('auth-register-success')
    await expect(success).toBeVisible({ timeout: 5000 })
    await expect(success).toContainText('帳號已建立。')
    await expect(success).toContainText('我們寄了一封驗證信到')

    // 停在原頁、表單被成功畫面取代（而不是跳去 /login）
    await expect(page).toHaveURL('/register')
    await expect(registerPage.submitBtn).toBeHidden()

    // 使用者要知道驗證信寄到哪個信箱，所以剛註冊的 email 必須原封不動帶進成功畫面
    await expect(page.getByTestId('auth-register-success-email')).toHaveText(email)

    // 成功畫面自己提供後續動作：重寄驗證信，以及仍可自行前往登入頁
    await expect(page.getByTestId('auth-register-success-resend')).toBeEnabled()
    await page.getByTestId('auth-register-success-login').click()
    await expect(page).toHaveURL('/login')
  })

  test('使用已存在的 Email 註冊顯示錯誤 toast', async ({ page }) => {
    const registerPage = new AuthRegisterPage(page)
    await registerPage.goto()

    await registerPage.register(AUTHOR_CREDENTIALS.email, 'someuser', 'SomeNick', 'Password1!')

    await expect(page.getByText(/已被註冊/)).toBeVisible({ timeout: 5000 })
  })

  test('點「已有帳號？登入」連結導至登入頁', async ({ page }) => {
    const registerPage = new AuthRegisterPage(page)
    await registerPage.goto()

    await registerPage.loginLink.click()

    await expect(page).toHaveURL('/login')
  })
})
