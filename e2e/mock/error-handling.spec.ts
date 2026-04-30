import { test, expect } from '../fixtures/base'

/**
 * 情境 I：404 和錯誤處理
 */
test.describe('錯誤頁面處理', () => {
  test('訪問未定義路由顯示 404 頁面', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz')
    await expect(page.locator('.err-page')).toBeVisible()
    await expect(page.locator('.err-title')).toContainText('找不到')
  })

  test('404 頁面的「回首頁」按鈕導向首頁', async ({ page }) => {
    await page.goto('/nonexistent-page')
    await page.click('.err-cta')
    await expect(page).toHaveURL('/')
  })

  test('404 頁面有大背景數字', async ({ page }) => {
    await page.goto('/nonexistent-page')
    await expect(page.locator('.err-bg-num')).toBeVisible()
  })

  test('未登入訪問 /my-articles 被重導到 /login', async ({ page }) => {
    await page.goto('/my-articles')
    await expect(page).toHaveURL('/login')
  })

  test('未登入訪問 /editor 被重導到 /login', async ({ page }) => {
    await page.goto('/editor')
    await expect(page).toHaveURL('/login')
  })
})
