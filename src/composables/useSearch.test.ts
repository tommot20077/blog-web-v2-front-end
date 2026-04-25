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
})
