<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
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

const TAB_TESTIDS: Partial<Record<ArticleStatusFilter, string>> = {
  DRAFT: 'my-tab-draft',
  PUBLISHED: 'my-tab-published',
  ARCHIVED: 'my-tab-archived',
}

onMounted(fetchArticles)
</script>

<template>
  <div class="shell" data-testid="my-root">

    <!-- Left rail -->
    <nav class="shell-rail">
      <div class="brand">
        <span class="mark" />
        <span class="name">MY BLOG WEB.</span>
      </div>

      <span class="rail-section">WORKSPACE</span>

      <button class="rail-item active" data-testid="my-header-title">
        我的文章
        <span class="n">{{ articles.length }}</span>
      </button>

      <RouterLink to="/editor" class="rail-item" data-testid="my-new-btn">
        開始新文章
      </RouterLink>

      <span class="rail-section">LIBRARY</span>

      <button
        v-for="(label, status) in ARTICLE_STATUS_LABELS"
        :key="status"
        role="tab"
        :aria-selected="currentFilter === status"
        :data-testid="TAB_TESTIDS[status as ArticleStatusFilter]"
        class="rail-item"
        :class="{ active: currentFilter === status }"
        @click="handleFilterChange(status as ArticleStatusFilter)"
      >
        {{ label }}
      </button>

      <div class="rail-foot">
        <RouterLink to="/">← Blog 首頁</RouterLink>
      </div>
    </nav>

    <!-- Main content -->
    <div class="shell-main">

      <!-- Back breadcrumb -->
      <div class="shell-back">
        <span class="mono" style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted-2)">
          作者後台 · YUAN LUCA
        </span>
      </div>

      <!-- Header -->
      <div class="ma-head">
        <div class="ma-title-row">
          <h1 class="ma-title">我的文章<span class="em">。</span></h1>
          <RouterLink to="/editor" class="ma-new-btn">+ 開始新文章</RouterLink>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" data-testid="loading" class="ma-loading">
        <div class="sk-pulse" style="height:4px;width:80px;border-radius:2px;" />
      </div>

      <!-- Empty -->
      <div v-else-if="articles.length === 0" class="es-wrap">
        目前沒有文章
      </div>

      <!-- Table -->
      <table v-else class="ma-table">
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
                <span class="ma-status" :class="article.status">
                  {{ ARTICLE_STATUS_LABELS[article.status] }}
                </span>
              </td>
              <td><time>{{ formatDate(article.updatedAt) }}</time></td>
              <td class="ma-actions">
                <RouterLink
                  v-if="article.status === 'DRAFT' || article.status === 'REJECTED'"
                  :to="`/editor/${article.uuid}`"
                  class="ma-btn"
                  :data-testid="'my-row-action-edit-' + article.uuid"
                >編輯</RouterLink>
                <button
                  v-if="article.status === 'DRAFT'"
                  type="button"
                  class="ma-btn ma-btn--accent"
                  @click="handleSubmit(article.uuid)"
                >送出審核</button>
                <button
                  v-if="article.status === 'DRAFT'"
                  type="button"
                  class="ma-btn ma-btn--danger"
                  :data-testid="'my-row-action-delete-' + article.uuid"
                  @click="handleDelete(article.uuid)"
                >刪除</button>
              </td>
            </tr>
            <tr
              v-if="article.status === 'REJECTED' && article.rejectReason"
              :data-testid="'my-row-reject-' + article.uuid"
            >
              <td colspan="4" class="ma-reject-reason">{{ article.rejectReason }}</td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="ma-pagination">
        <button type="button" class="ma-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一頁</button>
        <span class="mono" style="font-size:11px;color:var(--muted)">第 {{ currentPage }} / {{ totalPages }} 頁</span>
        <button type="button" class="ma-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">下一頁</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.ma-new-btn {
  display: inline-flex; align-items: center; padding: 9px 20px; border-radius: 999px;
  background: var(--ink); color: var(--bg); font-family: var(--f-mono); font-size: 11px;
  letter-spacing: .14em; text-transform: uppercase; text-decoration: none; transition: opacity .2s;
}
.ma-new-btn:hover { opacity: .8; }
.ma-loading { padding: 3rem 0; display: flex; justify-content: center; }
.ma-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
.ma-table th, .ma-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--divider); font-size: 13.5px; }
.ma-table th { font-family: var(--f-mono); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--muted-2); }
.ma-status { display: inline-block; padding: 3px 10px; border-radius: 999px; font-family: var(--f-mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; }
.ma-status.DRAFT { background: var(--bg-sub); color: var(--muted); }
.ma-status.PUBLISHED { background: rgba(34,197,94,.12); color: #15803d; }
.ma-status.PENDING_REVIEW { background: rgba(234,179,8,.12); color: #a16207; }
.ma-status.REJECTED { background: rgba(239,68,68,.12); color: #b91c1c; }
.ma-status.ARCHIVED { background: rgba(99,102,241,.12); color: #4338ca; }
.ma-actions { display: flex; gap: 6px; align-items: center; }
.ma-btn {
  display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 8px;
  border: 1px solid var(--border); background: transparent; color: var(--ink);
  font-size: 12px; cursor: pointer; text-decoration: none; transition: all .15s;
}
.ma-btn:hover { background: var(--bg-sub); }
.ma-btn:disabled { opacity: .35; cursor: not-allowed; }
.ma-btn--accent { background: var(--accent); border-color: var(--accent); color: #fff; }
.ma-btn--accent:hover { opacity: .88; background: var(--accent); }
.ma-btn--danger { background: #ef4444; border-color: #ef4444; color: #fff; }
.ma-btn--danger:hover { opacity: .88; background: #ef4444; }
.ma-reject-reason { background: rgba(239,68,68,.05); color: #b91c1c; font-size: 13px; }
.ma-pagination { display: flex; align-items: center; gap: 12px; margin-top: 28px; }
</style>
