<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminService } from '../api/adminService'
import { useToast } from '../composables/useToast'
import type { MyArticle } from '../types/editor'

const { showToast } = useToast()

const articles = ref<MyArticle[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const isLoading = ref(true)
const rejectingUuid = ref<string | null>(null)
const rejectReason = ref('')
const PAGE_SIZE = 10

const canConfirmReject = computed(() => rejectReason.value.trim().length > 0)

async function fetchArticles() {
  isLoading.value = true
  try {
    const result = await adminService.getPendingArticles(currentPage.value, PAGE_SIZE)
    articles.value = result.records
    totalPages.value = result.pages
    totalCount.value = result.total
  } catch {
    showToast('載入待審核文章失敗，請稍後再試', 'error')
  } finally {
    isLoading.value = false
  }
}

async function goToPage(page: number) {
  currentPage.value = page
  await fetchArticles()
}

async function handlePublish(uuid: string) {
  try {
    await adminService.publishArticle(uuid)
    articles.value = articles.value.filter(a => a.uuid !== uuid)
    totalCount.value -= 1
    showToast('文章已通過審核', 'success')
  } catch {
    showToast('操作失敗', 'error')
  }
}

function openRejectForm(uuid: string) {
  rejectingUuid.value = uuid
  rejectReason.value = ''
}

function cancelReject() {
  rejectingUuid.value = null
  rejectReason.value = ''
}

async function handleReject(uuid: string) {
  try {
    await adminService.rejectArticle(uuid, rejectReason.value)
    articles.value = articles.value.filter(a => a.uuid !== uuid)
    totalCount.value -= 1
    rejectingUuid.value = null
    rejectReason.value = ''
    showToast('文章已退回', 'success')
  } catch {
    showToast('操作失敗', 'error')
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
    <h1 class="text-2xl font-bold mb-6">
      待審核文章
      <span v-if="!isLoading" class="text-base font-normal text-gray-500 ml-2">
        （共 {{ totalCount }} 篇）
      </span>
    </h1>

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
      目前沒有待審核文章
    </div>

    <!-- 文章列表 -->
    <ul v-else class="space-y-4">
      <li
        v-for="article in articles"
        :key="article.uuid"
        class="p-4 rounded-xl border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/8 backdrop-blur-md"
      >
        <!-- 標題 + 日期 -->
        <div class="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 class="font-semibold">{{ article.title }}</h2>
            <time class="text-xs text-gray-500">提交：{{ formatDate(article.updatedAt) }}</time>
          </div>

          <!-- 操作按鈕 -->
          <div class="shrink-0 flex gap-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-full text-sm bg-green-500 text-white hover:opacity-90 transition-opacity"
              @click="handlePublish(article.uuid)"
            >
              通過
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-full text-sm bg-red-500 text-white hover:opacity-90 transition-opacity"
              @click="openRejectForm(article.uuid)"
            >
              退回
            </button>
          </div>
        </div>

        <!-- Inline 退回表單 -->
        <div v-if="rejectingUuid === article.uuid" class="mt-3 space-y-2">
          <textarea
            v-model="rejectReason"
            placeholder="請輸入退回理由"
            rows="3"
            class="w-full px-3 py-2 rounded-lg border border-white/80 dark:border-white/15 bg-white/60 dark:bg-white/8 text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              class="px-3 py-1.5 rounded-full text-sm bg-white/60 border border-white/80 hover:bg-white/80 dark:bg-white/8 dark:border-white/15 transition-colors"
              @click="cancelReject"
            >
              取消
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-full text-sm bg-red-500 text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!canConfirmReject"
              @click="handleReject(article.uuid)"
            >
              確認退回
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
