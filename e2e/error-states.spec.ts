import { test, expect } from './fixtures/auth'

test.describe('錯誤狀態與存取保護', () => {
  test('訪問不存在的文章顯示 404，點連結返回首頁', async ({ page }) => {
    await page.goto('/articles/uuid-that-does-not-exist')

    // Redirect to NotFoundView, which shows "找不到這一頁。"
    await expect(page.getByText('找不到這一頁。')).toBeVisible({ timeout: 5000 })

    // Click back to home link (回首頁 →)
    await page.getByRole('link', { name: '回首頁 →' }).click()
    await expect(page).toHaveURL('/')
  })

  test('未登入訪問 /my-articles 重導至登入頁', async ({ page }) => {
    await page.goto('/my-articles')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('未登入訪問 /admin/review 重導至登入頁', async ({ page }) => {
    await page.goto('/admin/review')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('一般作者訪問 /admin/review 重導至首頁（無權限）', async ({
    page,
    loginAsAuthorAndGoToEditor,
  }) => {
    // 先登入（AUTHOR 角色，非 ADMIN）
    await loginAsAuthorAndGoToEditor()

    // 透過 SPA 路由導航至 /admin/review
    await page.evaluate(() => {
      const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
      return router.push('/admin/review')
    })

    // 角色不符，路由守衛應重導至首頁
    await expect(page).toHaveURL('/', { timeout: 5000 })
  })
})
