import { test, expect } from '@playwright/test'
import { AuthResetPasswordPage } from './pages/auth-reset-password.page'

test.describe('重設密碼流程', () => {
  test('合法 token — 重設成功後重導至登入頁', async ({ page }) => {
    const resetPage = new AuthResetPasswordPage(page)
    await resetPage.goto('mock-reset-token')

    await resetPage.reset('NewPassword1!', 'NewPassword1!')

    await expect(page.getByText('密碼重設成功')).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })

  test('無效 token — 顯示 toast 錯誤訊息', async ({ page }) => {
    const resetPage = new AuthResetPasswordPage(page)
    await resetPage.goto('invalid-bad-token')

    await resetPage.reset('NewPassword1!', 'NewPassword1!')

    await expect(page.getByText('無效的重設密碼 token')).toBeVisible({ timeout: 5000 })
  })

  test('未帶 token 訪問 — 顯示「無效的重設連結」提示', async ({ page }) => {
    const resetPage = new AuthResetPasswordPage(page)
    await resetPage.goto()

    await expect(resetPage.invalidTokenMessage).toBeVisible({ timeout: 5000 })
    await expect(resetPage.submitBtn).not.toBeVisible()
  })
})
