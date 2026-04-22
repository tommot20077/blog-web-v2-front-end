<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';
import { articleService, type ArticleItem } from '../api/articleService';
import { searchService } from '../api/searchService';

// ── article data ──────────────────────────────────────────────────────────────
const articles = ref<ArticleItem[]>([]);
const viewMode = ref<'grid' | 'list'>('grid');

const gridPage = ref(1);
const itemsPerPageGrid = 6;
const maxGridPages = ref(1);

const listPage = ref(1);
const itemsPerPageList = 5;

const isLoading = ref(false);
const isLoadingMore = ref(false);
const noMoreData = ref(false);

// ── filter bar state (inlined from FilterBar component) ───────────────────────
const categories = ['全部', 'Frontend', 'Backend', 'DevOps', 'UI/UX', 'Life'];
const activeCategory = ref('全部');
const keyword = ref('');
const sortOrder = ref<'latest' | 'popular' | 'commented'>('latest');

const filterParams = ref({ category: '全部', keyword: '' });

// ── core fetch logic ──────────────────────────────────────────────────────────
const fetchArticles = async (isLoadMore = false) => {
  const currentMode = viewMode.value;
  const page = currentMode === 'grid' ? gridPage.value : listPage.value;
  const size = currentMode === 'grid' ? itemsPerPageGrid : itemsPerPageList;

  if (isLoadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
  }

  try {
    let result: Awaited<ReturnType<typeof articleService.getArticles>>;
    const kw = filterParams.value.keyword;
    if (kw) {
      const raw = await searchService.search({ q: kw, page, size });
      result = {
        ...raw,
        records: raw.records.map((r) => ({
          uuid: r.articleUuid,
          title: r.title,
          summary: r.summary,
          slug: r.slug,
          authorNickname: r.authorNickname,
          tags: r.tagNames,
          publishedAt: r.publishedAt,
          viewCount: r.viewCount,
          likeCount: r.likeCount,
          coverImageUrl: null,
          commentCount: 0,
        } as ArticleItem)),
      };
    } else {
      result = await articleService.getArticles(page, size, filterParams.value.category, '');
    }

    if (currentMode === 'grid') {
      articles.value = result.records;
      maxGridPages.value = result.pages;
    } else {
      if (isLoadMore) {
        articles.value.push(...result.records);
      } else {
        articles.value = result.records;
      }
      noMoreData.value = page >= result.pages || result.records.length === 0;
    }
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

// ── filter bar handlers (previously emitted from FilterBar) ───────────────────
const selectCategory = (cat: string) => {
  activeCategory.value = cat;
  applyFilter();
};

const toggleMode = (mode: 'grid' | 'list') => {
  viewMode.value = mode;
  gridPage.value = 1;
  listPage.value = 1;
  noMoreData.value = false;
  fetchArticles();
};

const onSearch = () => {
  applyFilter();
};

const applyFilter = () => {
  filterParams.value = { category: activeCategory.value, keyword: keyword.value };
  gridPage.value = 1;
  listPage.value = 1;
  noMoreData.value = false;
  fetchArticles();
};

// ── pagination (grid mode) ────────────────────────────────────────────────────
const goToPage = (pageNumber: number) => {
  if (pageNumber < 1 || pageNumber > maxGridPages.value) return;
  gridPage.value = pageNumber;
  fetchArticles();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── infinite scroll (list mode) ───────────────────────────────────────────────
const loadNextPage = () => {
  if (isLoadingMore.value || noMoreData.value || viewMode.value === 'grid') return;
  listPage.value += 1;
  fetchArticles(true);
};

const observerTarget = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  fetchArticles();

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading.value && !isLoadingMore.value) {
      loadNextPage();
    }
  }, { rootMargin: '150px' });

  if (observerTarget.value) {
    observer.observe(observerTarget.value);
  }
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<template>
  <main class="articles-page" data-testid="articles-root">

    <!-- Sticky filter bar -->
    <div class="filter-bar-sticky">
      <div class="filter-bar" data-testid="articles-filter-bar">

        <!-- Search input -->
        <div class="search-wrap">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="keyword"
            @keyup.enter="onSearch"
            type="text"
            placeholder="搜尋文章..."
            class="search-input"
            data-testid="articles-search-input"
          />
        </div>

        <!-- Tag / category chips -->
        <div class="tag-chips">
          <button
            v-for="cat in categories"
            :key="cat"
            class="tag-chip"
            :class="{ active: activeCategory === cat }"
            @click="selectCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Right controls: sort + view mode -->
        <div class="filter-bar-right">
          <!-- Sort select -->
          <select
            v-model="sortOrder"
            class="sort-select"
            data-testid="articles-sort-select"
          >
            <option value="latest">Latest</option>
            <option value="popular">Popular</option>
            <option value="commented">Most commented</option>
          </select>

          <!-- View mode toggle -->
          <div class="view-toggle">
            <button
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="toggleMode('grid')"
              title="網格與分頁模式"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              class="view-btn"
              :class="{ active: viewMode === 'list' }"
              @click="toggleMode('list')"
              title="無限捲動清單模式"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content area -->
    <div class="articles-content">

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-dots">
          <div class="dot animate-bounce"></div>
          <div class="dot animate-bounce" style="animation-delay: 0.15s"></div>
          <div class="dot animate-bounce" style="animation-delay: 0.3s"></div>
        </div>
      </div>

      <!-- Article grid -->
      <div
        v-else-if="articles.length > 0"
        class="article-grid"
        :class="viewMode === 'list' ? 'article-grid--list' : ''"
      >
        <RouterLink
          v-for="(article, i) in articles"
          :key="article.uuid"
          :to="`/articles/${article.uuid}`"
          class="article-card-link"
        >
          <article
            class="article-card"
            :data-testid="'articles-card-' + i"
          >
            <!-- Cover image / fallback -->
            <div class="article-card-cover">
              <img
                v-if="article.coverImageUrl"
                :src="article.coverImageUrl"
                :alt="article.title"
                loading="lazy"
                class="cover-img"
              />
              <div v-else class="cover-fallback"></div>
            </div>

            <!-- Card body -->
            <div class="article-card-body">
              <!-- Category / tag pill -->
              <div class="article-card-meta">
                <span class="article-tag-pill">{{ article.tags?.[0] ?? 'Article' }}</span>
                <span class="meta-sep">·</span>
                <span class="meta-date">{{ article.publishedAt }}</span>
              </div>

              <!-- Title -->
              <h3 class="article-card-title">{{ article.title }}</h3>

              <!-- Excerpt / summary -->
              <p class="article-card-excerpt">{{ article.summary }}</p>

              <!-- Author + date meta -->
              <div class="article-card-footer">
                <span class="article-author">{{ article.authorNickname }}</span>
                <span class="meta-sep">·</span>
                <span class="article-views">{{ article.viewCount }} views</span>
              </div>
            </div>
          </article>
        </RouterLink>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!isLoading"
        class="empty-state"
        data-testid="articles-empty-state"
      >
        <div class="empty-state-mark">∅</div>
        <h3 class="empty-state-title">沒有找到符合條件的文章。</h3>
        <p class="empty-state-hint">試著放寬條件，或清除目前的篩選。</p>
      </div>

      <!-- Pagination (grid mode) -->
      <div v-if="viewMode === 'grid' && maxGridPages > 1 && !isLoading" class="pagination">
        <button
          @click="goToPage(gridPage - 1)"
          :disabled="gridPage === 1"
          class="page-btn page-btn--arrow"
        >←</button>

        <button
          v-for="page in maxGridPages"
          :key="page"
          @click="goToPage(page)"
          class="page-btn"
          :class="{ active: gridPage === page }"
        >{{ page }}</button>

        <button
          @click="goToPage(gridPage + 1)"
          :disabled="gridPage === maxGridPages"
          class="page-btn page-btn--arrow"
        >→</button>
      </div>

      <!-- Infinite scroll sentinel (list mode) -->
      <div
        v-show="viewMode === 'list' && articles.length > 0"
        ref="observerTarget"
        class="scroll-sentinel"
      >
        <div v-if="isLoadingMore" class="loading-dots">
          <div class="dot animate-bounce"></div>
          <div class="dot animate-bounce" style="animation-delay: 0.15s"></div>
          <div class="dot animate-bounce" style="animation-delay: 0.3s"></div>
          <span class="loading-label">載入下一頁中...</span>
        </div>
        <div v-else-if="noMoreData" class="sentinel-end">
          已經到底囉！
        </div>
      </div>

    </div>
  </main>
