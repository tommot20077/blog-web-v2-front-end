import { test, expect } from '../fixtures/base'

test.describe('NotFoundView 升級 — 推薦文章與多 CTA', () => {
  test('訪問不存在路由，顯示推薦文章區塊', async ({ page }) => {
    await page.goto('/this-route-definitely-does-not-exist')
    await expect(page.getByText('找不到這一頁。')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="notfound-suggestions"]')).toBeVisible()
  })

  test('提供多個 CTA 入口（搜尋、Archive）', async ({ page }) => {
    await page.goto('/this-route-definitely-does-not-exist')
    await expect(page.locator('[data-testid="notfound-actions"]')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Tags Index — /tags', () => {
  test('可訪問並顯示標籤雲', async ({ page }) => {
    await page.goto('/tags')
    await expect(page.locator('[data-testid="tags-cloud"]')).toBeVisible({ timeout: 5000 })
  })

  test('顯示連載 series 區塊', async ({ page }) => {
    await page.goto('/tags')
    await expect(page.locator('[data-testid="tags-series"]')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Archive — /archive', () => {
  test('可訪問並顯示時間軸', async ({ page }) => {
    await page.goto('/archive')
    await expect(page.locator('[data-testid="archive-root"]')).toBeVisible({ timeout: 5000 })
  })

  test('按年份分組顯示文章', async ({ page }) => {
    await page.goto('/archive')
    await expect(page.locator('[data-testid="archive-year"]').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Server Error — /500', () => {
  test('顯示 500 錯誤頁面', async ({ page }) => {
    await page.goto('/500')
    await expect(page.locator('[data-testid="server-error-root"]')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Stats — /my-stats', () => {
  test('未登入訪問重導至登入頁', async ({ page }) => {
    await page.goto('/my-stats')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})
