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
const isLoading = ref(false)
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

onMounted(fetchArticles)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- 標題 -->
    <h1 class="text-2xl font-bold mb-6">我的文章</h1>

    <!-- 狀態過濾 Tabs -->
    <nav role="tablist" class="flex gap-2 mb-6 flex-wrap">
      <button
        v-for="(label, status) in ARTICLE_STATUS_LABELS"
        :key="status"
        role="tab"
        :aria-selected="currentFilter === status"
        class="px-3 py-1.5 rounded-full text-sm border transition-colors"
        :class="currentFilter === status
          ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]'
          : 'bg-white/60 border-white/80 hover:bg-white/80 dark:bg-white/8 dark:border-white/15'"
        @click="handleFilterChange(status as ArticleStatusFilter)"
      >
        {{ label }}
      </button>
    </nav>

    <!-- Loading -->
    <div v-if="isLoading" data-testid="loading" class="flex justify-center py-12">
      <div class="flex gap-2">
        <span class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0ms" />
        <span class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 150ms" />
        <span class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 300ms" />
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="articles.length === 0" class="text-center py-12 text-gray-500">
      目前沒有文章
    </div>

    <!-- 文章列表 -->
    <ul v-else class="space-y-4">
      <li
        v-for="article in articles"
        :key="article.uuid"
        class="p-4 rounded-xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/8 backdrop-blur-md"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <!-- 標題 + 狀態 -->
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h2 class="font-semibold truncate">{{ article.title }}</h2>
              <span
                class="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300': ARTICLE_STATUS_COLORS[article.status] === 'gray',
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400': ARTICLE_STATUS_COLORS[article.status] === 'yellow',
                  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400': ARTICLE_STATUS_COLORS[article.status] === 'green',
                  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400': ARTICLE_STATUS_COLORS[article.status] === 'red',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400': ARTICLE_STATUS_COLORS[article.status] === 'blue',
                }"
              >
                {{ ARTICLE_STATUS_LABELS[article.status] }}
              </span>
            </div>

            <!-- 更新日期 -->
            <time class="text-xs text-gray-500">
              最後更新：{{ formatDate(article.updatedAt) }}
            </time>

            <!-- 退回原因 -->
            <p
              v-if="article.status === 'REJECTED' && article.rejectReason"
              class="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
            >
              {{ article.rejectReason }}
            </p>
          </div>

          <!-- 操作按鈕 -->
          <div class="shrink-0 flex gap-2 flex-wrap justify-end">
            <RouterLink
              v-if="article.status === 'DRAFT' || article.status === 'REJECTED'"
              :to="`/editor/${article.uuid}`"
              class="px-3 py-1.5 rounded-full text-sm bg-white/60 border border-white/80 hover:bg-white/80 dark:bg-white/8 dark:border-white/15 transition-colors"
            >
              編輯
            </RouterLink>

            <button
              v-if="article.status === 'DRAFT'"
              type="button"
              class="px-3 py-1.5 rounded-full text-sm bg-[var(--accent-color)] text-white hover:opacity-90 transition-opacity"
              @click="handleSubmit(article.uuid)"
            >
              送出審核
            </button>

            <button
              v-if="article.status === 'DRAFT'"
              type="button"
              class="px-3 py-1.5 rounded-full text-sm bg-red-500 text-white hover:opacity-90 transition-opacity"
              @click="handleDelete(article.uuid)"
            >
              刪除
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- 分頁 -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 mt-8">
      <button
        type="button"
        class="px-4 py-2 rounded-full text-sm bg-white/60 border border-white/80 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-white/8 dark:border-white/15 transition-colors"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        上一頁
      </button>
      <span class="text-sm text-gray-500">第 {{ currentPage }} / {{ totalPages }} 頁</span>
      <button
        type="button"
        class="px-4 py-2 rounded-full text-sm bg-white/60 border border-white/80 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-white/8 dark:border-white/15 transition-colors"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        下一頁
      </button>
    </div>
  </div>
</template>
