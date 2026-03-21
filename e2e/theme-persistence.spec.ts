import { test, expect } from './fixtures/base'

test.describe('主題偏好持久化', () => {
  test('切換深色模式後，跨頁面導航和重新載入都維持偏好', async ({
    page,
    themeSwitcher,
    navigationBar,
  }) => {
    // --- 進入首頁，預設為 light ---
    await page.goto('/')
    expect(await themeSwitcher.getTheme()).toBe('light')

    // --- 切換主題 → dark ---
    await themeSwitcher.toggle()
    expect(await themeSwitcher.getTheme()).toBe('dark')

    // --- 導航至文章列表 → 仍為 dark ---
    await navigationBar.navigateToArticles()
    await expect(page).toHaveURL('/articles')
    expect(await themeSwitcher.getTheme()).toBe('dark')

    // --- 重新載入頁面 → 仍為 dark（localStorage 持久化）---
    await page.reload()
    expect(await themeSwitcher.getTheme()).toBe('dark')

    // --- 再次切換 → 回到 light ---
    await themeSwitcher.toggle()
    expect(await themeSwitcher.getTheme()).toBe('light')
  })
})
