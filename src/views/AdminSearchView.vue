<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { adminService } from '../api/adminService'
import { useToast } from '../composables/useToast'
import AdminRail from '../components/layout/AdminRail.vue'
import { getApiErrorCode } from '../utils/apiErrors'
import type { SearchIndexStatus } from '../types/search'

/**
 * AdminSearchView — 搜尋索引（`/admin/search`）
 *
 * Task A9：顯示索引狀態（文件數／最後重建時間／健康狀態），並提供「重建
 * 索引」操作。重建為長時間、影響全站的操作，故不可一鍵直接執行——點擊後
 * 須先經確認對話框，確認後才進入執行中狀態（按鈕禁用）。
 *
 * D1（W7F-4）：後端改為背景作業——POST reindex 立即回 202 與作業，進度與結果
 * 由 GET status 的 `reindex` 欄位輪詢取得。因此「觸發成功」只代表已開始，
 * 「完成」要等輪詢收到 COMPLETED 才提示；FAILED 以 error toast 顯示後端摘要；
 * 重複觸發（409／A0501）改為接續觀看既有作業；重新進入頁面時若作業仍 RUNNING
 * 自動接續輪詢。
 */

/**
 * 輪詢間隔：2 秒。
 * 重建是數秒到數分鐘的作業，使用者只需要「看得出在動」；2 秒讓進度數字有感更新，
 * 又不會頻繁打 status（每次會查一次 ES 文件數＋讀 Redis）。更短的間隔對單一 admin
 * 沒有體感差異，更長（如 5 秒）則小作業可能一次輪詢都沒看到就結束了。
 * 用「上一次完成後再排下一次」的 setTimeout 鏈，而不是 setInterval，避免請求慢時重疊。
 */
const POLL_INTERVAL_MS = 2000
/**
 * 連續失敗上限：3 次（約 6 秒內都連不上）才放棄。
 * 單次網路抖動不該中斷輪詢；但連續失敗代表後端或網路真的有問題，繼續禁用按鈕、
 * 一直轉圈只會讓使用者卡住，所以停下並提示（使用者可重新整理頁面，作業本身不受影響）。
 */
const MAX_CONSECUTIVE_POLL_FAILURES = 3
/** 後端 REINDEX_IN_PROGRESS：已有重建作業在執行 */
const REINDEX_IN_PROGRESS_CODE = 'A0501'

const { showToast } = useToast()

const status = ref<SearchIndexStatus | null>(null)
const isLoading = ref(true)

// 重建索引確認流程狀態
const showConfirm = ref(false)
/** 觸發請求進行中（POST reindex 尚未回應） */
const isTriggering = ref(false)
/** 輪詢中（作業仍在執行，或尚在確認其結果） */
const isPolling = ref(false)
const isReindexing = computed(() => isTriggering.value || isPolling.value)

const runningJob = computed(() => {
  const job = status.value?.reindex
  return job?.state === 'RUNNING' ? job : null
})

const progressText = computed(() => {
  const job = runningJob.value
  if (!job) return ''
  return job.total === null ? `已處理 ${job.processed} 篇` : `${job.processed} / ${job.total} 篇`
})

/** 將 ISO 時間字串格式化為 `YYYY-MM-DD HH:mm`，不依賴環境 locale，避免測試在不同機器上結果不一致 */
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 載入狀態；silent 時不切換 loading（輪詢與完成後的重新載入不應讓畫面閃一次載入動畫） */
async function fetchStatus(silent = false) {
  if (!silent) isLoading.value = true
  try {
    status.value = await adminService.getSearchStatus()
  } catch (error) {
    showToast(error instanceof Error ? error.message : '載入搜尋索引狀態失敗，請稍後再試', 'error')
  } finally {
    if (!silent) isLoading.value = false
  }
}

// ── 輪詢 ───────────────────────────────────────────────────────────────────
let pollTimer: ReturnType<typeof setTimeout> | null = null
// 每次 start/stop 都換代；在飛行中的請求回來時發現世代不同（已停止或已卸載）就丟棄結果
let pollGeneration = 0
let consecutiveFailures = 0

function stopPolling() {
  pollGeneration += 1
  if (pollTimer !== null) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
  consecutiveFailures = 0
  isPolling.value = false
}

function schedulePoll(generation: number, delayMs: number) {
  pollTimer = setTimeout(() => {
    pollTimer = null
    void pollOnce(generation)
  }, delayMs)
}

function startPolling(delayMs = POLL_INTERVAL_MS) {
  stopPolling()
  isPolling.value = true
  schedulePoll(pollGeneration, delayMs)
}

/** 一次輪詢結果無法確認作業狀態（請求失敗，或後端回 reindex=null）：累計，連續達上限才放棄 */
function handleUnconfirmedPoll(generation: number) {
  consecutiveFailures += 1
  if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
    stopPolling()
    showToast('無法取得重建進度，請重新整理頁面確認重建結果', 'error')
    return
  }
  schedulePoll(generation, POLL_INTERVAL_MS)
}

async function pollOnce(generation: number) {
  let latest: SearchIndexStatus
  try {
    latest = await adminService.getSearchStatus()
  } catch {
    if (generation === pollGeneration) handleUnconfirmedPoll(generation)
    return
  }
  if (generation !== pollGeneration) return

  const job = latest.reindex
  if (!job) {
    handleUnconfirmedPoll(generation)
    return
  }

  consecutiveFailures = 0
  status.value = latest

  if (job.state === 'RUNNING') {
    schedulePoll(generation, POLL_INTERVAL_MS)
    return
  }

  stopPolling()
  if (job.state === 'COMPLETED') {
    showToast('索引重建完成', 'success')
    await fetchStatus(true)
    return
  }
  showToast(job.error ? `索引重建失敗：${job.error}` : '索引重建失敗，請稍後再試', 'error')
}

function openConfirm() {
  showConfirm.value = true
}

function cancelReindex() {
  showConfirm.value = false
}

async function confirmReindex() {
  showConfirm.value = false
  isTriggering.value = true
  try {
    const job = await adminService.reindexSearch()
    // 202：作業已在背景開始，「完成」要等輪詢收到 COMPLETED 才提示
    showToast('已開始重建索引，進度會自動更新', 'info')
    if (status.value) status.value = { ...status.value, reindex: job }
    startPolling()
  } catch (error) {
    if (getApiErrorCode(error) === REINDEX_IN_PROGRESS_CODE) {
      // 409：別處（或先前的分頁）已啟動重建。不需要讀 409 的 data，直接輪詢 status 並立即抓一次
      showToast('已有重建作業進行中，為你顯示目前進度', 'info')
      startPolling(0)
      return
    }
    // 觸發失敗須明確呈現錯誤訊息，不可靜默失敗；不重新拉取狀態，避免以
    // 過期資料掩蓋失敗事實。
    showToast(error instanceof Error ? error.message : '索引重建失敗，請稍後再試', 'error')
  } finally {
    isTriggering.value = false
  }
}

onMounted(async () => {
  await fetchStatus()
  // 重新進入頁面時作業仍在跑：自動接續輪詢
  if (runningJob.value) startPolling()
})

onBeforeUnmount(stopPolling)
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

        <!-- 重建進度（作業 RUNNING 時） -->
        <p v-if="runningJob" class="search-progress" data-testid="admin-search-progress" role="status">
          {{ progressText }}
        </p>

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
  color: var(--danger);
}

.search-progress {
  margin: -12px 0 16px;
  font-size: 13px;
  color: var(--muted);
  font-family: var(--f-mono);
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
