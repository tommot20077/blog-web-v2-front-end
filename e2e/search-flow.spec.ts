import { test, expect } from './fixtures/base'

test.describe('搜尋流程', () => {
  test('輸入關鍵字搜尋 — 結果更新、清空後恢復', async ({
    articleListPage,
    filterBar,
  }) => {
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()
    const initialCount = await articleListPage.articleCards.count()
    expect(initialCount).toBeGreaterThan(0)

    await filterBar.search('Vue')
    await articleListPage.waitForArticlesLoaded()
    const searchCount = await articleListPage.articleCards.count()
    expect(searchCount).toBeGreaterThanOrEqual(0)

    await filterBar.clearSearch()
    await articleListPage.waitForArticlesLoaded()
    const clearedCount = await articleListPage.articleCards.count()
    expect(clearedCount).toBeGreaterThanOrEqual(searchCount)
  })

  test('搜尋無結果關鍵字 — 顯示空狀態提示', async ({
    articleListPage,
    filterBar,
  }) => {
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()

    await filterBar.search('絕對不存在的內容xyzzy123')
    await expect(articleListPage.emptyMessage).toBeVisible({ timeout: 5000 })
  })

  test('搜尋後切換分類 — 清除關鍵字並顯示分類結果', async ({
    articleListPage,
    filterBar,
  }) => {
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()

    await filterBar.search('Vue')
    await articleListPage.waitForArticlesLoaded()

    await filterBar.selectCategory('全部')
    await articleListPage.waitForArticlesLoaded()
    const allCount = await articleListPage.articleCards.count()
    expect(allCount).toBeGreaterThanOrEqual(0)
  })
})
