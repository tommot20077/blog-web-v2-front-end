<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { bookmarkService } from '../api/bookmarkService'
import { useToast } from '../composables/useToast'
import type { BookmarkArticleSummary } from '../api/real/bookmarkService'

const { showToast } = useToast()

const articles = ref<BookmarkArticleSummary[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const isLoading = ref(true)
const removingUuid = ref<string | null>(null)
const PAGE_SIZE = 10

async function fetchBookmarks() {
  isLoading.value = true
  try {
    const result = await bookmarkService.getMyBookmarks(currentPage.value, PAGE_SIZE)
    articles.value = result.records
    total.value = result.total
    totalPages.value = result.pages
  } catch {
    articles.value = []
    total.value = 0
    totalPages.value = 1
    showToast('收藏列表載入失敗', 'error')
  } finally {
    isLoading.value = false
  }
}

async function goToPage(page: number) {
  currentPage.value = page
  await fetchBookmarks()
}

async function removeBookmark(uuid: string) {
  if (removingUuid.value) return
  removingUuid.value = uuid
  try {
    await bookmarkService.unbookmark(uuid)
    articles.value = articles.value.filter((article) => article.uuid !== uuid)
    total.value = Math.max(0, total.value - 1)
    if (articles.value.length === 0 && currentPage.value > 1) {
      currentPage.value -= 1
      await fetchBookmarks()
    }
  } catch {
    showToast('取消收藏失敗', 'error')
  } finally {
    removingUuid.value = null
  }
}

function formatDate(iso?: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(fetchBookmarks)
</script>

<template>
  <div class="shell" data-testid="bookmarks-root">
    <nav class="shell-rail">
      <div class="brand">
        <span class="mark" />
        <span class="name">MY BLOG WEB.</span>
      </div>

      <span class="rail-section">LIBRARY</span>

      <button class="rail-item active" data-testid="bookmarks-header-title">
        我的收藏
        <span class="n">{{ total }}</span>
      </button>

      <RouterLink to="/my-articles" class="rail-item">我的文章</RouterLink>
      <RouterLink to="/settings" class="rail-item">設定</RouterLink>

      <div class="rail-foot">
        <RouterLink to="/">← Blog 首頁</RouterLink>
      </div>
    </nav>

    <main class="shell-main">
      <div class="bm-head">
        <div>
          <p class="bm-kicker">READING LIST</p>
          <h1 class="bm-title">我的收藏<span class="em">。</span></h1>
        </div>
        <RouterLink to="/articles" class="bm-link">瀏覽文章</RouterLink>
      </div>

      <div v-if="isLoading" data-testid="loading" class="bm-loading">
        <div class="sk-pulse" style="height:4px;width:80px;border-radius:2px;" />
      </div>

      <div v-else-if="articles.length === 0" class="bm-empty">
        目前沒有收藏文章
      </div>

      <section v-else class="bm-list">
        <article
          v-for="article in articles"
          :key="article.uuid"
          class="bm-card"
          :data-testid="'bookmark-row-' + article.uuid"
        >
          <RouterLink :to="`/articles/${article.uuid}`" class="bm-card-main">
            <img
              v-if="article.coverImageUrl"
              :src="article.coverImageUrl"
              :alt="article.title"
              class="bm-cover"
            />
            <div class="bm-content">
              <div class="bm-meta">
                <span>{{ article.authorNickname }}</span>
                <span>·</span>
                <time>{{ formatDate(article.publishedAt) }}</time>
              </div>
              <h2>{{ article.title }}</h2>
              <p v-if="article.summary">{{ article.summary }}</p>
              <div class="bm-tags">
                <span v-for="tag in article.tags ?? []" :key="tag.id"># {{ tag.name }}</span>
              </div>
            </div>
          </RouterLink>

          <button
            type="button"
            class="bm-remove"
            :disabled="removingUuid === article.uuid"
            :data-testid="'bookmark-row-remove-' + article.uuid"
            @click="removeBookmark(article.uuid)"
          >
            取消收藏
          </button>
        </article>
      </section>

      <div v-if="totalPages > 1" class="bm-pagination">
        <button type="button" class="bm-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一頁</button>
        <span class="mono">第 {{ currentPage }} / {{ totalPages }} 頁</span>
        <button type="button" class="bm-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">下一頁</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.bm-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}
.bm-kicker {
  margin: 0 0 8px;
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: .18em;
  color: var(--muted-2);
}
.bm-title {
  margin: 0;
  font-family: var(--f-display);
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 500;
  letter-spacing: -.04em;
}
.bm-link,
.bm-btn,
.bm-remove {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--ink);
  text-decoration: none;
  cursor: pointer;
  transition: background .15s, opacity .15s;
}
.bm-link {
  padding: 9px 18px;
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: .14em;
}
.bm-btn,
.bm-remove {
  padding: 6px 12px;
  font-size: 12px;
}
.bm-link:hover,
.bm-btn:hover:not(:disabled),
.bm-remove:hover:not(:disabled) {
  background: var(--bg-sub);
}
.bm-btn:disabled,
.bm-remove:disabled {
  opacity: .35;
  cursor: not-allowed;
}
.bm-loading {
  padding: 3rem 0;
  display: flex;
  justify-content: center;
}
.bm-empty {
  padding: 56px 0;
  color: var(--muted);
  border-top: 1px solid var(--divider);
  border-bottom: 1px solid var(--divider);
}
.bm-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bm-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--divider);
}
.bm-card-main {
  display: grid;
  grid-template-columns: 132px 1fr;
  gap: 18px;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}
.bm-cover {
  width: 132px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  object-fit: cover;
}
.bm-content {
  min-width: 0;
}
.bm-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--muted-2);
}
.bm-content h2 {
  margin: 0 0 8px;
  font-size: 20px;
  color: var(--ink);
}
.bm-content p {
  margin: 0 0 12px;
  color: var(--muted);
  line-height: 1.7;
}
.bm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--muted);
}
.bm-pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
}
@media (max-width: 720px) {
  .bm-head,
  .bm-card {
    align-items: stretch;
    grid-template-columns: 1fr;
    flex-direction: column;
  }
  .bm-card-main {
    grid-template-columns: 1fr;
  }
  .bm-cover {
    width: 100%;
  }
}
</style>
