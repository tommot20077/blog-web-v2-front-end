<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { fileService } from '../../api/fileService'
import { tagSuggestService } from '../../api/tagSuggestService'
import { articleVersionService } from '../../api/articleVersionService'
import type { VersionSummaryResponse } from '../../api/articleVersionService'
import { useToast } from '../../composables/useToast'
import { useAuthedImages } from '../../composables/useAuthedImages'
import type { ArticleStatus, CategoryOption, TagSuggestion } from '../../types/editor'
import type { OutlineItem } from '../../composables/useEditorOutline'

const props = defineProps<{
  summary: string
  coverImageUrl: string | null
  categoryIds: string[]
  tagNames: string[]
  categories: CategoryOption[]
  outline: OutlineItem[]
  activeHeadingLineIndex: number
  articleUuid?: string | null
  articleStatus?: ArticleStatus | null
}>()

const emit = defineEmits<{
  'update:summary': [value: string]
  'update:coverImageUrl': [value: string | null]
  'update:categoryIds': [value: string[]]
  'update:tagNames': [value: string[]]
  'jump-to-line': [lineIndex: number]
  'version-restored': [version: VersionSummaryResponse]
}>()

const metaTab = ref<'meta' | 'outline' | 'history'>('meta')

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : '請稍後再試'
}

// ── 標籤 ──────────────────────────────────────────────────────────────────
const tagInput = ref('')
const tagSuggestions = ref<TagSuggestion[]>([])
let suggestTimer: ReturnType<typeof setTimeout> | null = null

function onTagInput() {
  if (suggestTimer) clearTimeout(suggestTimer)
  suggestTimer = setTimeout(async () => {
    if (tagInput.value.trim()) {
      tagSuggestions.value = await tagSuggestService.suggestTags(tagInput.value.trim())
    } else {
      tagSuggestions.value = []
    }
  }, 300)
}

onUnmounted(() => {
  if (suggestTimer) clearTimeout(suggestTimer)
})

function addTag(name: string) {
  const trimmed = name.trim()
  if (!trimmed || props.tagNames.includes(trimmed)) return
  emit('update:tagNames', [...props.tagNames, trimmed])
  tagInput.value = ''
  tagSuggestions.value = []
}

function removeTag(name: string) {
  emit('update:tagNames', props.tagNames.filter(t => t !== name))
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addTag(tagInput.value)
  }
}

// ── 分類 ──────────────────────────────────────────────────────────────────
function toggleCategory(id: string) {
  const current = [...props.categoryIds]
  const idx = current.indexOf(id)
  if (idx === -1) {
    current.push(id)
  } else {
    current.splice(idx, 1)
  }
  emit('update:categoryIds', current)
}

// ── 封面圖 ────────────────────────────────────────────────────────────────
const isUploading = ref(false)
const uploadError = ref('')
const { showToast } = useToast()

// 草稿封面圖走 canRead 授權矩陣，改用帶認證的 blob 載入避免預覽 403 破圖
// （會開編輯器的必是作者/管理員，永遠啟用）
const coverPreviewEl = ref<HTMLElement | null>(null)
useAuthedImages(coverPreviewEl, () => props.coverImageUrl)

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  isUploading.value = true
  uploadError.value = ''
  try {
    const result = await fileService.uploadFile(file, 'ARTICLE_COVER')
    emit('update:coverImageUrl', result.url)
  } catch (err) {
    const message = getErrorMessage(err)
    uploadError.value = '上傳失敗：' + message
    showToast('上傳失敗：' + message, 'error')
  } finally {
    isUploading.value = false
    input.value = ''
  }
}

// ── 版本歷史 ──────────────────────────────────────────────────────────────
const historyLoading = ref(false)
const historyError = ref('')
const historyVersions = ref<VersionSummaryResponse[]>([])
const restoringUuid = ref<string | null>(null)

async function loadHistory() {
  if (!props.articleUuid) return
  historyLoading.value = true
  historyError.value = ''
  try {
    const res = await articleVersionService.list(props.articleUuid, {})
    historyVersions.value = res.records
  } catch (err) {
    historyError.value = getErrorMessage(err)
  } finally {
    historyLoading.value = false
  }
}

watch(metaTab, (tab) => {
  if (tab === 'history') loadHistory()
})

function formatVersionTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ── 還原按鈕依文章狀態 gating ────────────────────────────────────────────────
// 對齊後端 fix/restore-content-freeze：PENDING_REVIEW / PUBLISHED / ARCHIVED 狀態下
// 內容凍結，POST .../restore 改回 400（A0209）。這裡只是提前擋（UX），不是安全邊界——
// 停用判斷只看目前 articleStatus，真正的授權與狀態檢查仍在後端；
// 停用文案具體到能指引下一步，DRAFT / REJECTED 不受影響，維持原本可還原。
const RESTORE_BLOCKED_REASONS: Partial<Record<ArticleStatus, string>> = {
  PENDING_REVIEW: '送審中的文章內容已凍結，無法還原舊版本。請至「我的文章」抽回為草稿後再試',
  PUBLISHED: '已發布的文章內容已凍結，無法還原舊版本',
  ARCHIVED: '已封存的文章內容已凍結，無法還原舊版本',
}

