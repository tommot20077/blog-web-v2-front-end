import { test, expect } from './fixtures/base'

/**
 * 情境 E：外觀設定跨頁面持久化
 * 情境 H：深色模式全站一致性
 */
test.describe('外觀設定持久化', () => {
  test('切換 Dark mode → html[data-theme="dark"]', async ({ page, themeSwitcher }) => {
    await page.goto('/')
    await themeSwitcher.toggleTheme()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('Dark mode 跨頁面持續', async ({ page, themeSwitcher }) => {
    await page.goto('/')
    await themeSwitcher.toggleTheme()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.goto('/articles')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.goto('/search')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('重新整理後從 localStorage 恢復 dark mode', async ({ page, themeSwitcher }) => {
    await page.goto('/')
    await themeSwitcher.toggleTheme()

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('切回 Light 後恢復', async ({ page, themeSwitcher }) => {
    await page.goto('/')
    await themeSwitcher.toggleTheme() // → dark
    await themeSwitcher.toggleTheme() // → light
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })
})

test.describe('useAppearance 初始化', () => {
  test('html 元素有正確的 data-* 屬性', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(300)

    // 應有 data-cursor、data-font、data-theme、data-accent
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-cursor', /ring|cross|dot|label|off/)
    await expect(html).toHaveAttribute('data-font', /space|inter|geist/)
    await expect(html).toHaveAttribute('data-theme', /light|dark/)
    await expect(html).toHaveAttribute('data-accent', /on|off/)
  })
})
