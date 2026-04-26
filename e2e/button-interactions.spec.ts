import { test, expect } from './fixtures/base'

test.describe('按鈕互動 — 色彩對比度（WCAG AA）', () => {
  // WCAG 色彩對比度計算函式
  const getLuminance = (r: number, g: number, b: number) => {
    const toLinear = (x: number) => {
      const v = x / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  }

  const getContrastRatio = (rgb1: number[], rgb2: number[]) => {
    const l1 = getLuminance(rgb1[0] ?? 0, rgb1[1] ?? 0, rgb1[2] ?? 0)
    const l2 = getLuminance(rgb2[0] ?? 0, rgb2[1] ?? 0, rgb2[2] ?? 0)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  const parseRGB = (colorStr: string): number[] | null => {
    // transparent 或 alpha=0 → 視為無背景，回傳 null
    if (colorStr === 'transparent' || /rgba\([^)]*,\s*0\s*\)/.test(colorStr)) return null
    const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    return m ? [parseInt(m[1] ?? '0'), parseInt(m[2] ?? '0'), parseInt(m[3] ?? '0')] : null
  }

  test('分類按鈕未選中狀態：色彩對比度符合 WCAG AA（≥ 4.5）', async ({
    page,
    articleListPage,
  }) => {
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()

    // 取得「Frontend」按鈕（未選中狀態）的 computed color
    const colorInfo = await page.locator('button', { hasText: 'Frontend' }).first().evaluate((btn) => {
      const style = window.getComputedStyle(btn)
      const bodyStyle = window.getComputedStyle(document.body)
      return {
        textColor: style.color,
        bgColor: style.backgroundColor,
        pageBgColor: bodyStyle.backgroundColor,
      }
    })

    const textRGB = parseRGB(colorInfo.textColor)
    const bgRGB = parseRGB(colorInfo.bgColor)
    const pageBgRGB = parseRGB(colorInfo.pageBgColor)

    // 如果按鈕背景透明（parseRGB 回傳 null），使用頁面背景色計算對比度
    const effectiveBg = bgRGB ?? pageBgRGB ?? [231, 231, 231]
    const contrastRatio = textRGB ? getContrastRatio(textRGB, effectiveBg) : 0

    // BUG-007：修復前此測試失敗（1.14），修復後應 >= 4.5
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
  })

  test('分頁按鈕未選中狀態：色彩對比度符合 WCAG AA（≥ 4.5）', async ({
    page,
    articleListPage,
  }) => {
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()

    // 確保在 Grid 模式且有多頁
    const page2Btn = page.getByRole('button', { name: '2' })
    const hasPage2 = await page2Btn.isVisible().catch(() => false)
    if (!hasPage2) {
      test.skip()
      return
    }

    const colorInfo = await page2Btn.evaluate((btn) => {
      const style = window.getComputedStyle(btn)
      const pageBgColor = window.getComputedStyle(document.body).backgroundColor
      return { textColor: style.color, bgColor: style.backgroundColor, pageBgColor }
    })

    const textRGB = parseRGB(colorInfo.textColor)
    const effectiveBg = parseRGB(colorInfo.bgColor) ?? parseRGB(colorInfo.pageBgColor) ?? [231, 231, 231]
    const contrastRatio = textRGB ? getContrastRatio(textRGB, effectiveBg) : 0

    expect(contrastRatio).toBeGreaterThanOrEqual(4.5)
  })
})

test.describe('按鈕互動 — 返回頂部（BUG-001）', () => {
  test('點擊返回頂部按鈕後頁面不跳轉（headless Chromium 不執行 smooth scroll，不驗證 scrollY）', async ({
    page,
    articleListPage,
    articleDetailPage,
  }) => {
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()
    await articleListPage.articleCards.first().click()
    await articleDetailPage.waitForArticleLoaded()

    await expect(articleDetailPage.endOfArticle).toBeVisible()
    await expect(articleDetailPage.scrollToTopButton).toBeVisible()

    // 確認按鈕存在且可點擊，不因跳頁而失敗
    const urlBefore = page.url()
    await articleDetailPage.scrollToTopButton.click()
    expect(page.url()).toBe(urlBefore)
  })
})

test.describe('按鈕互動 — 手機底部導覽', { tag: '@mobile' }, () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('搜尋 tab 點擊後導向 /search 頁面', async ({
    page,
    mobileBottomNav,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await mobileBottomNav.clickSearchTab()

    await expect(page).toHaveURL('/search')
  })

  test('首頁 tab 導向 /', async ({ page, mobileBottomNav }) => {
    await page.goto('/articles')
    await mobileBottomNav.clickHomeTab()
    await expect(page).toHaveURL('/')
  })

  test('文章 tab 導向 /articles', async ({ page, mobileBottomNav }) => {
    await page.goto('/')
    await mobileBottomNav.clickArticlesTab()
    await expect(page).toHaveURL('/articles')
  })

  test('未登入點「我的」導向 /login', async ({ page, mobileBottomNav }) => {
    await page.goto('/')
    await mobileBottomNav.clickProfileTab()
    await expect(page).toHaveURL('/login')
  })

  test('ThemeSwitcher 在手機版應可見（BUG-005）', async ({ page, themeSwitcher }) => {
    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    // BUG-005：修復前此測試失敗（ThemeSwitcher 被 hidden md:flex 隱藏）
    // DOM 中有兩個 ThemeSwitcher（mobile/desktop），取第一個（mobile）確認可見
    await expect(page.getByTestId('navbar-theme-toggle').first()).toBeVisible()
  })
})

test.describe('按鈕互動 — 響應式版面', () => {
  test('文章詳情頁在 320px viewport 無水平溢出（BUG-003）', async ({
    page,
    articleListPage,
    articleDetailPage,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 })

    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()
    await articleListPage.articleCards.first().click()
    await articleDetailPage.waitForArticleLoaded()

    const hasHScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )

    // BUG-003：修復前此測試失敗（scrollWidth = 416 > 320）
    expect(hasHScroll).toBe(false)
  })
})
