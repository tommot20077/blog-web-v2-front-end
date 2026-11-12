import { ref, computed, type Ref } from 'vue'
import type { ArticleListFilters } from '../api/articleService'

/** 對應後端 MAX_VALUES_PER_FILTER */
export const MAX_VALUES_PER_FILTER = 20

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

  // 後端對 tags／categorySlug／authorUuids 各限 20 個，超過回 400（不截斷）；已達上限時不再加入，但仍可取消。
  const toggleIn = (list: Ref<string[]>, v: string) => {
    if (list.value.includes(v)) list.value = list.value.filter(x => x !== v)
    else if (list.value.length < MAX_VALUES_PER_FILTER) list.value = [...list.value, v]
  }
  const toggleTag    = (t: string) => toggleIn(selTags, t)
  const toggleCat    = (c: string) => toggleIn(selCats, c)
  const toggleAuthor = (a: string) => toggleIn(selAuthors, a)

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
