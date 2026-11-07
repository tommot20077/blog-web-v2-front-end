import { test, expect } from '../fixtures/mock-app'

// D3：每則頂層留言列表只帶前 3 則回覆，其餘用「載入更多回覆」分頁取得
const ARTICLE = 'a-2025-01'

test.describe('留言回覆分頁（載入更多）', () => {
  test.beforeEach(async ({ resetMockStateInApp }) => {
    await resetMockStateInApp()
  })

  test('5 則回覆：先顯示 3 則，載入更多後顯示全部且不重複，按鈕消失', async ({ page, seedCommentThread }) => {
    await seedCommentThread(ARTICLE, '父留言', ['回覆 1', '回覆 2', '回覆 3', '回覆 4', '回覆 5'])
    await page.goto(`/articles/${ARTICLE}`)

    const items = page.getByTestId('comment-item')
    await expect(items).toHaveCount(1 + 3)
    const more = page.getByTestId('comment-replies-load-more')
    await expect(more).toContainText('載入更多回覆（剩 2 則）')

    await more.click()

    await expect(items).toHaveCount(1 + 5)
    await expect(more).toHaveCount(0)
    const uuids = await items.evaluateAll(els => els.map(el => el.getAttribute('data-comment-uuid')))
    expect(new Set(uuids).size).toBe(uuids.length)
    await expect(items.nth(5)).toContainText('回覆 5')
  })

  test('展開後新增回覆：列表多一則且仍無載入更多', async ({ page, loginAs, seedCommentThread }) => {
    await loginAs('reader')
    await seedCommentThread(ARTICLE, '父留言', ['回覆 1', '回覆 2', '回覆 3', '回覆 4'])
    await page.goto(`/articles/${ARTICLE}`)

    await page.getByTestId('comment-replies-load-more').click()
    await expect(page.getByTestId('comment-item')).toHaveCount(1 + 4)

    await page.getByTestId('comment-reply-btn').first().click()
    const form = page.getByTestId('comment-reply-form')
    await form.locator('textarea').fill('回覆 5')
    await form.getByRole('button', { name: 'Reply' }).click()

    await expect(page.getByTestId('comment-item')).toHaveCount(1 + 5)
    await expect(page.getByTestId('comment-item').last()).toContainText('回覆 5')
    await expect(page.getByTestId('comment-replies-load-more')).toHaveCount(0)
  })

  test('未展開時回覆：新回覆直接可見，不被藏在載入更多後面（M1）', async ({ page, loginAs, seedCommentThread }) => {
    await loginAs('reader')
    await seedCommentThread(ARTICLE, '父留言', ['回覆 1', '回覆 2', '回覆 3', '回覆 4', '回覆 5'])
    await page.goto(`/articles/${ARTICLE}`)
    await expect(page.getByTestId('comment-item')).toHaveCount(1 + 3)

    await page.getByTestId('comment-reply-btn').first().click()
    const form = page.getByTestId('comment-reply-form')
    await form.locator('textarea').fill('我的新回覆')
    await form.getByRole('button', { name: 'Reply' }).click()

    await expect(page.getByTestId('comment-item')).toHaveCount(1 + 6)
    await expect(page.getByTestId('comment-item').last()).toContainText('我的新回覆')
    await expect(page.getByTestId('comment-replies-load-more')).toHaveCount(0)
  })

  test('載入失敗：顯示錯誤並可重試', async ({ page, seedCommentThread, mockApiFailure, clearMockApiFailures }) => {
    await seedCommentThread(ARTICLE, '父留言', ['回覆 1', '回覆 2', '回覆 3', '回覆 4'])
    await page.goto(`/articles/${ARTICLE}`)

    await mockApiFailure('**/api/v1/comments/*/replies*', { code: 'E_MOCK', message: '載入失敗', data: null }, 500)
    await page.getByTestId('comment-replies-load-more').click()
    await expect(page.getByTestId('comment-replies-error')).toBeVisible()
    await expect(page.getByTestId('comment-item')).toHaveCount(1 + 3)

    await clearMockApiFailures()
    await page.getByTestId('comment-replies-load-more').click()
    await expect(page.getByTestId('comment-item')).toHaveCount(1 + 4)
    await expect(page.getByTestId('comment-replies-error')).toHaveCount(0)
  })
})

// B5：留言數 = 未刪除的留言數，不含墓碑佔位
test.describe('留言數語意', () => {
  test.beforeEach(async ({ resetMockStateInApp }) => {
    await resetMockStateInApp()
  })

  test('刪除有回覆的頂層留言：計數減 1，墓碑仍顯示', async ({ page, loginAs, seedCommentThread }) => {
    await loginAs('admin')
    await seedCommentThread(ARTICLE, '父留言', ['回覆 1', '回覆 2'])
    await page.goto(`/articles/${ARTICLE}`)
    await expect(page.getByTestId('comment-total-count')).toContainText('3 comments')

    page.once('dialog', dialog => dialog.accept())
    await page.getByTestId('comment-item').first().getByTestId('comment-delete-btn').first().click()

    await expect(page.getByTestId('comment-total-count')).toContainText('2 comments')
    await expect(page.getByText('此留言已被')).toBeVisible()
    await expect(page.getByTestId('comment-item')).toHaveCount(1 + 2)
  })
})
