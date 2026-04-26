import type { ArticleItem } from '../api/articleService'

function makeArticle(overrides: Partial<ArticleItem> = {}): ArticleItem {
  return {
    uuid: 'a1',
    title: 'Test article',
    summary: 'summary',
    coverImageUrl: null,
    authorNickname: 'Yuan',
    viewCount: 100,
    likeCount: 10,
    commentCount: 5,
    publishedAt: '2026-04-01',
    tags: ['vue 3', 'frontend'],
    ...overrides,
  }
}

describe('useArticleFilters', () => {
  const loadFilters = async () => {
    vi.resetModules()
    const { useArticleFilters } = await import('./useArticleFilters')
    return useArticleFilters()
  }

  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  // ── tag 多選 ──────────────────────────────────────────────────────────────

  it('toggleTag 加入新 tag', async () => {
    const { selTags, toggleTag } = await loadFilters()
    toggleTag('vue 3')
    expect(selTags.value).toContain('vue 3')
  })

  it('toggleTag 再次點擊已選 tag 則移除', async () => {
    const { selTags, toggleTag } = await loadFilters()
    toggleTag('vue 3')
    toggleTag('vue 3')
    expect(selTags.value).not.toContain('vue 3')
  })

  it('可同時選多個 tag', async () => {
    const { selTags, toggleTag } = await loadFilters()
    toggleTag('vue 3')
    toggleTag('tdd')
    expect(selTags.value).toHaveLength(2)
    expect(selTags.value).toContain('tdd')
  })

  // ── category 多選 ─────────────────────────────────────────────────────────

  it('toggleCat 加入新 category', async () => {
    const { selCats, toggleCat } = await loadFilters()
    toggleCat('frontend')
    expect(selCats.value).toContain('frontend')
  })

  it('toggleCat 再次點擊則移除', async () => {
    const { selCats, toggleCat } = await loadFilters()
    toggleCat('frontend')
    toggleCat('frontend')
    expect(selCats.value).toHaveLength(0)
  })

  // ── author 多選 ───────────────────────────────────────────────────────────

  it('toggleAuthor 加入作者', async () => {
    const { selAuthors, toggleAuthor } = await loadFilters()
    toggleAuthor('Yuan')
    expect(selAuthors.value).toContain('Yuan')
  })

  // ── date range ────────────────────────────────────────────────────────────

  it('setDateRange 更新 dateRange', async () => {
    const { dateRange, setDateRange } = await loadFilters()
    setDateRange('30')
    expect(dateRange.value).toBe('30')
  })

  it('初始 dateRange 為 any', async () => {
    const { dateRange } = await loadFilters()
    expect(dateRange.value).toBe('any')
  })

  // ── sort ──────────────────────────────────────────────────────────────────

  it('初始 sort 為 latest', async () => {
    const { sort } = await loadFilters()
    expect(sort.value).toBe('latest')
  })

  it('setSort 更新 sort 並存 localStorage', async () => {
    const { sort, setSort } = await loadFilters()
    setSort('popular')
    expect(sort.value).toBe('popular')
    expect(localStorage.getItem('blog.art.sort')).toBe('popular')
  })

  // ── view / paging 持久化 ──────────────────────────────────────────────────

  it('初始 view 為 grid', async () => {
    const { view } = await loadFilters()
    expect(view.value).toBe('grid')
  })

  it('setView 存到 localStorage', async () => {
    const { view, setView } = await loadFilters()
    setView('list')
    expect(view.value).toBe('list')
    expect(localStorage.getItem('blog.art.view')).toBe('list')
  })

  it('初次載入從 localStorage 恢復 view', async () => {
    localStorage.setItem('blog.art.view', 'list')
    const { view } = await loadFilters()
    expect(view.value).toBe('list')
  })

  it('初始 paging 為 infinite', async () => {
    const { paging } = await loadFilters()
    expect(paging.value).toBe('infinite')
  })

  it('setPaging 存到 localStorage', async () => {
    const { paging, setPaging } = await loadFilters()
    setPaging('pages')
    expect(paging.value).toBe('pages')
    expect(localStorage.getItem('blog.art.paging')).toBe('pages')
  })

  // ── clearAll ──────────────────────────────────────────────────────────────

  it('clearAll 清除所有 filter 狀態', async () => {
    const { selTags, selCats, selAuthors, dateRange, toggleTag, toggleCat, setDateRange, clearAll } = await loadFilters()
    toggleTag('vue 3')
    toggleCat('frontend')
    setDateRange('30')
    clearAll()
    expect(selTags.value).toHaveLength(0)
    expect(selCats.value).toHaveLength(0)
    expect(selAuthors.value).toHaveLength(0)
    expect(dateRange.value).toBe('any')
  })

  // ── totalActive ───────────────────────────────────────────────────────────

  it('totalActive 計算正確啟用的 filter 數量', async () => {
    const { totalActive, toggleTag, toggleCat, setDateRange } = await loadFilters()
    expect(totalActive.value).toBe(0)
    toggleTag('vue 3')
    expect(totalActive.value).toBe(1)
    toggleCat('frontend')
    setDateRange('30')
    expect(totalActive.value).toBe(3)
  })

  // ── filterAndSort ─────────────────────────────────────────────────────────

  it('無 filter 時 filterAndSort 回傳全部文章', async () => {
    const articles = [makeArticle({ uuid: 'a1' }), makeArticle({ uuid: 'a2' })]
    const { filterAndSort } = await loadFilters()
    expect(filterAndSort(articles)).toHaveLength(2)
  })

  it('tag filter 使用 AND 邏輯：文章必須含全部選中的 tag', async () => {
    const articles = [
      makeArticle({ uuid: 'a1', tags: ['vue 3', 'tdd'] }),
      makeArticle({ uuid: 'a2', tags: ['vue 3'] }),
      makeArticle({ uuid: 'a3', tags: ['tdd'] }),
    ]
    const { filterAndSort, toggleTag } = await loadFilters()
    toggleTag('vue 3')
    toggleTag('tdd')
    const result = filterAndSort(articles)
    expect(result).toHaveLength(1)
    expect(result[0].uuid).toBe('a1')
  })

  it('category filter 使用 OR 邏輯：符合任一 tag 即可', async () => {
    const articles = [
      makeArticle({ uuid: 'a1', tags: ['frontend'] }),
      makeArticle({ uuid: 'a2', tags: ['css'] }),
      makeArticle({ uuid: 'a3', tags: ['essay'] }),
    ]
    const { filterAndSort, toggleCat } = await loadFilters()
    toggleCat('frontend')
    toggleCat('css')
    const result = filterAndSort(articles)
    expect(result).toHaveLength(2)
  })

  it('category filter 大小寫不敏感：選 Frontend 可匹配 tag frontend（整合後端小寫 slug）', async () => {
    const articles = [
      makeArticle({ uuid: 'a1', tags: ['frontend'] }),
      makeArticle({ uuid: 'a2', tags: ['css'] }),
    ]
    const { filterAndSort, toggleCat } = await loadFilters()
    toggleCat('Frontend')
    const result = filterAndSort(articles)
    expect(result).toHaveLength(1)
    expect(result[0].uuid).toBe('a1')
  })

  it('sort popular 依 viewCount 降序', async () => {
    const articles = [
      makeArticle({ uuid: 'a1', viewCount: 100 }),
      makeArticle({ uuid: 'a2', viewCount: 500 }),
      makeArticle({ uuid: 'a3', viewCount: 200 }),
    ]
    const { filterAndSort, setSort } = await loadFilters()
    setSort('popular')
    const result = filterAndSort(articles)
    expect(result[0].uuid).toBe('a2')
    expect(result[1].uuid).toBe('a3')
    expect(result[2].uuid).toBe('a1')
  })

  it('sort commented 依 commentCount 降序', async () => {
    const articles = [
      makeArticle({ uuid: 'a1', commentCount: 5 }),
      makeArticle({ uuid: 'a2', commentCount: 20 }),
    ]
    const { filterAndSort, setSort } = await loadFilters()
    setSort('commented')
    const result = filterAndSort(articles)
    expect(result[0].uuid).toBe('a2')
  })

  it('sort latest 依 publishedAt 降序', async () => {
    const articles = [
      makeArticle({ uuid: 'a1', publishedAt: '2026-01-01' }),
      makeArticle({ uuid: 'a2', publishedAt: '2026-04-01' }),
    ]
    const { filterAndSort } = await loadFilters()
    const result = filterAndSort(articles)
    expect(result[0].uuid).toBe('a2')
  })

  it('date filter 30d 過濾掉舊文章', async () => {
    const now = new Date()
    const recent = new Date(now.getTime() - 10 * 86400000).toISOString().slice(0, 10)
    const old = new Date(now.getTime() - 60 * 86400000).toISOString().slice(0, 10)
    const articles = [
      makeArticle({ uuid: 'new', publishedAt: recent }),
      makeArticle({ uuid: 'old', publishedAt: old }),
    ]
    const { filterAndSort, setDateRange } = await loadFilters()
    setDateRange('30')
    const result = filterAndSort(articles)
    expect(result).toHaveLength(1)
    expect(result[0].uuid).toBe('new')
  })
})
