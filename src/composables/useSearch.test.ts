import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { searchService } from '../api/searchService'
import { tagService } from '../api/tagService'

vi.mock('../api/searchService', () => ({
  searchService: {
    search: vi.fn(),
  },
}))

vi.mock('../api/tagService', () => ({
  tagService: {
    getHotTags: vi.fn(),
  },
}))

const mockTags = [
  { uuid: 't-1', name: 'vue', slug: 'vue', articleCount: 10 },
  { uuid: 't-2', name: 'tailwind', slug: 'tailwind', articleCount: 5 },
  { uuid: 't-3', name: 'react', slug: 'react', articleCount: 8 },
]

const mockArticlesPage = {
  records: [
    {
      articleUuid: 'a-1',
      title: 'Vue 3 Guide',
      summary: 'A guide to Vue 3',
      slug: 'vue-3-guide',
      authorNickname: 'Author',
      tagNames: ['vue'],
      publishedAt: '2026-01-01',
      viewCount: 100,
      likeCount: 10,
    },
  ],
  total: 1,
  size: 30,
  current: 1,
  pages: 1,
}

// Helper: mount a wrapper component so onMounted/onUnmounted lifecycle hooks fire
const mountWithUseSearch = async (initialQuery = '') => {
  vi.resetModules()
  const { useSearch } = await import('./useSearch')
  let result: ReturnType<typeof useSearch>

  const Wrapper = defineComponent({
    setup() {
      result = useSearch(initialQuery)
      return {}
    },
    template: '<div></div>',
  })

  const wrapper = mount(Wrapper)
  return { result: result!, wrapper }
}

