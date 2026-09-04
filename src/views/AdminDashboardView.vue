<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AdminRail from '../components/layout/AdminRail.vue'
import { adminService } from '../api/adminService'
import type { SearchIndexStatus } from '../types/search'

/**
 * AdminDashboardView — admin 後台總覽儀表板（`/admin`）
 *
 * Task A6 範圍：四格真實資料指標卡（待審文章數 / 分類數 / 標籤數 / 搜尋索引狀態）。
 * 每格資料各自獨立 fetch、各自 loading / error 狀態，任一格失敗不影響其他格
 * （不使用 Promise.all，避免一格 reject 拖累全部）。全部資料皆來自
 * `adminService`，禁止寫死 mock 數字（本專案已有 `StatsView.vue` 整頁假資料
 * 的反例，儀表板不可重蹈覆轍）。
 */

const pendingCount = ref<number | null>(null)
const pendingLoading = ref(true)
const pendingError = ref(false)

const categoriesCount = ref<number | null>(null)
const categoriesLoading = ref(true)
const categoriesError = ref(false)

const tagsCount = ref<number | null>(null)
const tagsLoading = ref(true)
const tagsError = ref(false)

const searchStatus = ref<SearchIndexStatus | null>(null)
const searchLoading = ref(true)
const searchError = ref(false)

async function fetchPendingCount() {
  pendingLoading.value = true
  pendingError.value = false
  try {
    pendingCount.value = await adminService.getPendingCount()
  } catch {
    pendingError.value = true
  } finally {
    pendingLoading.value = false
  }
}

async function fetchCategoriesCount() {
  categoriesLoading.value = true
  categoriesError.value = false
  try {
    const categories = await adminService.getCategoriesFull()
    categoriesCount.value = categories.length
  } catch {
    categoriesError.value = true
  } finally {
    categoriesLoading.value = false
  }
}

async function fetchTagsCount() {
  tagsLoading.value = true
  tagsError.value = false
  try {
    const tags = await adminService.getTagsFull()
    tagsCount.value = tags.length
  } catch {
    tagsError.value = true
  } finally {
    tagsLoading.value = false
  }
}

async function fetchSearchStatus() {
  searchLoading.value = true
  searchError.value = false
  try {
    searchStatus.value = await adminService.getSearchStatus()
  } catch {
    searchError.value = true
  } finally {
    searchLoading.value = false
  }
}

/** 將 ISO 時間字串格式化為 `YYYY-MM-DD HH:mm`，不依賴環境 locale，避免測試在不同機器上結果不一致 */
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  // 刻意不用 Promise.all：四格各自獨立 fetch，任一格 reject 不影響其他格渲染
  fetchPendingCount()
  fetchCategoriesCount()
  fetchTagsCount()
  fetchSearchStatus()
})
</script>

