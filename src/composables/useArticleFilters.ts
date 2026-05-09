import { ref, computed } from 'vue'
import type { ArticleItem } from '../api/articleService'

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

  function filterAndSort(articles: ArticleItem[]): ArticleItem[] {
    let r = [...articles]

    if (selTags.value.length)
      r = r.filter(a => selTags.value.every(t => a.tags.includes(t)))

    if (selCats.value.length)
      r = r.filter(a => {
        const cats = a.categories ?? []
        return cats.some(cat => selCats.value.some(c => c.toLowerCase() === cat.toLowerCase()))
      })

    if (selAuthors.value.length)
      r = r.filter(a => selAuthors.value.includes(a.authorNickname))

    if (dateRange.value !== 'any') {
      const days = parseInt(dateRange.value)
      const cutoff = Date.now() - days * 86400000
      r = r.filter(a => new Date(a.publishedAt).getTime() >= cutoff)
    }

    if (sort.value === 'popular')
      r.sort((a, b) => b.viewCount - a.viewCount)
    else if (sort.value === 'commented')
      r.sort((a, b) => b.commentCount - a.commentCount)
    else
      r.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

    return r
  }

  return {
    selTags, selCats, selAuthors, dateRange, sort, view, paging,
    toggleTag, toggleCat, toggleAuthor,
    setDateRange, setSort, setView, setPaging,
    clearAll, totalActive, filterAndSort,
  }
}
