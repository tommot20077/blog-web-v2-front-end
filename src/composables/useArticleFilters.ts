import { ref, computed } from 'vue'
import type { ArticleListFilters } from '../api/articleService'

type Sort = 'latest' | 'popular' | 'commented'
type View = 'grid' | 'list'
type Paging = 'infinite' | 'pages'
type DateRange = 'any' | '30' | '90' | '365'

function readLS(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return localStorage.getItem(key) ?? fallback
}

export function useArticleFilters() {
  const selTags    = ref<string[]>([])
  const selCats    = ref<string[]>([])
  const selAuthors = ref<string[]>([])
  const dateRange  = ref<DateRange>('any')
  const sort       = ref<Sort>(readLS('blog.art.sort', 'latest') as Sort)
  const view       = ref<View>(readLS('blog.art.view', 'grid') as View)
  const paging     = ref<Paging>(readLS('blog.art.paging', 'infinite') as Paging)

  const toggleTag    = (t: string) => selTags.value    = selTags.value.includes(t)    ? selTags.value.filter(x => x !== t)    : [...selTags.value, t]
  const toggleCat    = (c: string) => selCats.value    = selCats.value.includes(c)    ? selCats.value.filter(x => x !== c)    : [...selCats.value, c]
  const toggleAuthor = (a: string) => selAuthors.value = selAuthors.value.includes(a) ? selAuthors.value.filter(x => x !== a) : [...selAuthors.value, a]

  const setDateRange = (r: DateRange) => { dateRange.value = r }
  const setSort      = (s: Sort)      => { sort.value = s;   localStorage.setItem('blog.art.sort',   s) }
  const setView      = (v: View)      => { view.value = v;   localStorage.setItem('blog.art.view',   v) }
  const setPaging    = (p: Paging)    => { paging.value = p; localStorage.setItem('blog.art.paging', p) }

  const clearAll = () => {
    selTags.value = []; selCats.value = []; selAuthors.value = []; dateRange.value = 'any'
  }

  const totalActive = computed(() =>
    selTags.value.length + selCats.value.length + selAuthors.value.length +
    (dateRange.value !== 'any' ? 1 : 0)
  )

  /**
   * UI 狀態 → 後端 `GET /api/v1/articles` 查詢參數（SEC-04 第 2 段：篩選／排序全在伺服器端）。
   * selTags 存 slug、selCats 存分類 slug、selAuthors 存 authorUuid；dateRange 'any' 不帶 publishedWithinDays。
   */
  const listFilters = computed<ArticleListFilters>(() => {
    const f: ArticleListFilters = {
      tags: [...selTags.value],
      categorySlugs: [...selCats.value],
      authorUuids: [...selAuthors.value],
      sort: sort.value,
    }
    if (dateRange.value !== 'any') f.publishedWithinDays = parseInt(dateRange.value)
    return f
  })

  return {
    selTags, selCats, selAuthors, dateRange, sort, view, paging,
    toggleTag, toggleCat, toggleAuthor,
    setDateRange, setSort, setView, setPaging,
    clearAll, totalActive, listFilters,
  }
}
