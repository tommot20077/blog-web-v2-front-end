import { test, expect } from '@playwright/test'
import { AuthVerifyEmailPage } from '../pages/auth-verify-email.page'

const USE_MOCK = process.env.E2E_MOCK === '1'

test.describe('信箱驗證流程', () => {
  test('合法 token — 顯示驗證成功訊息', async ({ page }) => {
    test.skip(!USE_MOCK, 'token-based test requires mock mode (real mode needs DB-seeded token)')
    const verifyPage = new AuthVerifyEmailPage(page)
    await verifyPage.goto('mock-verify-token')

    await expect(verifyPage.successMessage).toBeVisible({ timeout: 5000 })
  })

  test('無效 token — 顯示驗證失敗訊息與重發按鈕', async ({ page }) => {
    const verifyPage = new AuthVerifyEmailPage(page)
    await verifyPage.goto('invalid-bad-token')

    await expect(verifyPage.failureMessage).toBeVisible({ timeout: 5000 })
    await expect(verifyPage.resendBtn).toBeVisible()
  })

  test('未帶 token — 顯示「無效的驗證連結」提示', async ({ page }) => {
    const verifyPage = new AuthVerifyEmailPage(page)
    await verifyPage.goto()

    await expect(verifyPage.noTokenMessage).toBeVisible({ timeout: 5000 })
  })
})
