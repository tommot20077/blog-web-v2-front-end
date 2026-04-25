<script setup lang="ts">
import { ref, computed } from 'vue'
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
        <div class="sv-noresult">
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
              @click="router.push('/articles/' + article.articleUuid)"
            >
              <!-- Thumbnail placeholder -->
              <div class="sv-thumb">
                <span class="sv-thumb-n">{{ article.viewCount }} 閱</span>
              </div>

              <h5 v-html="highlight(article.title, debouncedQuery)" />
              <p>{{ article.summary }}</p>

              <div class="sv-card-foot">
                <span class="sv-author-n" v-html="highlight(article.authorNickname, debouncedQuery)" />
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

<style scoped>
/* ============ SEARCH VIEW ============ */
.sv-page { min-height: 100vh; background: var(--bg); padding: 96px 32px 160px; }
.sv-wrap { max-width: 1160px; margin: 0 auto; }
.sv-search { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid var(--ink); padding: 14px 4px 16px; transition: border-color 0.2s; }
.sv-search.focus { border-bottom-color: var(--accent); }
.sv-icon { color: var(--muted); flex-shrink: 0; transition: color 0.2s; }
.sv-search.focus .sv-icon { color: var(--accent); }
.sv-search input { flex: 1; background: transparent; border: none; outline: none; font-family: var(--f-display); font-size: 38px; font-weight: 400; color: var(--ink); letter-spacing: -0.01em; line-height: 1.2; }
.sv-search input::placeholder { color: var(--muted-2); font-weight: 300; }
.sv-clear { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; font-size: 20px; line-height: 1; padding: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.sv-clear:hover { border-color: var(--ink); color: var(--ink); }
.sv-count { font-family: var(--f-mono); font-size: 12px; color: var(--muted-2); letter-spacing: 0.12em; padding: 6px 10px; border: 1px solid var(--divider); border-radius: 4px; white-space: nowrap; }
.sv-meta-row { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 4px 0; font-family: var(--f-mono); font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted-2); }
.sv-meta-q { color: var(--muted); }
.sv-section { margin-top: 56px; }
.sv-section-head { display: flex; justify-content: space-between; align-items: baseline; font-family: var(--f-mono); font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted-2); padding-bottom: 12px; border-bottom: 1px solid var(--divider); margin-bottom: 24px; }
.sv-section-note { font-size: 9.5px; }
.sv-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.sv-card { background: var(--surface); border: 1px solid var(--divider); border-radius: 10px; padding: 16px; cursor: pointer; transition: border-color 0.2s, transform 0.2s, background 0.2s; display: flex; flex-direction: column; }
.sv-card:hover { border-color: var(--ink); transform: translateY(-2px); }
.sv-thumb { aspect-ratio: 16/9; background: linear-gradient(135deg, var(--bg-sub), var(--bg)); border-radius: 6px; position: relative; overflow: hidden; margin-bottom: 14px; display: flex; align-items: flex-end; justify-content: space-between; padding: 10px; }
.sv-thumb-n { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.12em; color: var(--muted-2); align-self: flex-end; margin-left: auto; }
.sv-card h5 { font-family: var(--f-display); font-size: 15px; font-weight: 500; line-height: 1.4; letter-spacing: -0.005em; color: var(--ink); margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sv-card h5 :deep(mark), .sv-tag-pill :deep(mark), .sv-author-n :deep(mark) { background: color-mix(in oklch, var(--accent) 24%, transparent); color: var(--ink); border-radius: 2px; padding: 0 2px; text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 2px; }
.sv-card p { font-size: 12.5px; color: var(--muted); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px; flex: 1; }
.sv-card-foot { display: flex; justify-content: space-between; align-items: baseline; font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-2); padding-top: 10px; border-top: 1px solid var(--divider); }
.sv-card-arr { font-size: 14px; color: var(--muted); transition: transform 0.2s, color 0.2s; }
.sv-card:hover .sv-card-arr { color: var(--accent); transform: translateX(3px); }
.sv-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.sv-tag-pill { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--ink); font-size: 13px; font-family: var(--f-body); cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s; }
.sv-tag-pill:hover { border-color: var(--ink); background: var(--ink); color: var(--bg); }
.sv-tag-pill:hover .sv-tag-n { color: var(--bg); opacity: 0.6; }
.sv-tag-n { font-family: var(--f-mono); font-size: 10px; color: var(--muted-2); letter-spacing: 0.04em; }
.sv-empty { margin-top: 48px; }
.sv-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.sv-chip { display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; background: var(--surface); border: 1px solid var(--divider); border-radius: 999px; font-family: var(--f-body); font-size: 13px; color: var(--ink); cursor: pointer; transition: all 0.15s; }
.sv-chip:hover { border-color: var(--ink); background: var(--ink); color: var(--bg); }
.sv-chip:hover .sv-chip-n, .sv-chip:hover .sv-chip-i { color: var(--bg); opacity: 0.55; }
.sv-chip-n { font-family: var(--f-mono); font-size: 10px; color: var(--muted-2); letter-spacing: 0.06em; }
.sv-chip-i { font-family: var(--f-mono); font-size: 11px; color: var(--muted-2); }
.sv-link-btn { background: none; border: none; font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.16em; color: var(--muted-2); text-transform: uppercase; cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 3px; }
.sv-link-btn:hover { color: var(--accent); }
.sv-noresult { margin-top: 80px; text-align: center; padding: 60px 20px; }
.sv-noresult-mark { font-family: var(--f-display); font-size: 72px; font-weight: 300; color: var(--muted-2); letter-spacing: -0.02em; margin-bottom: 16px; }
.sv-noresult h3 { font-family: var(--f-display); font-size: 22px; font-weight: 500; color: var(--ink); margin-bottom: 10px; letter-spacing: -0.005em; }
.sv-noresult p { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
@media (max-width: 960px) {
  .sv-cards { grid-template-columns: repeat(2, 1fr); }
  .sv-search input { font-size: 28px; }
}
@media (max-width: 640px) {
  .sv-page { padding: 64px 20px 120px; }
  .sv-cards { grid-template-columns: 1fr; }
  .sv-search input { font-size: 24px; }
}
</style>
