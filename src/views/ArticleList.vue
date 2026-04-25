<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { articleService, type ArticleItem } from '../api/articleService'

const articles = ref<ArticleItem[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const gridPage = ref(1)
const itemsPerPageGrid = 6
const maxGridPages = ref(1)
const listPage = ref(1)
const itemsPerPageList = 5
const isLoading = ref(false)
const isLoadingMore = ref(false)
const noMoreData = ref(false)

const categories = ['全部', 'Frontend', 'Backend', 'DevOps', 'UI/UX', 'Life']
const activeCategory = ref('全部')
const sortOrder = ref<'latest' | 'popular' | 'commented'>('latest')
const filterParams = ref({ category: '全部' })

const fetchArticles = async (isLoadMore = false) => {
  const currentMode = viewMode.value
  const page = currentMode === 'grid' ? gridPage.value : listPage.value
  const size = currentMode === 'grid' ? itemsPerPageGrid : itemsPerPageList
  if (isLoadMore) { isLoadingMore.value = true } else { isLoading.value = true }
  try {
    const result = await articleService.getArticles(page, size, filterParams.value.category, '')
    if (currentMode === 'grid') {
      articles.value = result.records
      maxGridPages.value = result.pages
    } else {
      if (isLoadMore) { articles.value.push(...result.records) } else { articles.value = result.records }
      noMoreData.value = page >= result.pages || result.records.length === 0
    }
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const selectCategory = (cat: string) => { activeCategory.value = cat; applyFilter() }
const toggleMode = (mode: 'grid' | 'list') => {
  viewMode.value = mode; gridPage.value = 1; listPage.value = 1; noMoreData.value = false; fetchArticles()
}
const applyFilter = () => {
  filterParams.value = { category: activeCategory.value }; gridPage.value = 1; listPage.value = 1; noMoreData.value = false; fetchArticles()
}
const goToPage = (n: number) => {
  if (n < 1 || n > maxGridPages.value) return
  gridPage.value = n; fetchArticles(); window.scrollTo({ top: 0, behavior: 'smooth' })
}
const loadNextPage = () => {
  if (isLoadingMore.value || noMoreData.value || viewMode.value === 'grid') return
  listPage.value += 1; fetchArticles(true)
}

function formatDate(d: string) {
  if (!d) return ''
  const p = d.slice(0, 10).split('-')
  return p.length === 3 ? `${p[0]} · ${p[1]} · ${p[2]}` : d.slice(0, 10)
}

const observerTarget = ref<HTMLElement | null>(null)
let ioObserver: IntersectionObserver | null = null

onMounted(() => {
  fetchArticles()
  ioObserver = new IntersectionObserver(
    (entries) => { if (entries[0].isIntersecting && !isLoading.value && !isLoadingMore.value) loadNextPage() },
    { rootMargin: '150px' }
  )
  if (observerTarget.value) ioObserver.observe(observerTarget.value)
})
onUnmounted(() => { ioObserver?.disconnect() })
</script>

<template>
  <section class="art-page" data-testid="articles-root">
    <div class="wrap">
      <div class="art-page-head">
        <h1>Articles.</h1>
        <p class="lede">設計、前端與緩慢思考的記錄。</p>
      </div>

      <div class="art-page-body">
        <!-- Sidebar rail -->
        <aside>
          <div class="art-rail" data-testid="articles-filter-bar">
            <div class="art-rail-head"><span>FILTERS</span></div>

            <div class="art-rail-group">
              <h5>Date</h5>
              <div class="art-radio-row">
                <button class="art-chip active">Any</button>
                <button class="art-chip">Last 30</button>
                <button class="art-chip">Last 90</button>
                <button class="art-chip">This year</button>
              </div>
            </div>

            <div class="art-rail-group">
              <h5>Category</h5>
              <div>
                <label
                  v-for="cat in categories"
                  :key="cat"
                  class="art-check"
                  @click.prevent="selectCategory(cat)"
                >
                  <input type="checkbox" :checked="activeCategory === cat" readonly />
                  <span class="box" />
                  <span class="l">{{ cat }}</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main -->
        <div class="art-page-main">
          <!-- Toolbar -->
          <div class="art-toolbar">
            <div class="art-tb-left">
              <span class="art-tb-count">{{ articles.length }}<em>ARTICLES</em></span>
            </div>
            <div class="art-tb-right">
              <div class="art-seg" data-testid="articles-sort-select">
                <button :class="{ active: sortOrder === 'latest' }" @click="sortOrder = 'latest'">Latest</button>
                <button :class="{ active: sortOrder === 'popular' }" @click="sortOrder = 'popular'">Popular</button>
                <button :class="{ active: sortOrder === 'commented' }" @click="sortOrder = 'commented'">Most commented</button>
              </div>
              <div class="art-seg art-seg-icon">
                <button :class="{ active: viewMode === 'grid' }" title="網格與分頁模式" @click="toggleMode('grid')">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button :class="{ active: viewMode === 'list' }" title="無限捲動清單模式" @click="toggleMode('list')">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="art-grid" data-testid="articles-loading">
            <div v-for="i in 6" :key="i" class="sk-pulse" style="height:260px" />
          </div>

          <!-- Grid view -->
          <div v-else-if="viewMode === 'grid' && articles.length > 0" class="art-grid">
            <RouterLink
              v-for="(article, i) in articles"
              :key="article.uuid"
              :to="`/articles/${article.uuid}`"
            >
              <article class="art-card-g" :data-testid="'articles-card-' + i">
                <span class="art-card-thumb" :data-tag="article.tags?.[0] ?? ''" />
                <div class="art-card-body">
                  <div class="art-card-meta">
                    <span>{{ article.tags?.[0] ?? 'Article' }}</span>
                    <span>·</span>
                    <span>{{ formatDate(article.publishedAt) }}</span>
                  </div>
                  <h4><a>{{ article.title }}</a></h4>
                  <p>{{ article.summary }}</p>
                  <div class="art-card-foot">
                    <span>{{ article.authorNickname }}</span>
                    <span>{{ article.viewCount }} views</span>
                  </div>
                </div>
              </article>
            </RouterLink>
          </div>

          <!-- List view -->
          <div v-else-if="viewMode === 'list' && articles.length > 0" class="art-list">
            <RouterLink
              v-for="(article, i) in articles"
              :key="article.uuid"
              :to="`/articles/${article.uuid}`"
              class="art-row"
            >
              <span class="art-row-n">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="art-row-thumb" :data-tag="article.tags?.[0] ?? ''" />
              <article class="art-row-body" :data-testid="'articles-card-' + i">
                <div class="art-row-meta">
                  <span>{{ article.tags?.[0] ?? 'Article' }}</span>
                  <span>{{ formatDate(article.publishedAt) }}</span>
                </div>
                <h3><a>{{ article.title }}</a></h3>
                <p>{{ article.summary }}</p>
              </article>
              <div class="art-row-stats">
                <span>{{ article.viewCount }} views</span>
                <span>{{ article.likeCount }} ♡</span>
              </div>
            </RouterLink>
          </div>

          <!-- Empty -->
          <div v-else-if="!isLoading" class="es-wrap" data-testid="articles-empty-state">
            <div class="es-icon">∅</div>
            <h3 class="es-title">沒有找到符合條件的文章。</h3>
            <p class="es-sub">試著放寬條件，或清除目前的篩選。</p>
          </div>

          <!-- Pagination -->
          <div v-if="viewMode === 'grid' && maxGridPages > 1 && !isLoading" class="art-pagination">
            <button class="page-btn" @click="goToPage(gridPage - 1)" :disabled="gridPage === 1">←</button>
            <button
              v-for="page in maxGridPages"
              :key="page"
              class="page-btn"
              :class="{ active: gridPage === page }"
              @click="goToPage(page)"
            >{{ page }}</button>
            <button class="page-btn" @click="goToPage(gridPage + 1)" :disabled="gridPage === maxGridPages">→</button>
          </div>

          <!-- Infinite scroll sentinel -->
          <div
            v-show="viewMode === 'list' && articles.length > 0"
            ref="observerTarget"
            class="art-sentinel"
          >
            <div v-if="isLoadingMore" class="sk-pulse" style="width:120px;height:8px;border-radius:4px;" />
            <span v-else-if="noMoreData" class="mono" style="color:var(--muted-2);font-size:11px;letter-spacing:.14em;text-transform:uppercase;">已經到底囉！</span>
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
</style>
