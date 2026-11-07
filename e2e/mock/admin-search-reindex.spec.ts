import { test, expect } from '../fixtures/mock-app'

// D1：重建搜尋索引改為背景作業＋輪詢。mock 的作業約 5 秒完成（見 adminMockService 的 MOCK_REINDEX_*），
// 輪詢間隔 2 秒，所以第一次輪詢會看到 RUNNING 進度。

test.describe('Admin 重建搜尋索引（背景作業＋輪詢）', () => {
  test.beforeEach(async ({ resetMockStateInApp }) => {
    await resetMockStateInApp()
  })

  async function startReindex(page: import('@playwright/test').Page) {
    await page.getByTestId('admin-search-reindex-btn').click()
    await page.getByTestId('admin-search-confirm-confirm').click()
  }

  test('觸發重建 → 顯示已開始與進度 → 完成後顯示成功並解除按鈕', async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/admin/search')
    await expect(page.getByTestId('admin-search-last-reindex')).toBeVisible()

    await startReindex(page)

    await expect(page.getByText('已開始重建索引')).toBeVisible()
    await expect(page.getByTestId('admin-search-reindex-btn')).toBeDisabled()
    await expect(page.getByTestId('admin-search-progress')).toContainText(/\d+ \/ \d+/)

    await expect(page.getByText('索引重建完成')).toBeVisible()
    await expect(page.getByTestId('admin-search-progress')).toHaveCount(0)
    await expect(page.getByTestId('admin-search-reindex-btn')).toBeEnabled()
    await expect(page.getByTestId('admin-search-last-reindex')).toBeVisible()
  })

  test('重建失敗時以 error toast 顯示摘要並解除按鈕', async ({ page, loginAs, setMockReindexOutcome }) => {
    await loginAs('admin')
    await page.goto('/admin/search')
    await setMockReindexOutcome('FAILED')

    await startReindex(page)

    await expect(page.getByText('模擬重建失敗')).toBeVisible()
    await expect(page.getByTestId('admin-search-reindex-btn')).toBeEnabled()
    await expect(page.getByTestId('admin-search-progress')).toHaveCount(0)
  })

  test('後端回 409（A0501）時提示已有重建作業進行中', async ({ page, loginAs, mockApiFailure }) => {
    await loginAs('admin')
    await page.goto('/admin/search')
    await mockApiFailure(
      '/api/v1/admin/search/reindex',
      { code: 'A0501', message: '已有搜尋索引重建作業執行中', data: null },
      409,
    )

    await startReindex(page)

    await expect(page.getByText('已有重建作業進行中')).toBeVisible()
  })

  test('重建進行中離開再回到頁面，會自動接續顯示進度', async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/admin/search')
    await startReindex(page)
    await expect(page.getByTestId('admin-search-progress')).toBeVisible()

    await page.goto('/admin/review')
    await page.goto('/admin/search')

    await expect(page.getByTestId('admin-search-progress')).toBeVisible()
    await expect(page.getByTestId('admin-search-reindex-btn')).toBeDisabled()
  })
})
