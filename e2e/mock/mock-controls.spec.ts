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
    await loginAs('reader')
    await page.goto('/bookmarks')
    await expect(page.getByText('目前沒有收藏文章')).toBeVisible()
  })

  test('resetMockStateInApp 清掉登入狀態', async ({
    page,
    loginAs,
    resetMockStateInApp,
  }) => {
    await resetMockStateInApp()
    await loginAs('reader')
    await page.goto('/bookmarks')
    await expect(page.getByText('目前沒有收藏文章')).toBeVisible()

    await resetMockStateInApp()
    await page.goto('/bookmarks')

    await expect(page).toHaveURL(/\/login/)
  })

  test('expectAuthRedirect 可驗證受保護頁面導回登入', async ({
    expectAuthRedirect,
    resetMockStateInApp,
  }) => {
    await resetMockStateInApp()

    await expectAuthRedirect('/editor')
  })

  test('mockApiFailure 可讓 admin 待審核列表顯示載入失敗', async ({
    page,
    loginAs,
    mockApiFailure,
    resetMockStateInApp,
  }) => {
    await resetMockStateInApp()
    await loginAs('admin')
    await mockApiFailure(
      '**/api/v1/admin/articles/pending*',
      { code: 'E_ADMIN', message: '載入失敗', data: null },
      500,
    )

    await page.goto('/admin/review')

    await expect(page.getByText('載入待審核文章失敗，請稍後再試')).toBeVisible()
  })

  test('refreshCurrentRoute 會保留 mockApiFailure 並重新載入目前 admin route', async ({
    page,
    loginAs,
    mockApiFailure,
    refreshCurrentRoute,
    resetMockStateInApp,
  }) => {
    await resetMockStateInApp()
    await loginAs('admin')
    await page.goto('/admin/review')

    // 先等初次載入完成再註冊失敗。page.goto 在 app 內只是 router.push、不等資料載入；
    // mock 的失敗在「請求發出當下」判定，若初次載入的請求還沒發出就註冊，
    // 初次載入與重新整理會各失敗一次，畫面出現兩個相同的 toast（原本偶發的 strict mode violation）。
    await expect(page.getByTestId('admin-review-row-editor-pending-1')).toBeVisible()

    await mockApiFailure(
      '**/api/v1/admin/articles/pending*',
      { code: 'E_ADMIN', message: '載入失敗', data: null },
      500,
    )

    await refreshCurrentRoute()

    await expect(page.getByText('載入待審核文章失敗，請稍後再試')).toBeVisible()
  })
})
