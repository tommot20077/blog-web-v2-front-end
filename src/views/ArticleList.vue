<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { articleService, type ArticleItem } from '../api/articleService'
import { categoryService } from '../api/categoryService'
import { tagService, type TagDetailResponse } from '../api/tagService'
import type { CategoryOption } from '../types/editor'
import { useArticleFilters } from '../composables/useArticleFilters'

// ── Data（SEC-04 第 2 段：篩選／排序／分頁全在伺服器端，前端只持有「已載入」的紀錄）──────
const records     = ref<ArticleItem[]>([])
const total       = ref(0)
const totalPages  = ref(0)
const isLoading   = ref(false)   // 首頁／換頁／篩選變更的整頁載入
const isLoadingMore = ref(false) // infinite 模式往下追加
const loadMoreFailed = ref(false) // 追加失敗：顯示重試按鈕，不自動連打
const exhausted    = ref(false) // 後端對範圍內的頁回空（資料變動）：視為到底，不再請求
const page        = ref(1)       // pages 模式：目前頁；infinite 模式：已載入到第幾頁
const PER_PAGE    = 12

const {
  selTags, selCats, selAuthors, dateRange,
  sort, view, paging,
  toggleTag, toggleCat, toggleAuthor,
  setDateRange, setSort, setView, setPaging,
  clearAll, totalActive, listFilters,
} = useArticleFilters()

// ── Fetch ────────────────────────────────────────────────────────────────────
// 以序號保證只採用最新一次請求：快速切換條件時，較早送出的回應可能較晚抵達（含「載入下一頁」）。
// 任何新請求（換頁／篩選變更）都會讓先前未回的請求過期。
let fetchSeq = 0

function request(n: number) {
  return articleService.getArticles(n, PER_PAGE, '全部', '', listFilters.value)
}

/** 載入第 n 頁並取代目前紀錄（首次載入、換頁、篩選／排序／模式變更後） */
async function loadPage(n: number) {
  const seq = ++fetchSeq
  isLoading.value = true
  isLoadingMore.value = false
  loadMoreFailed.value = false
  exhausted.value = false
  try {
    const result = await request(n)
    if (seq !== fetchSeq) return
    records.value = result.records
    total.value = result.total
    totalPages.value = result.pages
    page.value = n
  } finally {
    if (seq === fetchSeq) isLoading.value = false
  }
}

/** 篩選條件或排序改變：清空已載入、回第 1 頁、重新請求 */
function reload() {
  records.value = []
  total.value = 0
  totalPages.value = 0
  page.value = 1
  return loadPage(1)
}

/**
 * infinite：追加下一頁；以 uuid 去重（翻頁間資料變動時 OFFSET 分頁可能重複）。
 * real service 失敗時不丟錯而是回 `{records:[], total:0, pages:0}`，所以空頁不能照單全收：
 * - 例外或 total=0 的空頁 → 視為失敗：保留 total／pages／page 與已載入紀錄，顯示重試按鈕
 * - total>0 的空頁（期間有文章下架，total 偏大）→ 視為到底：同樣不覆寫，但不再請求、不顯示重試
 */
async function loadMore() {
  if (isLoading.value || isLoadingMore.value || loadMoreFailed.value || exhausted.value) return
  if (records.value.length >= total.value || page.value >= totalPages.value) return
  const seq = ++fetchSeq
  const next = page.value + 1
  isLoadingMore.value = true
  try {
    const result = await request(next)
    if (seq !== fetchSeq) return
    if (result.records.length === 0) {
      if (result.total > 0) exhausted.value = true
      else loadMoreFailed.value = true
      return
    }
    const seen = new Set(records.value.map(a => a.uuid))
    records.value = [...records.value, ...result.records.filter(a => !seen.has(a.uuid))]
    total.value = result.total
    totalPages.value = result.pages
    page.value = next
  } catch {
    if (seq === fetchSeq) loadMoreFailed.value = true
  } finally {
    if (seq === fetchSeq) isLoadingMore.value = false
  }
}

function retryLoadMore() {
  loadMoreFailed.value = false
  loadMore()
}

// ── Categories（取自後端，以 slug 為值、名稱顯示）─────────────────────────────
const categoryOptions = ref<CategoryOption[]>([])
function categoryName(slug: string) {
  return categoryOptions.value.find(c => c.slug === slug)?.name ?? slug
}

