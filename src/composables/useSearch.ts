import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { searchService } from '../api/searchService'
import { tagService } from '../api/tagService'
import type { SearchResult } from '../types/search'
import type { TagDetailResponse } from '../api/tagService'

const RECENT_KEY = 'blog.recentSearches'
const POPULAR_QUERIES = ['tailwind', 'vue 3', 'tdd', 'design systems', 'markdown', 'vitest']

interface GroupedResults {
  articles: SearchResult[]
  tags: TagDetailResponse[]
  total: number
}

export function useSearch(initialQuery = '') {
  const query = ref(initialQuery)
  const debouncedQuery = ref(initialQuery)
  const isLoading = ref(false)
  const popularTags = ref<TagDetailResponse[]>([])
  const articles = ref<SearchResult[]>([])
  const recentSearches = ref<string[]>([])

  // #7: tag 過濾改為 computed，同時響應 popularTags 與 debouncedQuery 的變化
  const filteredTags = computed<TagDetailResponse[]>(() => {
    const q = debouncedQuery.value.trim().toLowerCase()
    if (!q) return []
    return popularTags.value.filter(t => t.name.toLowerCase().includes(q))
  })

  const results = computed<GroupedResults>(() => ({
    articles: articles.value,
    tags: filteredTags.value,
    total: articles.value.length + filteredTags.value.length,
  }))

  const hasQuery = computed(() => !!debouncedQuery.value.trim())
  const hasResults = computed(() => results.value.total > 0)

  onMounted(async () => {
    recentSearches.value = loadRecent()
    popularTags.value = await tagService.getHotTags(20)
  })

  // Debounce query → debouncedQuery
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  watch(query, (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { debouncedQuery.value = val }, 220)
  })

  // #4: 用 onCleanup 取消過期請求，避免 race condition
  let saveRecentTimer: ReturnType<typeof setTimeout> | null = null
  watch(debouncedQuery, async (val, _old, onCleanup) => {
    const q = val.trim()
    if (!q) {
      articles.value = []
      return
    }

    let cancelled = false
    onCleanup(() => { cancelled = true })

    isLoading.value = true
    try {
      const articlesPage = await searchService.search({ q, size: 30 })
      if (!cancelled) {
        articles.value = articlesPage.records
      }
    } catch {
      if (!cancelled) {
        articles.value = []
      }
    } finally {
      if (!cancelled) {
        isLoading.value = false
      }
    }

    if (cancelled) return

    if (saveRecentTimer) clearTimeout(saveRecentTimer)
    if (q.length >= 2) {
      saveRecentTimer = setTimeout(() => {
        addRecent(q)
        recentSearches.value = loadRecent()
      }, 1200)
    }
  })

  // #6: clearQuery 同步清除 debouncedQuery、articles 與 pending timers
  function clearQuery() {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
    if (saveRecentTimer) { clearTimeout(saveRecentTimer); saveRecentTimer = null }
    query.value = ''
    debouncedQuery.value = ''
    articles.value = []
  }

  function clearRecent() {
    localStorage.removeItem(RECENT_KEY)
    recentSearches.value = []
  }

  function setQuery(q: string) { query.value = q }

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (saveRecentTimer) clearTimeout(saveRecentTimer)
  })

  return {
    query, debouncedQuery, isLoading,
    results, popularTags, recentSearches,
    hasQuery, hasResults,
    clearQuery, clearRecent, setQuery,
    POPULAR_QUERIES,
  }
}

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function addRecent(q: string) {
  const list = loadRecent().filter(x => x !== q)
  list.unshift(q)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)))
}
