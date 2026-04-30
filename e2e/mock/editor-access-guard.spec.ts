import { test, expect, AUTHOR_CREDENTIALS } from '../fixtures/auth'

test.describe('編輯器路由守衛', () => {
  test('未登入直接訪問 /editor 應重導至 /login', async ({ page }) => {
    await page.goto('/editor')
    await expect(page).toHaveURL(/\/login/)
  })

  test('未登入直接訪問 /editor/:uuid 應重導至 /login', async ({ page }) => {
    await page.goto('/editor/some-uuid')
    await expect(page).toHaveURL(/\/login/)
  })

  test('已登入 AUTHOR 可正常訪問 /editor', async ({
    page,
    loginAsAuthorAndGoToEditor,
    editorPage,
  }) => {
    await loginAsAuthorAndGoToEditor()
    await expect(page).toHaveURL('/editor')
    await expect(editorPage.titleInput).toBeVisible()
  })

  test('未登入訪問 /editor 後登入應被重導回 /editor', async ({ page }) => {
    // 未登入先訪問 /editor → redirect to /login（設定 returnUrl）
    await page.goto('/editor')
    await expect(page).toHaveURL(/\/login/)

    // 在 /login 頁登入
    await page.getByTestId('auth-login-field-email').fill(AUTHOR_CREDENTIALS.email)
    await page.getByTestId('auth-login-field-password').fill(AUTHOR_CREDENTIALS.password)
    await page.getByTestId('auth-login-submit').click()

    // 登入後路由器應重導回 /editor（returnUrl = '/editor'）
    await expect(page).toHaveURL('/editor', { timeout: 8000 })
  })
})
