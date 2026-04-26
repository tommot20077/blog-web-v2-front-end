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
  <div class="admin-wrap">
    <!-- 標題 -->
    <h1 class="admin-title">
      待審核文章
      <span v-if="!isLoading" class="admin-title-sub">（共 {{ totalCount }} 篇）</span>
    </h1>

    <!-- Loading -->
    <div v-if="isLoading" data-testid="loading" class="admin-loading">
      <span class="admin-loading-dot" style="animation-delay:0ms" />
      <span class="admin-loading-dot" style="animation-delay:150ms" />
      <span class="admin-loading-dot" style="animation-delay:300ms" />
    </div>

    <!-- 空狀態 -->
    <div v-else-if="articles.length === 0" class="admin-empty">
      目前沒有待審核文章
    </div>

    <!-- 文章列表 -->
    <ul v-else class="admin-list">
      <li
        v-for="article in articles"
        :key="article.uuid"
        class="admin-card"
      >
        <!-- 標題 + 日期 + 操作 -->
        <div class="admin-card-head">
          <div>
            <h2 class="admin-card-title">{{ article.title }}</h2>
            <time class="admin-card-time">提交：{{ formatDate(article.updatedAt) }}</time>
          </div>
          <div class="admin-actions">
            <button
              type="button"
              class="admin-btn admin-btn-approve"
              @click="handlePublish(article.uuid)"
            >
              通過
            </button>
            <button
              type="button"
              class="admin-btn admin-btn-reject"
              @click="openRejectForm(article.uuid)"
            >
              退回
            </button>
          </div>
        </div>

        <!-- Inline 退回表單 -->
        <div v-if="rejectingUuid === article.uuid" class="admin-reject-form">
          <textarea
            v-model="rejectReason"
            placeholder="請輸入退回理由"
            rows="3"
            class="admin-reject-textarea"
          />
          <div class="admin-reject-actions">
            <button
              type="button"
              class="admin-btn admin-btn-cancel"
              @click="cancelReject"
            >
              取消
            </button>
            <button
              type="button"
              class="admin-btn admin-btn-confirm-reject"
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
    <div v-if="totalPages > 1" class="admin-pagination">
      <button
        type="button"
        class="admin-page-btn"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        上一頁
      </button>
      <span class="admin-page-info">第 {{ currentPage }} / {{ totalPages }} 頁</span>
      <button
        type="button"
        class="admin-page-btn"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        下一頁
      </button>
    </div>
  </div>
</template>
