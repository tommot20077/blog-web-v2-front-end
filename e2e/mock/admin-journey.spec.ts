import { test, expect } from '../fixtures/mock-app'

test.describe('Admin journey', () => {
  test.beforeEach(async ({ resetMockStateInApp }) => {
    await resetMockStateInApp()
  })

  test('admin 可通過文章且待審列表會移除該文章', async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/admin/review')

    const row = page.getByTestId('admin-review-row-editor-pending-1')
    await expect(row).toBeVisible()
    await expect(row).toContainText('Pinia 狀態管理待審')
    await page.getByTestId('admin-review-approve-editor-pending-1').click()

    await expect(page.getByText('文章已通過審核')).toBeVisible()
    await expect(row).not.toBeVisible()
  })

  test('admin 可退回文章且 author 看得到退回理由', async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/admin/review')

    const row = page.getByTestId('admin-review-row-editor-pending-2')
    await expect(row).toContainText('TypeScript 進階待審')
    await page.getByTestId('admin-review-reject-editor-pending-2').click()
    await page.getByPlaceholder('請輸入退回理由').fill('請補上範例程式碼')
    await row.getByRole('button', { name: '確認退回' }).click()
    await expect(page.getByText('文章已退回')).toBeVisible()

    await loginAs('author')
    await page.goto('/my-articles')
    await expect(page.getByText('TypeScript 進階待審')).toBeVisible()
    await expect(page.getByText('請補上範例程式碼')).toBeVisible()
  })

  test('待審列表空狀態與載入失敗狀態正常', async ({
    page,
    loginAs,
    mockApiFailure,
    refreshCurrentRoute,
  }) => {
    await loginAs('admin')
    await page.goto('/admin/review')
    await expect(page.locator('.admin-card')).toHaveCount(2)

    await page.getByTestId('admin-review-approve-editor-pending-1').click()
    await expect(page.getByTestId('admin-review-row-editor-pending-1')).not.toBeVisible()
    await page.getByTestId('admin-review-approve-editor-pending-2').click()
    await expect(page.getByTestId('admin-review-row-editor-pending-2')).not.toBeVisible()
    await expect(page.getByText('目前沒有待審核文章')).toBeVisible()

    await mockApiFailure('**/api/v1/admin/articles/pending*', { code: 'E_ADMIN', message: '載入失敗', data: null }, 500)
    await refreshCurrentRoute()
    await expect(page.getByText('載入待審核文章失敗，請稍後再試')).toBeVisible()
  })

  test('非 admin 不可進 admin review', async ({ page, loginAs, expectAuthRedirect }) => {
    await expectAuthRedirect('/admin/review')

    await loginAs('author')
    await page.goto('/admin/review')
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('toast-message').filter({ hasText: '權限不足' }).last()).toBeVisible()

    await loginAs('reader')
    await page.goto('/admin/review')
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('toast-message').filter({ hasText: '權限不足' }).last()).toBeVisible()
  })
})
