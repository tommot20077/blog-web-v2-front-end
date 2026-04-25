import { test, expect } from './fixtures/base'

test.describe('搜尋流程', () => {
  test('輸入關鍵字搜尋 — 顯示文章結果', async ({ searchPage }) => {
    await searchPage.goto()

    await searchPage.typeKeyword('Vue')
    await searchPage.waitForResults()

    const count = await searchPage.articleCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('搜尋無結果關鍵字 — 顯示無結果提示', async ({ searchPage }) => {
    await searchPage.goto()

    await searchPage.typeKeyword('絕對不存在的內容xyzzy123')
    await searchPage.waitForNoResult()

    await expect(searchPage.noResultState).toBeVisible()
  })

  test('清空關鍵字 — 回到初始狀態（無文章卡片）', async ({ searchPage }) => {
    await searchPage.goto()

    await searchPage.typeKeyword('Vue')
    await searchPage.waitForResults()

    await searchPage.clearSearch()
    await expect(searchPage.articleCards.first()).not.toBeVisible()
  })
})
