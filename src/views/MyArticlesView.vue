<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { myArticlesService } from '../api/myArticlesService'
import { useToast } from '../composables/useToast'
import {
  ARTICLE_STATUS_FILTER,
  ARTICLE_STATUS_LABELS,
  ARTICLE_STATUS_COLORS,
} from '../types/editor'
import type { MyArticle, ArticleStatusFilter } from '../types/editor'

const { showToast } = useToast()

const articles = ref<MyArticle[]>([])
const currentFilter = ref<ArticleStatusFilter>('ALL')
const currentPage = ref(1)
const totalPages = ref(1)
const isLoading = ref(true)
const PAGE_SIZE = 10

async function fetchArticles() {
  isLoading.value = true
  try {
    const result = await myArticlesService.getMyArticles(currentFilter.value, currentPage.value, PAGE_SIZE)
    articles.value = result.records
    totalPages.value = result.pages
  } finally {
    isLoading.value = false
  }
}

async function handleFilterChange(status: ArticleStatusFilter) {
  currentFilter.value = status
  currentPage.value = 1
  await fetchArticles()
}

async function goToPage(page: number) {
  currentPage.value = page
  await fetchArticles()
}

async function handleSubmit(uuid: string) {
  try {
    await myArticlesService.submitForReview(uuid)
    showToast('已送出審核', 'success')
    await fetchArticles()
  } catch {
    showToast('送出失敗', 'error')
  }
}

async function handleDelete(uuid: string) {
  try {
    await myArticlesService.deleteArticle(uuid)
    await fetchArticles()
  } catch {
    showToast('刪除失敗', 'error')
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// Map status filter keys to their testid suffix
const TAB_TESTIDS: Partial<Record<ArticleStatusFilter, string>> = {
  DRAFT: 'my-tab-draft',
  PUBLISHED: 'my-tab-published',
  ARCHIVED: 'my-tab-archived',
}

onMounted(fetchArticles)
</script>

<template>
  <main class="my-articles" data-testid="my-root">
    <!-- Header -->
    <div class="my-header">
      <h1 class="my-title" data-testid="my-header-title">My Articles</h1>
      <RouterLink to="/editor" class="btn btn--primary" data-testid="my-new-btn">New Article</RouterLink>
    </div>

    <!-- 狀態過濾 Tabs -->
    <div class="my-tabs" role="tablist">
      <button
        v-for="(label, status) in ARTICLE_STATUS_LABELS"
        :key="status"
        role="tab"
        :aria-selected="currentFilter === status"
        :data-testid="TAB_TESTIDS[status as ArticleStatusFilter]"
        :class="{ active: currentFilter === status }"
        @click="handleFilterChange(status as ArticleStatusFilter)"
      >
        {{ label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" data-testid="loading" class="loading-wrap">
      <div class="loading-dots">
        <span />
        <span />
        <span />
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="articles.length === 0" class="empty-state">
      目前沒有文章
    </div>

    <!-- 文章表格 -->
    <table v-else class="my-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="article in articles" :key="article.uuid">
          <tr :data-testid="'my-row-' + article.uuid">
            <td>{{ article.title }}</td>
            <td>
              <span
                class="status-badge"
                :class="'status-badge--' + ARTICLE_STATUS_COLORS[article.status]"
              >
                {{ ARTICLE_STATUS_LABELS[article.status] }}
              </span>
            </td>
            <td>
              <time>{{ formatDate(article.updatedAt) }}</time>
            </td>
            <td class="actions-cell">
              <RouterLink
                v-if="article.status === 'DRAFT' || article.status === 'REJECTED'"
                :to="`/editor/${article.uuid}`"
                class="btn btn--ghost"
                :data-testid="'my-row-action-edit-' + article.uuid"
              >
                編輯
              </RouterLink>

              <button
                v-if="article.status === 'DRAFT'"
                type="button"
                class="btn btn--primary"
                @click="handleSubmit(article.uuid)"
              >
                送出審核
              </button>

              <button
                v-if="article.status === 'DRAFT'"
                type="button"
                class="btn btn--danger"
                :data-testid="'my-row-action-delete-' + article.uuid"
                @click="handleDelete(article.uuid)"
              >
                刪除
              </button>
            </td>
          </tr>
          <!-- 退回原因 -->
          <tr
            v-if="article.status === 'REJECTED' && article.rejectReason"
            :data-testid="'my-row-reject-' + article.uuid"
          >
            <td colspan="4" class="reject-reason">
              {{ article.rejectReason }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <!-- 分頁 -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        type="button"
        class="btn btn--ghost"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        上一頁
      </button>
      <span class="pagination-info">第 {{ currentPage }} / {{ totalPages }} 頁</span>
      <button
        type="button"
        class="btn btn--ghost"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        下一頁
      </button>
    </div>
  </main>
</template>

<style scoped>
.my-articles {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.my-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.my-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
}

.my-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid var(--border);
  margin-bottom: 1.5rem;
}

.my-tabs button {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--muted);
  cursor: pointer;
}

.my-tabs button.active {
  color: var(--ink);
  border-bottom: 2px solid var(--accent);
}

.my-table {
  width: 100%;
  border-collapse: collapse;
}

.my-table th,
.my-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--divider);
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge--gray {
  background: var(--badge-gray-bg, #f3f4f6);
  color: var(--badge-gray-text, #4b5563);
}

.status-badge--yellow {
  background: var(--badge-yellow-bg, #fef9c3);
  color: var(--badge-yellow-text, #a16207);
}

.status-badge--green {
  background: var(--badge-green-bg, #dcfce7);
  color: var(--badge-green-text, #15803d);
}

.status-badge--red {
  background: var(--badge-red-bg, #fee2e2);
  color: var(--badge-red-text, #b91c1c);
}

.status-badge--blue {
  background: var(--badge-blue-bg, #dbeafe);
  color: var(--badge-blue-text, #1d4ed8);
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.reject-reason {
  color: var(--danger, #dc2626);
  font-size: 0.875rem;
  background: var(--danger-bg, #fff1f2);
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.loading-dots {
  display: flex;
  gap: 0.5rem;
}

.loading-dots span {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--muted);
  animation: bounce 1s infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 150ms;
}

.loading-dots span:nth-child(3) {
  animation-delay: 300ms;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.375rem); }
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--muted);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--muted);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--accent);
  color: var(--on-accent, #fff);
}

.btn--ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--ink);
}

.btn--danger {
  background: var(--danger, #ef4444);
  color: #fff;
}
</style>
