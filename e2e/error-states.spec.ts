import { test, expect } from './fixtures/auth'

test.describe('錯誤狀態與存取保護', () => {
  test('訪問不存在的文章顯示 404 空狀態，點按鈕返回列表', async ({ page }) => {
    await page.goto('/articles/uuid-that-does-not-exist')

    await expect(page.getByText('找不到該篇文章（404）')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('🏜️')).toBeVisible()

    await page.getByRole('button', { name: '返回列表頁面' }).click()
    await expect(page).toHaveURL('/articles')
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
