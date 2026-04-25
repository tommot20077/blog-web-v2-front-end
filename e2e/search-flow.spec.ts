import { test, expect } from './fixtures/base'

test.describe('搜尋流程', () => {
  test('輸入關鍵字搜尋 — 搜尋完成並顯示結果或無結果提示', async ({ searchPage }) => {
    await searchPage.goto()

    await searchPage.typeKeyword('Vue')
    await searchPage.waitForSearchComplete()

    // 搜尋完成：有結果（mock / ES 已索引）或無結果提示（ES 索引延遲）皆可接受
    const hasCards = await searchPage.articleCards.count() > 0
    const hasNoResult = await searchPage.noResultState.isVisible()
    expect(hasCards || hasNoResult).toBe(true)
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
    await searchPage.waitForSearchComplete()

    await searchPage.clearSearch()
    await expect(searchPage.articleCards.first()).not.toBeVisible()
  })
})