// ── Tags（熱門標籤取自後端，以 slug 為值、名稱顯示）────────────────────────────
const HOT_TAG_LIMIT = 12
const hotTags = ref<TagDetailResponse[]>([])
// slug → 顯示名稱：來源為熱門標籤與使用者點過的文章標籤，供 active filters 顯示
const tagNames = ref<Record<string, string>>({})
function tagName(slug: string) {
  return tagNames.value[slug] ?? slug
}

// ── Derived ──────────────────────────────────────────────────────────────────
const visible = records

// 任一篩選或排序變更 → reload（同一個 tick 內多個變更，例如 clearAll，只會觸發一次）
watch([selTags, selCats, selAuthors, dateRange, sort], () => { reload() })

const DATE_OPTIONS = [
  { key: 'any', label: 'Any' },
  { key: '30',  label: 'Last 30' },
  { key: '90',  label: 'Last 90' },
  { key: '365', label: 'This year' },
] as const

function handleToggleTag(ref_: { name: string; slug: string }) {
  tagNames.value = { ...tagNames.value, [ref_.slug]: ref_.name }
  toggleTag(ref_.slug)
}
function handleRemoveTag(slug: string) { toggleTag(slug) }
function handleToggleCat(slug: string) { toggleCat(slug) }
// 保留給 W4F-b（AuthorMultiSelect 上線後使用）
function handleToggleAuthor(uuid: string) { toggleAuthor(uuid) }
function handleDateRange(r: 'any'|'30'|'90'|'365') { setDateRange(r) }
function handleSort(s: 'latest'|'popular'|'commented') { setSort(s) }
function handleView(v: 'grid'|'list') {
  setView(v)
  if (v === 'list') handlePaging('infinite')
}
function handlePaging(p: 'pages'|'infinite') {
  if (paging.value === p) return
  setPaging(p)
  reload()
}

/** 文章卡片上的標籤：有 slug 才能以後端 tags 參數篩選；缺 tagRefs 時退回純文字 */
function cardTags(article: ArticleItem) {
  return (article.tagRefs ?? []).slice(0, 2)
}