const restoreDisabledReason = computed<string | undefined>(() => {
  if (!props.articleStatus) return undefined
  return RESTORE_BLOCKED_REASONS[props.articleStatus]
})

async function onRestoreClick(version: VersionSummaryResponse) {
  if (!props.articleUuid) return
  const confirmed = window.confirm('確定要還原至此版本？這會覆蓋目前的草稿內容，此操作無法復原。')
  if (!confirmed) return

  restoringUuid.value = version.uuid
  try {
    await articleVersionService.restore(props.articleUuid, version.uuid)
    emit('version-restored', version)
    showToast('已還原至所選版本', 'success')
  } catch (err) {
    showToast('還原失敗：' + getErrorMessage(err), 'error')
  } finally {
    restoringUuid.value = null
  }
}
</script>

<template>
  <aside class="w-72 shrink-0 flex flex-col p-4 bg-white/60 backdrop-blur-md border-l border-white/80 dark:bg-white/8 dark:border-white/15 overflow-y-auto">

    <!-- Meta / Outline tabs -->
    <div class="meta-tabs">
      <button
        type="button"
        class="meta-tab-btn"
        :class="{ active: metaTab === 'meta' }"
        @click="metaTab = 'meta'"
      >Meta</button>
      <button
        type="button"
        class="meta-tab-btn"
        :class="{ active: metaTab === 'outline' }"
        @click="metaTab = 'outline'"
      >Outline</button>
      <button
        type="button"
        class="meta-tab-btn"
        :class="{ active: metaTab === 'history' }"
        @click="metaTab = 'history'"
      >History</button>
    </div>

    <div v-show="metaTab === 'meta'" class="flex flex-col gap-4">

      <!-- 封面圖 -->
      <section>
        <p class="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">封面圖</p>
        <div
          v-if="coverImageUrl"
          ref="coverPreviewEl"
          class="relative rounded-xl overflow-hidden mb-2"
        >
          <img data-testid="cover-preview" :src="coverImageUrl" alt="封面圖預覽" class="w-full h-32 object-cover" />
          <button
            type="button"
            class="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
            @click="emit('update:coverImageUrl', null)"
          >✕</button>
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <span
            class="px-3 py-1.5 rounded-full text-sm bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            :class="{ 'opacity-60 cursor-not-allowed': isUploading }"
          >
            {{ isUploading ? '上傳中...' : '上傳封面' }}
          </span>
          <input
            data-testid="cover-upload-input"
            type="file"
            accept="image/*"
            class="hidden"
            :disabled="isUploading"
            @change="onFileChange"
          />
        </label>
        <p v-if="uploadError" class="text-xs text-red-500 mt-1">{{ uploadError }}</p>
      </section>

      <!-- 分類 -->
      <section>
        <p class="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">分類</p>
        <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
          <label
            v-for="cat in categories"
            :key="cat.id"
            class="flex items-center gap-2 cursor-pointer text-sm hover:text-[var(--accent)] transition-colors"
          >
            <input
              type="checkbox"
              :name="cat.name"
              :aria-label="cat.name"
              :checked="categoryIds.includes(cat.id)"
              class="rounded"
              @change="toggleCategory(cat.id)"
            />
            {{ cat.name }}
          </label>
        </div>
      </section>

      <!-- 標籤 -->
      <section>
        <p class="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">標籤</p>
        <!-- 已加標籤 -->
        <div v-if="tagNames.length" class="flex flex-wrap gap-1 mb-2">
          <span
            v-for="tag in tagNames"
            :key="tag"
            class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 border border-white/80 text-xs"
          >
            {{ tag }}
            <button
              type="button"
              :title="`移除 ${tag}`"
              class="text-gray-400 hover:text-red-500 transition-colors"
              @click="removeTag(tag)"
            >✕</button>
          </span>
        </div>
        <!-- 輸入框 -->
        <div class="relative">
          <input
            v-model="tagInput"
            type="text"
            placeholder="輸入標籤後按 Enter"
            class="w-full px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/10 border border-white/80 dark:border-white/15 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            @input="onTagInput"
            @keydown="onTagKeydown"
          />
          <!-- 建議列表 -->
          <ul
            v-if="tagSuggestions.length"
            class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg text-sm overflow-hidden"
          >
            <li
              v-for="sug in tagSuggestions"
              :key="sug.name"
              class="px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="addTag(sug.name)"
            >
              {{ sug.name }}
              <span v-if="sug.articleCount && sug.articleCount > 0" class="text-xs text-gray-400 ml-1">{{ sug.articleCount }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- 摘要 -->
      <section>
        <p class="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">摘要</p>
        <textarea
          :value="summary"
          placeholder="文章摘要..."
          rows="4"
          class="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-white/10 border border-white/80 dark:border-white/15 text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          @input="emit('update:summary', ($event.target as HTMLTextAreaElement).value)"
        />
      </section>

    </div>

    <!-- Outline tab -->
    <div v-show="metaTab === 'outline'" class="outline-panel">
      <p v-if="outline.length === 0" class="outline-empty">文章還沒有標題</p>
      <ul v-else class="outline-list">
        <li
          v-for="item in outline"
          :key="item.lineIndex"
          class="outline-item"
          :class="[`outline-level-${item.level}`, { active: activeHeadingLineIndex === item.lineIndex }]"
          @click="emit('jump-to-line', item.lineIndex)"
        >
          {{ item.text }}
        </li>
      </ul>
    </div>

    <!-- History tab -->
    <div v-show="metaTab === 'history'" class="history-panel">
      <p v-if="!articleUuid" class="history-empty" data-testid="history-no-uuid">
        文章儲存後即可查看版本歷史
      </p>
      <template v-else>
        <p v-if="historyLoading" class="history-loading" data-testid="history-loading">載入中...</p>
        <div v-else-if="historyError" class="history-error" data-testid="history-error">
          <p>{{ historyError }}</p>
          <button type="button" class="history-retry" @click="loadHistory">重試</button>
        </div>
        <p v-else-if="historyVersions.length === 0" class="history-empty" data-testid="history-empty">
          尚無版本歷史
        </p>
        <ul v-else class="history-list">
          <li
            v-for="version in historyVersions"
            :key="version.uuid"
            class="history-row"
            data-testid="history-row"
          >
            <span class="history-ts">{{ formatVersionTime(version.createdAt) }}</span>
            <div class="history-body">
              <div class="history-type">
                <span class="history-badge" :class="version.type === 'MANUAL' ? 'manual' : 'auto'">
                  {{ version.type === 'MANUAL' ? 'Manual' : 'Auto' }}
                </span>
                <span v-if="version.note" class="history-note">{{ version.note }}</span>
              </div>
              <div class="history-desc">{{ version.contentLength }} 字</div>
            </div>
            <button
              type="button"
              class="history-restore"
              :disabled="restoringUuid === version.uuid || !!restoreDisabledReason"
              :title="restoreDisabledReason"
              @click="onRestoreClick(version)"
            >{{ restoringUuid === version.uuid ? '還原中...' : 'Restore' }}</button>
          </li>
        </ul>
      </template>
    </div>

  </aside>
</template>

<style scoped>
.meta-tabs { display: flex; gap: 4px; padding: 8px 4px 4px; border-bottom: 1px solid var(--divider); margin-bottom: 8px; }
.meta-tab-btn { flex: 1; padding: 5px 8px; border-radius: 6px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); transition: all 0.15s; }
.meta-tab-btn.active { background: var(--ink); color: var(--bg); }
.outline-panel { flex: 1; overflow-y: auto; padding: 4px 0; }
.outline-empty { font-size: 12px; color: var(--muted); padding: 16px 8px; text-align: center; }
.outline-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
.outline-item { font-size: 12.5px; color: var(--muted); padding: 6px 10px; border-radius: 6px; cursor: pointer; line-height: 1.4; transition: all 0.12s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.outline-item:hover { background: var(--bg-sub); color: var(--ink); }
.outline-item.active { background: var(--bg-sub); color: var(--accent); }
.outline-level-1 { padding-left: 10px; font-weight: 500; }
.outline-level-2 { padding-left: 22px; }
.outline-level-3 { padding-left: 34px; }

.history-panel { flex: 1; overflow-y: auto; padding: 4px 0; }
.history-empty, .history-loading { font-size: 12px; color: var(--muted); padding: 16px 8px; text-align: center; }
.history-error { font-size: 12px; color: var(--muted); padding: 12px 8px; text-align: center; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.history-retry { padding: 4px 12px; border-radius: 999px; border: 1px solid var(--divider); color: var(--ink); background: var(--bg-sub); font-size: 11px; cursor: pointer; }
.history-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
.history-row { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 6px; transition: background 0.12s; }
.history-row:hover { background: var(--bg-sub); }
.history-ts { font-family: var(--f-mono); font-size: 11px; color: var(--muted); white-space: nowrap; padding-top: 2px; }
.history-body { flex: 1; min-width: 0; }
.history-type { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--ink); }
.history-badge { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; padding: 1px 6px; border-radius: 999px; border: 1px solid var(--divider); color: var(--muted); }
.history-badge.manual { color: var(--accent); border-color: var(--accent); }
.history-note { color: var(--muted); font-size: 12px; }
.history-desc { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
.history-restore { font-size: 11px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--divider); background: var(--bg); color: var(--ink); cursor: pointer; opacity: 0; transition: opacity 0.15s; }
.history-row:hover .history-restore, .history-restore:focus-visible, .history-restore:disabled { opacity: 1; }
.history-restore:disabled { cursor: not-allowed; color: var(--muted); }
</style>
