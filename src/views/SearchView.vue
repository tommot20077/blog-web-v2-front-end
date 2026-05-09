<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSearch } from '../composables/useSearch'
import { highlight } from '../utils/highlight'

const router = useRouter()
const {
  query, debouncedQuery, isLoading,
  results, popularTags, recentSearches,
  hasQuery, hasResults,
  clearQuery, clearRecent, setQuery,
  POPULAR_QUERIES,
} = useSearch()

const searchFocused = ref(false)

const isMac = computed(() => {
  if (typeof navigator === 'undefined') return false
  if ((navigator as unknown as { userAgentData?: { platform: string } }).userAgentData?.platform) {
    return /mac/i.test((navigator as unknown as { userAgentData: { platform: string } }).userAgentData.platform)
  }
  return /Mac|iPhone|iPad/.test(navigator.userAgent)
})

function goToFirstArticle() {
  if (results.value.articles.length > 0) {
    router.push('/articles/' + results.value.articles[0].articleUuid)
  }
}

function onGlobalEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') clearQuery()
}
onMounted(() => window.addEventListener('keydown', onGlobalEscape))
onUnmounted(() => window.removeEventListener('keydown', onGlobalEscape))

</script>

<template>
  <div class="sv-page">
    <div class="sv-wrap">
      <!-- Search bar -->
      <div :class="['sv-search', { focus: searchFocused }]">
        <!-- Search icon -->
        <svg class="sv-icon" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path stroke-linecap="round" d="M20 20l-4.35-4.35" />
        </svg>

        <input
          v-model="query"
          type="text"
          placeholder="搜尋文章、標籤…"
          data-testid="search-input"
          autofocus
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @keydown.escape="clearQuery"
          @keydown.enter="goToFirstArticle"
        />

        <!-- Clear button -->
        <button v-if="query" class="sv-clear" @click="clearQuery" aria-label="清除">×</button>

        <!-- Count badge -->
        <span class="sv-count">
          <template v-if="hasQuery">{{ results.total }}</template>
          <template v-else>{{ isMac ? '⌘K' : 'Ctrl+K' }}</template>
        </span>
      </div>

      <!-- Meta row -->
      <div class="sv-meta-row">
        <span v-if="hasQuery" class="sv-meta-q">"{{ debouncedQuery }}"</span>
        <span v-else>&nbsp;</span>
        <span v-if="isLoading">搜尋中…</span>
        <span v-else-if="hasQuery">{{ results.total }} 筆結果</span>
        <span v-else>輸入關鍵字以搜尋</span>
      </div>

      <!-- ─── EMPTY STATE (no query) ─── -->
      <template v-if="!hasQuery">
        <div class="sv-empty">
          <!-- Recent searches -->
          <div v-if="recentSearches.length > 0" class="sv-section">
            <div class="sv-section-head">
              <span>近期搜尋</span>
              <button class="sv-link-btn" @click="clearRecent">清除</button>
            </div>
            <div class="sv-chips">
              <button
                v-for="recent in recentSearches"
                :key="recent"
                class="sv-chip"
                @click="setQuery(recent)"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ recent }}
              </button>
            </div>
          </div>

          <!-- Popular queries -->
          <div class="sv-section">
            <div class="sv-section-head">
              <span>熱門搜尋</span>
            </div>
            <div class="sv-chips">
              <button
                v-for="pq in POPULAR_QUERIES"
                :key="pq"
                class="sv-chip"
                @click="setQuery(pq)"
              >
                <span class="sv-chip-i">#</span>
                {{ pq }}
              </button>
            </div>
          </div>

          <!-- All tags -->
          <div v-if="popularTags.length > 0" class="sv-section">
            <div class="sv-section-head">
              <span>所有標籤</span>
              <span class="sv-section-note">{{ popularTags.length }} 個標籤</span>
            </div>
            <div class="sv-tags">
              <button
                v-for="tag in popularTags"
                :key="tag.uuid"
                class="sv-tag-pill"
                @click="setQuery(tag.name)"
              >
                {{ tag.name }}
                <span class="sv-tag-n">{{ tag.articleCount }}</span>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- ─── NO RESULTS ─── -->
      <template v-else-if="!hasResults && !isLoading">
        <div class="sv-noresult" data-testid="search-no-result">
          <div class="sv-noresult-mark">∅</div>
          <h3>找不到結果</h3>
          <p>沒有符合「{{ debouncedQuery }}」的文章或標籤，請嘗試其他關鍵字。</p>
        </div>

        <!-- Popular queries -->
        <div class="sv-section">
          <div class="sv-section-head">
            <span>熱門搜尋</span>
          </div>
          <div class="sv-chips">
            <button
              v-for="pq in POPULAR_QUERIES"
              :key="pq"
              class="sv-chip"
              @click="setQuery(pq)"
            >
              <span class="sv-chip-i">#</span>
              {{ pq }}
            </button>
          </div>
        </div>
      </template>

      <!-- ─── RESULTS ─── -->
      <template v-else-if="hasQuery && hasResults">
        <!-- Articles section -->
        <div v-if="results.articles.length > 0" class="sv-section">
          <div class="sv-section-head">
            <span>文章</span>
            <span class="sv-section-note">{{ results.articles.length }} 篇</span>
          </div>
          <div class="sv-cards">
            <div
              v-for="article in results.articles"
              :key="article.articleUuid"
              class="sv-card"
              data-testid="search-article-card"
              @click="router.push('/articles/' + article.articleUuid)"
            >
              <!-- Thumbnail placeholder -->
              <div class="sv-thumb" :data-tag="article.tagNames?.[0] ?? ''">
                <span class="sv-thumb-n">{{ article.viewCount }} views</span>
              </div>

              <h5 v-html="highlight(article.title, debouncedQuery)" />
              <p>{{ article.summary }}</p>

              <div class="sv-card-foot">
                <div>
                  <span class="sv-author-n" v-html="highlight(article.authorNickname, debouncedQuery)" />
                  <span style="color:var(--muted-2);margin:0 6px">·</span>
                  <span style="font-family:var(--f-mono);font-size:10px;color:var(--muted-2)">
                    {{ article.publishedAt?.slice(0, 10) }}
                  </span>
                </div>
                <span class="sv-card-arr">→</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags section -->
        <div v-if="results.tags.length > 0" class="sv-section">
          <div class="sv-section-head">
            <span>標籤</span>
            <span class="sv-section-note">{{ results.tags.length }} 個</span>
          </div>
          <div class="sv-tags">
            <button
              v-for="tag in results.tags"
              :key="tag.uuid"
              class="sv-tag-pill"
              @click="setQuery(tag.name)"
            >
              <span v-html="highlight(tag.name, debouncedQuery)" />
              <span class="sv-tag-n">{{ tag.articleCount }}</span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