</template>

<style scoped>
/* ── Page shell ─────────────────────────────────────────────── */
.articles-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--ink);
}

/* ── Sticky filter bar ──────────────────────────────────────── */
.filter-bar-sticky {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  padding: 100px 2rem 1rem;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  max-width: 80rem;
  margin: 0 auto;
}

/* ── Search input ───────────────────────────────────────────── */
.search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  min-width: 220px;
}

.search-icon {
  width: 14px;
  height: 14px;
  color: var(--muted);
  flex-shrink: 0;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 13px;
  width: 100%;
}

.search-input::placeholder {
  color: var(--muted);
}

/* ── Tag chips ──────────────────────────────────────────────── */
.tag-chips {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.tag-chip {
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink-2);
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.18s;
}

.tag-chip:hover {
  border-color: var(--border-strong);
  color: var(--ink);
}

.tag-chip.active {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}

/* ── Right controls ─────────────────────────────────────────── */
.filter-bar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

/* ── Sort select ────────────────────────────────────────────── */
.sort-select {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.18s;
}

.sort-select:hover {
  border-color: var(--border-strong);
}

/* ── View toggle ────────────────────────────────────────────── */
.view-toggle {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-sub);
}

.view-btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 28px;
  border-radius: 6px;
  color: var(--muted);
  transition: all 0.15s;
}

