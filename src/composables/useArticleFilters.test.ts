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

  // ── listFilters：UI 狀態 → 後端查詢參數 ────────────────────────────────────

  it('listFilters 預設：空篩選、sort=latest、不帶 publishedWithinDays', async () => {
    const { listFilters } = await loadFilters()
    expect(listFilters.value).toEqual({ tags: [], categorySlugs: [], authorUuids: [], sort: 'latest' })
    expect(listFilters.value).not.toHaveProperty('publishedWithinDays')
  })

  it('listFilters 對應：selTags→tags、selCats→categorySlugs、selAuthors→authorUuids、dateRange→publishedWithinDays、sort', async () => {
    const { listFilters, toggleTag, toggleCat, toggleAuthor, setDateRange, setSort } = await loadFilters()
    toggleTag('vue-3'); toggleCat('backend'); toggleAuthor('author-uuid-1'); setDateRange('90'); setSort('commented')
    expect(listFilters.value).toEqual({
      tags: ['vue-3'], categorySlugs: ['backend'], authorUuids: ['author-uuid-1'], publishedWithinDays: 90, sort: 'commented',
    })
  })

  // ── 多值上限（後端 MAX_VALUES_PER_FILTER = 20，超過回 400）────────────────────

  it('toggleTag 已選 20 個時不再加入第 21 個，但仍可取消既有的', async () => {
    const { selTags, toggleTag } = await loadFilters()
    for (let i = 0; i < 21; i++) toggleTag(`t${i}`)
    expect(selTags.value).toHaveLength(20)
    expect(selTags.value).not.toContain('t20')
    toggleTag('t0')
    expect(selTags.value).toHaveLength(19)
  })

  it('toggleCat 已選 20 個時不再加入', async () => {
    const { selCats, toggleCat } = await loadFilters()
    for (let i = 0; i < 21; i++) toggleCat(`c${i}`)
    expect(selCats.value).toHaveLength(20)
  })

  it('toggleAuthor 已選 20 個時不再加入', async () => {
    const { selAuthors, toggleAuthor } = await loadFilters()
    for (let i = 0; i < 21; i++) toggleAuthor(`u${i}`)
    expect(selAuthors.value).toHaveLength(20)
  })
})