function goToPage(n: number) {
  if (n < 1 || n > totalPages.value || n === page.value) return
  loadPage(n)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Infinite scroll sentinel ─────────────────────────────────────────────────
const sentinel = ref<HTMLElement | null>(null)
let ioObserver: IntersectionObserver | null = null
const hasMore = computed(() =>
  !exhausted.value && records.value.length < total.value && page.value < totalPages.value)

onMounted(() => {
  loadPage(1)
  categoryService.getCategories()
    .then(list => { categoryOptions.value = list })
    .catch(() => { categoryOptions.value = [] })
  tagService.getHotTags(HOT_TAG_LIMIT)
    .then(list => {
      hotTags.value = list
      tagNames.value = { ...Object.fromEntries(list.map(t => [t.slug, t.name])), ...tagNames.value }
    })
    .catch(() => { hotTags.value = [] })
  ioObserver = new IntersectionObserver(([e]) => {
    if (!e) return
    if (e.isIntersecting && paging.value === 'infinite') loadMore()
  }, { rootMargin: '200px' })
  if (sentinel.value) ioObserver.observe(sentinel.value)
})
onUnmounted(() => ioObserver?.disconnect())

function formatDate(d: string) {
  if (!d) return ''
  const p = d.slice(0, 10).split('-')
  return p.length === 3 ? `${p[0]} · ${p[1]} · ${p[2]}` : d.slice(0, 10)
}
</script>

<template>
  <section class="art-page" data-testid="articles-root">
    <div class="wrap">
      <div class="art-page-head">
        <h1>Articles.</h1>
      </div>

      <div class="art-page-body">

        <!-- ── Rail sidebar ──────────────────────────────────────────────── -->
        <aside>
          <div class="art-rail" data-testid="articles-filter-bar">
            <div class="art-rail-head">
              <span>FILTERS</span>
              <button v-if="totalActive > 0" class="clear" @click="clearAll">Clear</button>
            </div>

            <!-- Date -->
            <div class="art-rail-group">
              <h5>Date</h5>
              <div class="art-radio-row">
                <button
                  v-for="opt in DATE_OPTIONS"
                  :key="opt.key"
                  class="art-chip"
                  :class="{ active: dateRange === opt.key }"
                  @click="handleDateRange(opt.key)"
                >{{ opt.label }}</button>
              </div>
            </div>

            <!-- Category（取自 /api/v1/categories，由後端篩選） -->
            <div class="art-rail-group">
              <h5>Category</h5>
              <div>
                <label
                  v-for="cat in categoryOptions"
                  :key="cat.slug"
                  class="art-check"
                  data-testid="category-option"
                  @click.prevent="handleToggleCat(cat.slug)"
                >
                  <input type="checkbox" :checked="selCats.includes(cat.slug)" readonly />
                  <span class="box" />
                  <span class="l">{{ cat.name }}</span>
                </label>
              </div>
            </div>

            <!-- Tags（熱門標籤，取自 /api/v1/tags/hot；連結用 slug） -->
            <div v-if="hotTags.length" class="art-rail-group">
              <h5>Tags</h5>
              <div class="art-tag-grid">
                <RouterLink
                  v-for="tag in hotTags"
                  :key="tag.slug"
                  class="art-tag"
                  :to="`/tags/${tag.slug}`"
                >
                  {{ tag.name }}
                </RouterLink>
              </div>
            </div>

            <!-- W4F-b: AuthorMultiSelect -->
          </div>
        </aside>

        <!-- ── Main ─────────────────────────────────────────────────────── -->
        <div class="art-page-main">

          <!-- Toolbar -->
          <div class="art-toolbar">
            <div class="art-tb-left">
              <span class="art-tb-count">
                {{ total }}<em>ARTICLES</em>
              </span>

              <!-- Active filters -->
              <div v-if="totalActive > 0" class="art-active-filters">
                <span v-for="t in selTags" :key="'t-'+t" class="art-af">
                  #{{ tagName(t) }}<button @click="handleRemoveTag(t)">×</button>
                </span>
                <span v-for="c in selCats" :key="'c-'+c" class="art-af">
                  {{ categoryName(c) }}<button @click="handleToggleCat(c)">×</button>
                </span>
                <span v-for="a in selAuthors" :key="'a-'+a" class="art-af">
                  @{{ a }}<button @click="handleToggleAuthor(a)">×</button>
                </span>
                <span v-if="dateRange !== 'any'" class="art-af">
                  {{ dateRange }}d<button @click="handleDateRange('any')">×</button>
                </span>
              </div>
            </div>

            <div class="art-tb-right">
              <!-- Sort -->
              <div class="art-seg" data-testid="articles-sort-select">
                <button :class="{ active: sort === 'latest' }"    @click="handleSort('latest')">Latest</button>
                <button :class="{ active: sort === 'popular' }"   @click="handleSort('popular')">Popular</button>
                <button :class="{ active: sort === 'commented' }" @click="handleSort('commented')">Most commented</button>
              </div>

              <!-- View -->
              <div class="art-seg art-seg-icon">
                <button :class="{ active: view === 'grid' }" title="網格視圖" @click="handleView('grid')">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button :class="{ active: view === 'list' }" title="無限捲動清單模式" @click="handleView('list')">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>

              <!-- Paging -->
              <div class="art-seg">
                <button :class="{ active: paging === 'pages' }"    @click="handlePaging('pages')">Pages</button>
                <button :class="{ active: paging === 'infinite' }" @click="handlePaging('infinite')">∞ Infinite</button>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isLoading && records.length === 0" class="art-grid" data-testid="articles-loading">
            <div v-for="i in 6" :key="i" class="sk-pulse" style="height:260px" />
          </div>

          <!-- Grid -->
          <div v-else-if="view === 'grid' && visible.length > 0" class="art-grid">
            <RouterLink
              v-for="(article, i) in visible"
              :key="article.uuid"
              :to="`/articles/${article.uuid}`"
            >
              <article class="art-card-g" :data-testid="'articles-card-' + i">
                <span
                  class="art-card-thumb"
                  :data-tag="article.coverImageUrl ? '' : (article.tags?.[0] ?? '')"
                  :style="article.coverImageUrl ? {
                    backgroundImage: `url(${article.coverImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  } : {}"
                />
                <div class="art-card-body">
                  <div class="art-card-meta">
                    <span>{{ article.tags?.[0] ?? 'Article' }}</span>
                    <span>·</span>
                    <span>{{ formatDate(article.publishedAt) }}</span>
                  </div>
                  <h4><a>{{ article.title }}</a></h4>
                  <p>{{ article.summary }}</p>
                  <div class="art-card-foot">
                    <div class="art-card-tags">
                      <button
                        v-for="tag in cardTags(article)"
                        :key="tag.slug"
                        class="mini-tag"
                        @click.prevent="handleToggleTag(tag)"
                      >#{{ tag.name }}</button>
                    </div>
                    <div class="art-card-stats">
                      <span>{{ article.viewCount }} views</span>
                      <span>{{ article.likeCount }} ♡</span>
                    </div>
                  </div>
                </div>
              </article>
            </RouterLink>
          </div>

          <!-- List -->
          <div v-else-if="view === 'list' && visible.length > 0" class="art-list">
            <RouterLink
              v-for="(article, i) in visible"
              :key="article.uuid"
              :to="`/articles/${article.uuid}`"
              class="art-row"
            >
              <span class="art-row-n">{{ String(i + 1).padStart(2, '0') }}</span>
              <span
                class="art-row-thumb"
                :data-tag="article.coverImageUrl ? '' : (article.tags?.[0] ?? '')"
                :style="article.coverImageUrl ? {
                  backgroundImage: `url(${article.coverImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : {}"
              />
              <article class="art-row-body" :data-testid="'articles-card-' + i">
                <div class="art-row-meta">
                  <span>{{ article.tags?.[0] ?? 'Article' }}</span>
                  <span>·</span>
                  <span>{{ formatDate(article.publishedAt) }}</span>
                </div>
                <h3><a>{{ article.title }}</a></h3>
                <p>{{ article.summary }}</p>
              </article>
              <div class="art-row-stats">
                <div><b>{{ article.viewCount }}</b><span>views</span></div>
                <div><b>{{ article.likeCount }}</b><span>likes</span></div>
                <div><b>{{ article.commentCount }}</b><span>replies</span></div>
              </div>
              <span class="art-row-arr">→</span>
            </RouterLink>
          </div>

          <!-- Empty -->
          <div v-else-if="!isLoading" class="es-wrap" data-testid="articles-empty-state">
            <div class="es-icon">∅</div>
            <h3 class="es-title">沒有符合條件的文章。</h3>
            <p class="es-sub">試著放寬條件，或清除目前的篩選。</p>
            <button class="es-cta" @click="clearAll">Clear all filters</button>
          </div>

          <!-- Pagination (pages mode) -->
          <div v-if="paging === 'pages' && totalPages > 0 && !(isLoading && records.length === 0)" class="art-pagination">
            <button class="page-btn" :disabled="page === 1" @click="goToPage(page - 1)">←</button>
            <button
              v-for="p in totalPages"
              :key="p"
              class="page-btn"
              :class="{ active: page === p }"
              @click="goToPage(p)"
            >{{ p }}</button>
            <button class="page-btn" :disabled="page === totalPages" @click="goToPage(page + 1)">→</button>
          </div>

          <!-- Infinite scroll sentinel -->
          <div
            v-show="paging === 'infinite' && visible.length > 0"
            ref="sentinel"
            class="art-sentinel"
          >
            <button v-if="loadMoreFailed" class="page-btn" @click="retryLoadMore">載入失敗，重試</button>
            <div v-else-if="hasMore" class="sk-pulse" style="width:100px;height:4px;" />
            <span v-else-if="records.length > 0" class="mono" style="font-size:11px;color:var(--ink-2);letter-spacing:.14em;text-transform:uppercase;">到底了</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.art-pagination {
  display: flex; justify-content: center; gap: 4px; margin-top: 3rem;
}
.page-btn {
  min-width: 36px; height: 36px; padding: 0 10px; border-radius: 8px;
  border: 1px solid var(--border); background: transparent; color: var(--ink-2);
  font-size: 13px; cursor: pointer; transition: all .15s; display: grid; place-items: center;
}
.page-btn:hover:not(:disabled) { background: var(--bg-sub); color: var(--ink); }
.page-btn.active { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.page-btn:disabled { opacity: .3; cursor: not-allowed; }
.art-sentinel {
  display: flex; justify-content: center; align-items: center; min-height: 4rem; margin-top: 2rem;
}
.mini-tag {
  font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--muted); border: 1px solid var(--divider); border-radius: 4px;
  padding: 2px 6px; background: transparent; cursor: pointer;
}
.mini-tag:hover { color: var(--accent); border-color: var(--accent); }
</style>