.view-btn:hover {
  color: var(--ink);
}

.view-btn.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* ── Content area ───────────────────────────────────────────── */
.articles-content {
  flex: 1;
  max-width: 80rem;
  margin: 0 auto;
  width: 100%;
  padding: 2rem 2rem 5rem;
}

/* ── Loading state ──────────────────────────────────────────── */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 5rem 0;
}

.loading-dots {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.6;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ink);
}

/* ── Article grid ───────────────────────────────────────────── */
.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem 1.5rem;
  padding-top: 2rem;
}

.article-grid--list {
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* ── Article card link wrapper ──────────────────────────────── */
.article-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

/* ── Article card ───────────────────────────────────────────── */
.article-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface);
  transition: all 0.25s;
  height: 100%;
}

.article-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--border-strong);
}

/* Cover */
.article-card-cover {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--bg-sub);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-fallback {
  width: 100%;
  height: 100%;
  background:
    repeating-linear-gradient(135deg, rgba(10, 10, 11, 0.06) 0 2px, transparent 2px 14px),
    linear-gradient(180deg, var(--bg-sub), var(--surface));
}

/* Card body */
.article-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  flex: 1;
}

.article-card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted-2);
}

.article-tag-pill {
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--divider);
  background: transparent;
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.meta-sep {
  color: var(--muted-2);
}

.meta-date {
  color: var(--muted-2);
}

.article-card-title {
  font-size: 17px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.005em;
  color: var(--ink);
  margin: 0;
}

.article-card-excerpt {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
  margin: 0;
}

.article-card-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 11px;
  color: var(--muted);
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--divider);
}

.article-author {
  color: var(--ink-2);
  font-weight: 500;
}

.article-views {
  color: var(--muted-2);
}

/* ── Empty state ────────────────────────────────────────────── */
.empty-state {
  padding: 5rem 0;
  text-align: center;
}

.empty-state-mark {
  font-size: 80px;
  color: var(--muted-2);
  opacity: 0.3;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.empty-state-title {
  font-size: 22px;
  font-weight: 500;
  color: var(--ink);
  margin: 0 0 0.5rem;
}

.empty-state-hint {
  color: var(--muted);
  font-size: 14px;
}

/* ── Pagination ─────────────────────────────────────────────── */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 3rem;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink-2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  display: grid;
  place-items: center;
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-sub);
  color: var(--ink);
}

.page-btn.active {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ── Infinite scroll sentinel ───────────────────────────────── */
.scroll-sentinel {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 6rem;
  margin-top: 2rem;
}

.loading-label {
  margin-left: 0.5rem;
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.sentinel-end {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted-2);
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--border);
  border-radius: 999px;
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 768px) {
  .filter-bar-sticky {
    padding-top: 80px;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .articles-content {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .article-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar-right {
    margin-left: 0;
  }
}
</style>