<template>
  <div class="shell" data-testid="admin-dashboard-root">
    <AdminRail active="admin-dashboard" />

    <main class="shell-main">
      <div class="admin-wrap">
        <h1 class="admin-title">總覽</h1>

        <div class="admin-stat-grid">
          <!-- 待審文章數 -->
          <RouterLink
            to="/admin/review"
            class="admin-card admin-stat-card"
            data-testid="admin-dashboard-card-pending"
          >
            <p class="admin-stat-label">待審文章數</p>
            <div v-if="pendingLoading" class="admin-loading" data-testid="admin-dashboard-pending-loading">
              <span class="admin-loading-dot" style="animation-delay:0ms" />
              <span class="admin-loading-dot" style="animation-delay:150ms" />
              <span class="admin-loading-dot" style="animation-delay:300ms" />
            </div>
            <p v-else-if="pendingError" class="admin-stat-error" data-testid="admin-dashboard-pending-error">
              載入失敗
            </p>
            <p v-else class="admin-stat-value" data-testid="admin-dashboard-pending-value">
              {{ pendingCount }}
            </p>
          </RouterLink>

          <!-- 分類數 -->
          <RouterLink
            to="/admin/categories"
            class="admin-card admin-stat-card"
            data-testid="admin-dashboard-card-categories"
          >
            <p class="admin-stat-label">分類數</p>
            <div v-if="categoriesLoading" class="admin-loading" data-testid="admin-dashboard-categories-loading">
              <span class="admin-loading-dot" style="animation-delay:0ms" />
              <span class="admin-loading-dot" style="animation-delay:150ms" />
              <span class="admin-loading-dot" style="animation-delay:300ms" />
            </div>
            <p v-else-if="categoriesError" class="admin-stat-error" data-testid="admin-dashboard-categories-error">
              載入失敗
            </p>
            <p v-else class="admin-stat-value" data-testid="admin-dashboard-categories-value">
              {{ categoriesCount }}
            </p>
          </RouterLink>

          <!-- 標籤數 -->
          <RouterLink
            to="/admin/tags"
            class="admin-card admin-stat-card"
            data-testid="admin-dashboard-card-tags"
          >
            <p class="admin-stat-label">標籤數</p>
            <div v-if="tagsLoading" class="admin-loading" data-testid="admin-dashboard-tags-loading">
              <span class="admin-loading-dot" style="animation-delay:0ms" />
              <span class="admin-loading-dot" style="animation-delay:150ms" />
              <span class="admin-loading-dot" style="animation-delay:300ms" />
            </div>
            <p v-else-if="tagsError" class="admin-stat-error" data-testid="admin-dashboard-tags-error">
              載入失敗
            </p>
            <p v-else class="admin-stat-value" data-testid="admin-dashboard-tags-value">
              {{ tagsCount }}
            </p>
          </RouterLink>

          <!-- 搜尋索引 -->
          <RouterLink
            to="/admin/search"
            class="admin-card admin-stat-card"
            data-testid="admin-dashboard-card-search"
          >
            <p class="admin-stat-label">搜尋索引</p>
            <div v-if="searchLoading" class="admin-loading" data-testid="admin-dashboard-search-loading">
              <span class="admin-loading-dot" style="animation-delay:0ms" />
              <span class="admin-loading-dot" style="animation-delay:150ms" />
              <span class="admin-loading-dot" style="animation-delay:300ms" />
            </div>
            <p v-else-if="searchError" class="admin-stat-error" data-testid="admin-dashboard-search-error">
              載入失敗
            </p>
            <template v-else-if="searchStatus">
              <p v-if="!searchStatus.healthy" class="admin-stat-error" data-testid="admin-dashboard-search-offline">
                ES 離線
              </p>
              <template v-else>
                <p class="admin-stat-value" data-testid="admin-dashboard-search-value">
                  {{ searchStatus.documentCount }} 筆文件
                </p>
                <p v-if="searchStatus.lastReindexAt === null" class="admin-stat-sub" data-testid="admin-dashboard-search-never">
                  從未重建
                </p>
                <p v-else class="admin-stat-sub" data-testid="admin-dashboard-search-last-reindex">
                  最後重建：{{ formatDateTime(searchStatus.lastReindexAt) }}
                </p>
              </template>
            </template>
          </RouterLink>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 8px;
}
@media (max-width: 640px) {
  .admin-stat-grid { grid-template-columns: 1fr; }
}
.admin-stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.admin-stat-card:hover {
  transform: translateY(-2px);
  opacity: 0.92;
}
.admin-stat-card .admin-loading {
  justify-content: flex-start;
  padding: 8px 0;
}
.admin-stat-label {
  font-family: var(--f-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--muted);
  text-transform: uppercase;
}
.admin-stat-value {
  font-family: var(--f-display);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 500;
  color: var(--ink);
}
.admin-stat-sub {
  font-size: 12px;
  color: var(--muted);
  font-family: var(--f-mono);
}
.admin-stat-error {
  font-size: 14px;
  color: var(--danger);
}
</style>
