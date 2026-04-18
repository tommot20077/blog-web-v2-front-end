import { test, expect, AUTHOR_CREDENTIALS } from './fixtures/auth'

test.describe('認證流程', () => {
  test('錯誤密碼登入 → 顯示 toast 錯誤訊息', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder('請輸入 Email').fill(AUTHOR_CREDENTIALS.email)
    await page.getByPlaceholder('請輸入密碼').fill('WrongPassword999')
    await page.getByRole('button', { name: /^登入$/ }).click()

    await expect(page.getByText('帳號或密碼錯誤')).toBeVisible({ timeout: 5000 })
  })

  test('登入成功 → navbar 顯示用戶名稱問候語', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder('請輸入 Email').fill(AUTHOR_CREDENTIALS.email)
    await page.getByPlaceholder('請輸入密碼').fill(AUTHOR_CREDENTIALS.password)
    await page.getByRole('button', { name: /^登入$/ }).click()

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })

    await expect(page.getByText('你好, Yuan!')).toBeVisible({ timeout: 5000 })
  })

  test('已登入後訪問 /login（guestOnly 路由）→ 重導至首頁', async ({ page }) => {
    // 先完成登入
    await page.goto('/login')
    await page.getByPlaceholder('請輸入 Email').fill(AUTHOR_CREDENTIALS.email)
    await page.getByPlaceholder('請輸入密碼').fill(AUTHOR_CREDENTIALS.password)
    await page.getByRole('button', { name: /^登入$/ }).click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })

    // 嘗試透過 SPA 路由導航至 /login（保留 Pinia 狀態）
    await page.evaluate(() => {
      const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
      return router.push('/login')
    })

    // guestOnly guard 應將已登入用戶重導至 /
    await expect(page).toHaveURL('/', { timeout: 5000 })
  })

  test('登出後 navbar 顯示「登入 / 註冊」連結', async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.getByPlaceholder('請輸入 Email').fill(AUTHOR_CREDENTIALS.email)
    await page.getByPlaceholder('請輸入密碼').fill(AUTHOR_CREDENTIALS.password)
    await page.getByRole('button', { name: /^登入$/ }).click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })
    await expect(page.getByText('你好, Yuan!')).toBeVisible({ timeout: 5000 })

    // 點擊登出按鈕
    await page.getByRole('button', { name: /登出/ }).click()

    // navbar 應回到「登入 / 註冊」
    await expect(page.getByRole('link', { name: /登入/ })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('你好, Yuan!')).not.toBeVisible()
  })
})
