import { test, expect } from '../fixtures/mock-app'

test.describe('mock E2E controls', () => {
  test('resetMockStateInApp 清空收藏狀態', async ({
    page,
    loginAs,
    resetMockStateInApp,
    seedBookmark,
  }) => {
    await resetMockStateInApp()
    await loginAs('reader')
    await seedBookmark('a-2025-01')

    await page.goto('/bookmarks')
    await expect(page.getByText('Vue 3.5 的 useTemplateRef')).toBeVisible()

    await resetMockStateInApp()
    await page.goto('/bookmarks')
    await expect(page.getByText('目前沒有收藏文章')).toBeVisible()
  })
})
