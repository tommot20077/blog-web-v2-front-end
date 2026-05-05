<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { articleService, type ArticleItem } from '../api/articleService'
import { useArticleFilters } from '../composables/useArticleFilters'

// ── Data ────────────────────────────────────────────────────────────────────
const allArticles  = ref<ArticleItem[]>([])
const isLoading    = ref(false)
const page         = ref(1)
const PER_PAGE     = 12

const {
  selTags, selCats, selAuthors, dateRange,
  sort, view, paging,
  toggleTag, toggleCat, toggleAuthor,
  setDateRange, setSort, setView, setPaging,
  clearAll, totalActive, filterAndSort,
} = useArticleFilters()

// ── Fetch (once, client-side) ────────────────────────────────────────────────
async function fetchAll() {
  isLoading.value = true
  try {
    const result = await articleService.getArticles(1, 1000, '全部', '')
    allArticles.value = result.records
  } finally {
    isLoading.value = false
  }
}

// ── Derived ──────────────────────────────────────────────────────────────────
const filtered = computed(() => filterAndSort(allArticles.value))

// Unique tags/authors from loaded articles
const availableTags = computed(() => {
  const s = new Set<string>()
  allArticles.value.forEach(a => a.tags.forEach(t => s.add(t)))
  return [...s].slice(0, 12)
})
const availableAuthors = computed(() => {
  const s = new Set<string>()
  allArticles.value.forEach(a => s.add(a.authorNickname))
  return [...s]
})

// Paging
const totalPages = computed(() => Math.ceil(filtered.value.length / PER_PAGE))
const visible = computed(() => {
  if (paging.value === 'pages') {
    return filtered.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
  }
  return filtered.value.slice(0, page.value * PER_PAGE)
})

// Reset page on filter/sort change
function resetPage() { page.value = 1 }

const DATE_OPTIONS = [
  { key: 'any', label: 'Any' },
  { key: '30',  label: 'Last 30' },
  { key: '90',  label: 'Last 90' },
  { key: '365', label: 'This year' },
] as const

function handleToggleTag(t: string) { toggleTag(t); resetPage() }
function handleToggleCat(c: string) { toggleCat(c); resetPage() }
function handleToggleAuthor(a: string) { toggleAuthor(a); resetPage() }
function handleDateRange(r: 'any'|'30'|'90'|'365') { setDateRange(r); resetPage() }
function handleSort(s: 'latest'|'popular'|'commented') { setSort(s); resetPage() }
function handleView(v: 'grid'|'list') {
  setView(v)
  if (v === 'list') setPaging('infinite')
}
function handlePaging(p: 'pages'|'infinite') { setPaging(p); resetPage() }

function goToPage(n: number) {
  if (n < 1 || n > totalPages.value) return
  page.value = n
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Infinite scroll sentinel ─────────────────────────────────────────────────
const sentinel = ref<HTMLElement | null>(null)
let ioObserver: IntersectionObserver | null = null

onMounted(() => {
  fetchAll()
  ioObserver = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && paging.value === 'infinite' && page.value * PER_PAGE < filtered.value.length) {
      page.value++
    }
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
        <p class="lede">設計、前端與緩慢思考的記錄。</p>
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

            <!-- Category (uses tags as categories) -->
            <div class="art-rail-group">
              <h5>Category</h5>
              <div>
                <label
                  v-for="cat in ['Frontend', 'Backend', 'Essay', 'Design', 'DevOps']"
                  :key="cat"
                  class="art-check"
                  @click.prevent="handleToggleCat(cat)"
                >
                  <input type="checkbox" :checked="selCats.includes(cat)" readonly />
                  <span class="box" />
                  <span class="l">{{ cat }}</span>
                </label>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="availableTags.length" class="art-rail-group">
              <h5>Tags</h5>
              <div class="art-tag-grid">
                <RouterLink
                  v-for="tag in availableTags"
                  :key="tag"
                  class="art-tag"
                  :to="`/tags/${tag}`"
                >
                  {{ tag }}
                </RouterLink>
              </div>
            </div>

            <!-- Authors -->
            <div v-if="availableAuthors.length" class="art-rail-group">
              <h5>Author</h5>
              <div>
                <label
                  v-for="author in availableAuthors"
                  :key="author"
                  class="art-check"
                  @click.prevent="handleToggleAuthor(author)"
                >
                  <input type="checkbox" :checked="selAuthors.includes(author)" readonly />
                  <span class="box" />
                  <span class="l">{{ author }}</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <!-- ── Main ─────────────────────────────────────────────────────── -->
        <div class="art-page-main">

          <!-- Toolbar -->
          <div class="art-toolbar">
            <div class="art-tb-left">
              <span class="art-tb-count">
                {{ filtered.length }}<em>ARTICLES</em>
              </span>

              <!-- Active filters -->
              <div v-if="totalActive > 0" class="art-active-filters">
                <span v-for="t in selTags" :key="'t-'+t" class="art-af">
                  #{{ t }}<button @click="handleToggleTag(t)">×</button>
                </span>
                <span v-for="c in selCats" :key="'c-'+c" class="art-af">
                  {{ c }}<button @click="handleToggleCat(c)">×</button>
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
          <div v-if="isLoading" class="art-grid" data-testid="articles-loading">
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
                        v-for="tag in article.tags.slice(0, 2)"
                        :key="tag"
                        class="mini-tag"
                        @click.prevent="handleToggleTag(tag)"
                      >#{{ tag }}</button>
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
          <div v-if="paging === 'pages' && totalPages > 0 && !isLoading" class="art-pagination">
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
            <div v-if="page * PER_PAGE < filtered.length" class="sk-pulse" style="width:100px;height:4px;" />
            <span v-else-if="allArticles.length > 0" class="mono" style="font-size:11px;color:var(--muted-2);letter-spacing:.14em;text-transform:uppercase;">到底了</span>
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
