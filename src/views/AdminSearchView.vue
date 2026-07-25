<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminService } from '../api/adminService'
import { useToast } from '../composables/useToast'
import AdminRail from '../components/layout/AdminRail.vue'
import type { SearchIndexStatus } from '../types/search'

/**
 * AdminSearchView — 搜尋索引（`/admin/search`）
 *
 * Task A9：顯示索引狀態（文件數／最後重建時間／健康狀態），並提供「重建
 * 索引」操作。重建為長時間、影響全站的操作，故不可一鍵直接執行——點擊後
 * 須先經確認對話框，確認後才進入執行中狀態（按鈕禁用），完成後重新拉取
 * 狀態並以 toast 回饋結果；失敗時同樣以 toast 明確呈現錯誤訊息，不可靜默
 * 失敗。
 */

const { showToast } = useToast()

const status = ref<SearchIndexStatus | null>(null)
const isLoading = ref(true)

// 重建索引確認流程狀態
const showConfirm = ref(false)
const isReindexing = ref(false)

/** 將 ISO 時間字串格式化為 `YYYY-MM-DD HH:mm`，不依賴環境 locale，避免測試在不同機器上結果不一致 */
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function fetchStatus() {
  isLoading.value = true
  try {
    status.value = await adminService.getSearchStatus()
  } catch (error) {
    showToast(error instanceof Error ? error.message : '載入搜尋索引狀態失敗，請稍後再試', 'error')
  } finally {
    isLoading.value = false
  }
}

function openConfirm() {
  showConfirm.value = true
}

function cancelReindex() {
  showConfirm.value = false
}

async function confirmReindex() {
  showConfirm.value = false
  isReindexing.value = true
  try {
    await adminService.reindexSearch()
    showToast('索引重建完成', 'success')
    await fetchStatus()
  } catch (error) {
    // 重建失敗須明確呈現錯誤訊息，不可靜默失敗；不重新拉取狀態，避免以
    // 過期資料掩蓋失敗事實。
    showToast(error instanceof Error ? error.message : '索引重建失敗，請稍後再試', 'error')
  } finally {
    isReindexing.value = false
  }
}

onMounted(fetchStatus)
</script>

<template>
  <div class="shell" data-testid="admin-search-root">
    <AdminRail active="admin-search" />

    <main class="shell-main">
      <div class="admin-wrap">
        <h1 class="admin-title">搜尋索引</h1>

        <!-- Loading -->
        <div v-if="isLoading" data-testid="admin-search-loading" class="admin-loading">
          <span class="admin-loading-dot" style="animation-delay:0ms" />
          <span class="admin-loading-dot" style="animation-delay:150ms" />
          <span class="admin-loading-dot" style="animation-delay:300ms" />
        </div>

        <!-- 索引狀態 -->
        <div v-else-if="status" class="admin-card search-status-card">
          <p v-if="!status.healthy" class="search-status-error" data-testid="admin-search-offline">
            ES 離線
          </p>
          <template v-else>
            <p class="search-status-value" data-testid="admin-search-document-count">
              {{ status.documentCount }} 筆文件
            </p>
            <p v-if="status.lastReindexAt === null" class="search-status-sub" data-testid="admin-search-never-reindexed">
              從未重建
            </p>
            <p v-else class="search-status-sub" data-testid="admin-search-last-reindex">
              最後重建：{{ formatDateTime(status.lastReindexAt) }}
            </p>
          </template>
        </div>

        <button
          type="button"
          class="search-reindex-btn"
          data-testid="admin-search-reindex-btn"
          :disabled="isReindexing"
          @click="openConfirm"
        >
          <span v-if="isReindexing" class="search-reindexing-dots" data-testid="admin-search-reindexing">
            <span class="admin-loading-dot" style="animation-delay:0ms" />
            <span class="admin-loading-dot" style="animation-delay:150ms" />
            <span class="admin-loading-dot" style="animation-delay:300ms" />
          </span>
          {{ isReindexing ? '重建中…' : '重建索引' }}
        </button>

        <!-- 重建確認對話框 -->
        <div v-if="showConfirm" class="cat-confirm-overlay" data-testid="admin-search-confirm">
          <div class="cat-confirm-box">
            <p>重建索引為長時間、影響全站的操作，確定要執行嗎？</p>
            <div class="cat-confirm-actions">
              <button
                type="button"
                class="cat-btn"
                data-testid="admin-search-confirm-cancel"
                @click="cancelReindex"
              >
                取消
              </button>
              <button
                type="button"
                class="cat-btn cat-btn-primary"
                data-testid="admin-search-confirm-confirm"
                @click="confirmReindex"
              >
                確認重建
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.search-status-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  margin: 8px 0 24px;
}
.search-status-value {
  font-family: var(--f-display);
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 500;
  color: var(--ink);
}
.search-status-sub {
  font-size: 13px;
  color: var(--muted);
  font-family: var(--f-mono);
}
.search-status-error {
  font-size: 15px;
  color: #b91c1c;
}

.search-reindex-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  background: var(--accent);
  color: #fff;
  transition: opacity .2s;
}
.search-reindex-btn:hover { opacity: .85; }
.search-reindex-btn:disabled { opacity: .5; cursor: not-allowed; }

.search-reindexing-dots { display: inline-flex; gap: 4px; }

.cat-confirm-overlay {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.4); z-index: 100;
}
.cat-confirm-box {
  display: flex; flex-direction: column; gap: 16px; padding: 24px;
  border-radius: 12px; border: 1px solid var(--glass-border); background: var(--bg-sub);
  color: var(--ink); max-width: 360px;
}
.cat-confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
.cat-btn {
  padding: 8px 18px; border-radius: 20px; font-size: 13px; cursor: pointer;
  transition: opacity .2s; border: 1px solid var(--glass-border); background: var(--glass); color: var(--ink);
}
.cat-btn:hover { opacity: .8; }
.cat-btn-primary { background: var(--accent); color: #fff; border-color: transparent; }
</style>
