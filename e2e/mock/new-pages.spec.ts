import { test, expect } from '../fixtures/base'
import { getCredentials } from '../fixtures/auth'

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

  test('推薦文章為最新發佈的 4 篇（依 publishedAt desc 排序）', async ({ page }) => {
    await page.goto('/this-route-definitely-does-not-exist')
    await expect(page.locator('[data-testid="notfound-suggestions"]')).toBeVisible({ timeout: 5000 })
    const dates = await page.locator('[data-testid="notfound-suggestions"] .nf-d').allTextContents()
    expect(dates.length).toBe(4)
    // 第一篇日期應 >= 第二篇（MM.DD 字典排序在同年內 == 時間排序）
    expect(dates[0].localeCompare(dates[1])).toBeGreaterThanOrEqual(0)
    expect(dates[1].localeCompare(dates[2])).toBeGreaterThanOrEqual(0)
  })

  test('prefers-reduced-motion: glitch 動畫應停止', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/this-route-definitely-does-not-exist')
    await expect(page.getByText('找不到這一頁。')).toBeVisible({ timeout: 5000 })
    const animationName = await page.locator('.nf-glitch').evaluate(
      (el) => getComputedStyle(el).animationName
    )
    expect(animationName).toBe('none')
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

  test('點 tag chip 應導向 /tags/:slug（不可被 .prevent 阻擋）', async ({ page }) => {
    await page.goto('/tags')
    await expect(page.locator('[data-testid="tags-cloud"]')).toBeVisible({ timeout: 5000 })
    const firstChip = page.locator('[data-testid="tags-cloud"] a').first()
    await firstChip.click()
    await expect(page).toHaveURL(/\/tags\/[^/]+$/, { timeout: 5000 })
  })

  test('Tag cloud 中的標籤都對應 mock data 中存在的 tag', async ({ page }) => {
    await page.goto('/tags')
    await expect(page.locator('[data-testid="tags-cloud"]')).toBeVisible({ timeout: 5000 })
    // tag cloud 內的所有 chip 文字（去掉 # 前綴跟頻次數字）
    const chipTexts = await page.locator('[data-testid="tags-cloud"] a').allTextContents()
    // 應該至少含這些 mock data 必有的 tag
    const joined = chipTexts.join(' ')
    expect(joined).toContain('Vue')
    expect(joined).toContain('Frontend')
    expect(joined).toContain('Backend')
    expect(joined).toContain('Life')
    // 不應該再出現 mock data 沒有的 hard-coded tag
    expect(joined).not.toContain('Java')
    expect(joined).not.toContain('Spring')
    expect(joined).not.toContain('Design System')
  })

  test('Series 區塊 ONGOING count 排除已完結的 series', async ({ page }) => {
    await page.goto('/tags')
    await expect(page.locator('[data-testid="tags-series"]')).toBeVisible({ timeout: 5000 })
    const headerText = await page.locator('[data-testid="tags-series-header"]').textContent()
    // header 含 "3 ONGOING"（4 個 series 中 1 個完結，剩 3 個 ongoing）
    expect(headerText).toMatch(/\b3\s+ONGOING\b/i)
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

  test('每個 year group 內文章依 publishedAt desc 排序', async ({ page }) => {
    await page.goto('/archive')
    await expect(page.locator('[data-testid="archive-year"]').first()).toBeVisible({ timeout: 5000 })
    const firstYear = page.locator('[data-testid="archive-year"]').first()
    const dates = await firstYear.locator('.ar-date').allTextContents()
    expect(dates.length).toBeGreaterThan(1)
    // 同年內 MM.DD 字典序 desc 即為時間 desc
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i].localeCompare(dates[i + 1])).toBeGreaterThanOrEqual(0)
    }
  })

  test('archive row 是 keyboard-accessible link（含 href，可 tab 聚焦）', async ({ page }) => {
    await page.goto('/archive')
    await expect(page.locator('[data-testid="archive-root"]')).toBeVisible({ timeout: 5000 })
    const firstRow = page.locator('.ar-row').first()
    // 應該是 anchor，且有 href
    const tagName = await firstRow.evaluate((el) => el.tagName)
    expect(tagName).toBe('A')
    const href = await firstRow.getAttribute('href')
    expect(href).toMatch(/^\/articles\//)
  })
})

test.describe('Server Error — /500', () => {
  test('顯示 500 錯誤頁面', async ({ page }) => {
    await page.goto('/500')
    await expect(page.locator('[data-testid="server-error-root"]')).toBeVisible({ timeout: 5000 })
  })

  test('prefers-reduced-motion: glitch 動畫應停止', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/500')
    await expect(page.locator('[data-testid="server-error-root"]')).toBeVisible({ timeout: 5000 })
    const animationName = await page.locator('.se-glitch').evaluate(
      (el) => getComputedStyle(el).animationName
    )
    expect(animationName).toBe('none')
  })
})

test.describe('Stats — /my-stats', () => {
  test('未登入訪問重導至登入頁', async ({ page }) => {
    await page.goto('/my-stats')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  // 用 SPA router.push 而非 page.goto 避免 hard reload 清掉 pinia store
  async function loginAuthorAndPush(page: import('@playwright/test').Page, target: string) {
    const creds = getCredentials('author')
    await page.goto('/login')
    await page.getByTestId('auth-login-field-email').fill(creds.email)
    await page.getByTestId('auth-login-field-password').fill(creds.password)
    await page.getByTestId('auth-login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })
    await page.evaluate((path) => {
      const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
      return router.push(path)
    }, target)
  }

  test('已登入 AUTHOR 可進入並看到 stats-root', async ({ page }) => {
    await loginAuthorAndPush(page, '/my-stats')
    await expect(page.locator('[data-testid="stats-root"]')).toBeVisible({ timeout: 5000 })
  })

  test('切換 period（7d/30d/90d）會改變顯示的數據', async ({ page }) => {
    await loginAuthorAndPush(page, '/my-stats')
    await expect(page.locator('[data-testid="stats-root"]')).toBeVisible({ timeout: 5000 })

    // 抓 30d 預設下第一張卡的數值
    const cardN = page.locator('.st-card-n').first()
    const value30d = await cardN.textContent()

    // 切 7d，期望數值改變
    await page.locator('.st-period-btn', { hasText: '7d' }).click()
    const value7d = await cardN.textContent()
    expect(value7d).not.toBe(value30d)

    // 切 90d，期望數值再改變
    await page.locator('.st-period-btn', { hasText: '90d' }).click()
    const value90d = await cardN.textContent()
    expect(value90d).not.toBe(value7d)
  })
})
