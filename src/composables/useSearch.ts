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
  const results = ref<GroupedResults>({ articles: [], tags: [], total: 0 })
  const recentSearches = ref<string[]>([])

  const hasQuery = computed(() => !!debouncedQuery.value.trim())
  const hasResults = computed(() => results.value.total > 0)

  // Load popular tags and recent searches on init
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

  // Search when debouncedQuery changes
  let saveRecentTimer: ReturnType<typeof setTimeout> | null = null
  watch(debouncedQuery, async (val) => {
    const q = val.trim()
    if (!q) {
      results.value = { articles: [], tags: [], total: 0 }
      return
    }
    isLoading.value = true
    try {
      const articlesPage = await searchService.search({ q, size: 30 })
      const articles = articlesPage.records
      // Tags: client-side filter from hot tags
      const ql = q.toLowerCase()
      const tags = popularTags.value.filter(t => t.name.toLowerCase().includes(ql))
      results.value = { articles, tags, total: articles.length + tags.length }
    } catch {
      results.value = { articles: [], tags: [], total: 0 }
    } finally {
      isLoading.value = false
    }

    // Save to recent after 1200ms on stable query of ≥ 2 chars
    if (saveRecentTimer) clearTimeout(saveRecentTimer)
    if (q.length >= 2) {
      saveRecentTimer = setTimeout(() => {
        addRecent(q)
        recentSearches.value = loadRecent()
      }, 1200)
    }
  })

  function clearQuery() { query.value = '' }
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