describe('useSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    vi.mocked(tagService.getHotTags).mockResolvedValue(mockTags)
    vi.mocked(searchService.search).mockResolvedValue(mockArticlesPage)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('hasQuery is false initially', async () => {
    const { result } = await mountWithUseSearch()
    expect(result.hasQuery.value).toBe(false)
  })

  it('sets debouncedQuery after 220ms debounce when query changes', async () => {
    const { result } = await mountWithUseSearch()

    result.query.value = 'vue'
    await nextTick()

    // Not yet — debounce not elapsed
    expect(result.debouncedQuery.value).toBe('')

    vi.advanceTimersByTime(220)
    await nextTick()

    expect(result.debouncedQuery.value).toBe('vue')
  })

  it('calls searchService.search when debouncedQuery becomes non-empty', async () => {
    const { result } = await mountWithUseSearch()

    result.query.value = 'vue'
    await nextTick()
    vi.advanceTimersByTime(220)
    await nextTick()
    await flushPromises()

    expect(searchService.search).toHaveBeenCalledWith({ q: 'vue', size: 30 })
    expect(result.results.value.articles).toHaveLength(1)
  })

  it('client-side filters popularTags by query — matching tags appear in results', async () => {
    const { result, wrapper } = await mountWithUseSearch()

    // Flush onMounted so popularTags is loaded
    await flushPromises()

    result.query.value = 'vue'
    await nextTick()
    vi.advanceTimersByTime(220)
    await nextTick()
    await flushPromises()

    // 'vue' matches tag name 'vue', not 'tailwind' or 'react'
    expect(result.results.value.tags.map((t) => t.name)).toContain('vue')
    expect(result.results.value.tags.map((t) => t.name)).not.toContain('tailwind')

    wrapper.unmount()
  })

  it('clearQuery() resets query to empty string', async () => {
    const { result } = await mountWithUseSearch()

    result.query.value = 'something'
    await nextTick()
    vi.advanceTimersByTime(220)
    await nextTick()

    result.clearQuery()
    expect(result.query.value).toBe('')
  })

  it('clearRecent() clears localStorage and resets recentSearches', async () => {
    localStorage.setItem('blog.recentSearches', JSON.stringify(['vue', 'tailwind']))
    const { result } = await mountWithUseSearch()

    // Flush onMounted so recentSearches is loaded
    await flushPromises()
    expect(result.recentSearches.value).toHaveLength(2)

    result.clearRecent()

    expect(result.recentSearches.value).toHaveLength(0)
    expect(localStorage.getItem('blog.recentSearches')).toBeNull()
  })

  it('clearQuery() 立即重置 debouncedQuery 與 results（不等 debounce）', async () => {
    const { result } = await mountWithUseSearch()

    // 先讓 debouncedQuery 有值並有搜尋結果
    result.query.value = 'vue'
    await nextTick()
    vi.advanceTimersByTime(220)
    await nextTick()
    await flushPromises()
    expect(result.results.value.articles).toHaveLength(1)

    // clearQuery 後 debouncedQuery 與 results 應同步清除
    result.clearQuery()
    await nextTick()

    expect(result.query.value).toBe('')
    expect(result.debouncedQuery.value).toBe('')
    expect(result.results.value.articles).toHaveLength(0)
    expect(result.hasQuery.value).toBe(false)
  })

  it('race condition：舊請求結果不覆蓋新請求', async () => {
    let resolveFirst!: (v: typeof mockArticlesPage) => void
    let resolveSecond!: (v: typeof mockArticlesPage) => void

    const firstPage = { ...mockArticlesPage, records: [{ ...mockArticlesPage.records[0], title: 'First' }] }
    const secondPage = { ...mockArticlesPage, records: [{ ...mockArticlesPage.records[0], title: 'Second' }] }

    vi.mocked(searchService.search)
      .mockReturnValueOnce(new Promise(res => { resolveFirst = res }))
      .mockReturnValueOnce(new Promise(res => { resolveSecond = res }))

    const { result } = await mountWithUseSearch()

    // 發出第一個搜尋
    result.query.value = 'first'
    await nextTick()
    vi.advanceTimersByTime(220)
    await nextTick()

    // 發出第二個搜尋（在第一個回應前）
    result.query.value = 'second'
    await nextTick()
    vi.advanceTimersByTime(220)
    await nextTick()

    // 第二個先回應，然後第一個才回應
    resolveSecond(secondPage)
    await flushPromises()
    resolveFirst(firstPage)
    await flushPromises()

    // 最終結果應為第二個（second），不被第一個（first）覆蓋
    expect(result.results.value.articles[0]?.title).toBe('Second')
  })

  it('popularTags 載入後搜尋結果的 tags 自動更新', async () => {
    let resolveHotTags!: (v: typeof mockTags) => void
    vi.mocked(tagService.getHotTags).mockReturnValue(new Promise(res => { resolveHotTags = res }))

    const { result } = await mountWithUseSearch()

    // 在 popularTags 載入前先設定 query
    result.query.value = 'vue'
    await nextTick()
    vi.advanceTimersByTime(220)
    await nextTick()
    await flushPromises()

    // popularTags 尚未載入，tags 結果可能為空
    const tagsBeforeLoad = result.results.value.tags.length

    // 現在載入 popularTags
    resolveHotTags(mockTags)
    await flushPromises()

    // tags 結果應自動更新包含 'vue'
    expect(result.results.value.tags.map(t => t.name)).toContain('vue')
    expect(result.results.value.tags.length).toBeGreaterThan(tagsBeforeLoad)
  })

  it('does not call searchService after unmount when debounce is in flight', async () => {
    const { result, wrapper } = await mountWithUseSearch()

    // Set query which starts 220ms debounce timer
    result.query.value = 'vue'
    await nextTick()

    // Unmount before debounce completes (should clear timer via onUnmounted)
    wrapper.unmount()

    // Advance time past the debounce window
    vi.advanceTimersByTime(300)
    await nextTick()
    await flushPromises()

    // searchService.search should NOT have been called because timer was cleared on unmount
    expect(searchService.search).not.toHaveBeenCalled()
  })
})
