<script setup lang="ts">
import { shallowRef, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorForm } from '../composables/useEditorForm'
import { useMarkdownEditor } from '../composables/useMarkdownEditor'
import { useMarkdownRenderer } from '../composables/useMarkdownRenderer'
import { useWordCount } from '../composables/useWordCount'
import {
  MAX_ARTICLE_CONTENT_LENGTH,
  MAX_ARTICLE_TITLE_LENGTH,
  MAX_ARTICLE_SUMMARY_LENGTH,
  exceedsLength,
  isNearLimit,
} from '../utils/inputLimits'
import { useEditorMode } from '../composables/useEditorMode'
import { useEditorWordUnit } from '../composables/useEditorWordUnit'
import { useToast } from '../composables/useToast'
import { useEditorFocusMode } from '../composables/useEditorFocusMode'
import { useEditorOutline } from '../composables/useEditorOutline'
import { useEditorImageUpload } from '../composables/useEditorImageUpload'
import { findUnrenderableImages } from '../utils/unrenderableImages'
import { isConcurrentUpdateError, isRateLimited } from '../utils/apiErrors'
import { useUnsavedChangesGuard } from '../composables/useUnsavedChangesGuard'
import { useAuthStore } from '../stores/auth'
import { useAuthedImages } from '../composables/useAuthedImages'
import { categoryService } from '../api/categoryService'
import EditorToolbar from '../components/editor/EditorToolbar.vue'
import EditorMetaSidebar from '../components/editor/EditorMetaSidebar.vue'
import type { CategoryOption } from '../types/editor'

const props = defineProps<{
  uuid?: string
}>()

// ── CodeMirror mount target ────────────────────────────────────────────────
const editorContainer = shallowRef<HTMLElement | null>(null)

// ── CodeMirror editor ─────────────────────────────────────────────────────
// 前向參考以打破循環初始化順序：
// useMarkdownEditor 需要 callback，但 useEditorOutline 依賴 useMarkdownEditor 的回傳值。
// useMarkdownEditor 內部以 flush:'sync' watchEffect 掛載 CM，同步執行，
// 因此 _updateCursorLine 在任何 selectionSet 觸發前必然已完成賦值。
let _updateCursorLine: ((lineIndex: number) => void) | undefined
function onCursorChange(lineIndex: number) {
  _updateCursorLine?.(lineIndex)
}

const { editorView, markdownContent, wrapSelection, insertText, prefixLines, replaceRange, setContent, undo, redo } = useMarkdownEditor(editorContainer, onCursorChange)

// ── 內文圖片上傳（選檔 / 拖曳 / 貼上，皆走同一套上傳邏輯） ───────────────────
const { uploadImages } = useEditorImageUpload({
  insertText,
  replaceRange,
})

async function onInsertImages(files: File[]) {
  await uploadImages(files)
}

const isDraggingImage = ref(false)
let dragDepth = 0

function onEditorDragEnter(e: DragEvent) {
  if (e.dataTransfer?.types.includes('Files')) {
    dragDepth++
    isDraggingImage.value = true
  }
}

function onEditorDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDraggingImage.value = false
}

async function onEditorDrop(e: DragEvent) {
  dragDepth = 0
  isDraggingImage.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length > 0) await uploadImages(files)
}

async function onEditorPaste(e: ClipboardEvent) {
  const items = Array.from(e.clipboardData?.items ?? [])
  const imageFiles = items
    .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
    .map(item => item.getAsFile())
    .filter((f): f is File => f !== null)
  if (imageFiles.length === 0) return
  e.preventDefault()
  await uploadImages(imageFiles)
}

// ── Editor outline ─────────────────────────────────────────────────────────
const { outline, activeLineIndex, updateCursorLine, jumpToLine } = useEditorOutline(markdownContent, editorView)
_updateCursorLine = updateCursorLine

// ── Markdown preview ───────────────────────────────────────────────────────
const { renderedHtml } = useMarkdownRenderer(markdownContent)

// ── 未發布草稿圖片改走帶認證 blob 載入（會開編輯器的必是作者/管理員，永遠啟用）──────
const editorPreviewEl = ref<HTMLElement | null>(null)
useAuthedImages(editorPreviewEl, () => renderedHtml.value)

// ── 讀者端無法顯示的圖片警告 ───────────────────────────────────────────────
// 正式環境 CSP 的 img-src 只放行 'self' blob:，外部圖床與 data: 內嵌圖片在讀者端會破圖（Yuan 2026-11-07：CSP 維持嚴格，改在編輯器警告）。
const externalImageCount = computed(
  () => findUnrenderableImages(markdownContent.value, window.location.origin).length,
)

// ── Word count ─────────────────────────────────────────────────────────────
const { wordCount, characterCount } = useWordCount(markdownContent)
const { wordUnit } = useEditorWordUnit()
const displayWordCount = computed(() => (wordUnit.value === 'words' ? wordCount.value : characterCount.value))

// ── 輸入上限預檢（快照 Create/UpdateArticleRequest：content／title／summary）──────────
// 內文字數以 UTF-16 code unit 計（與後端 @Size 一致），不同於上面給讀者看的字數／字元統計。
const fmt = (n: number) => n.toLocaleString('en-US')
const contentLength = computed(() => markdownContent.value.length)
const contentExceeded = computed(() => exceedsLength(markdownContent.value, MAX_ARTICLE_CONTENT_LENGTH))
const showContentLimitHint = computed(() => isNearLimit(contentLength.value, MAX_ARTICLE_CONTENT_LENGTH))
const contentLimitHint = computed(() =>
  contentExceeded.value
    ? `內文超過 ${fmt(MAX_ARTICLE_CONTENT_LENGTH)} 字上限（目前 ${fmt(contentLength.value)} 字），請刪減後再儲存`
    : `內文已 ${fmt(contentLength.value)} / ${fmt(MAX_ARTICLE_CONTENT_LENGTH)} 字，快到上限了`,
)

// ── Editor mode (Write / Split / Preview) ───────────────────────────────────
const { mode, setMode } = useEditorMode()

// ── Form state ─────────────────────────────────────────────────────────────
const {
  title, summary, coverImageUrl, categoryIds, tagNames,
  isNew, isDirty, isSaving, isLoadingArticle, article, loadArticle, saveDraft, submitForReview,
} = useEditorForm(props.uuid)

// ── 離開前確認（D5）─────────────────────────────────────────────────────────
// useEditorForm.isDirty 只涵蓋標題 / 摘要 / 封面 / 分類 / 標籤；內文在 CodeMirror，
// 另以「與最後一次載入 / 儲存的內容比對」判斷。載入既有文章、儲存、還原版本都會更新基準。
const baselineContent = ref('')
const hasUnsavedChanges = computed(() => isDirty.value || markdownContent.value !== baselineContent.value)
const authStore = useAuthStore()
// session 已失效時導向登入頁是系統行為：使用者按取消只會停在已失效的 session 裡（儲存也會 401），故放行
useUnsavedChangesGuard(hasUnsavedChanges, {
  skipFor: (to) => to.name === 'login' && !authStore.isAuthenticated,
})

// ── Categories ─────────────────────────────────────────────────────────────
const categories = ref<CategoryOption[]>([])

const router = useRouter()
const { showToast } = useToast()

// ── Focus mode ─────────────────────────────────────────────────────────────
const { isFocusMode, toggleFocusMode, exitFocusMode } = useEditorFocusMode()

function onGlobalKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFocusMode.value) exitFocusMode()
}
onMounted(() => window.addEventListener('keydown', onGlobalKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeyDown))

// ── Mount: load article in edit mode + load categories ────────────────────
onMounted(async () => {
  categories.value = (await categoryService.getCategories()) ?? []
  if (!isNew.value) {
    await loadArticle()
    if (article.value?.content) {
      setContent(article.value.content)
    }
    baselineContent.value = markdownContent.value
  }
})

// ── 存檔衝突（B2）─────────────────────────────────────────────────────────
// 存檔帶的 version 與伺服器不一致（HTTP 409 / A0208）：文章在別處被改過。
// 不做自動合併，由使用者決定：
//   - 重新載入：以伺服器最新內容取代本機內容（loadArticle 會一併重置 D5 的 dirty 與 version）
//   - 取消：留在原頁、本機內容不動，使用者可以先自行複製內容
// 沿用專案既有的確認慣例（window.confirm；確定 = 重新載入）。
// 後端對所有 version 不一致一律回 A0208，所以內容被改、狀態轉換、加入／移出系列都會觸發，文案要涵蓋。
const CONFLICT_MESSAGE = '這篇文章已在其他地方被修改（內容、狀態或系列設定）。重新載入會捨棄你目前未儲存的內容。'

// 使用者按「取消」後留下常駐提示列：在重新載入成功之前，存檔 / 送審都不再送出，
// 也不再重複跳 confirm（否則每按一次存檔都被同一個對話框打斷）。不自動合併、不強制覆蓋。
const hasUnresolvedConflict = ref(false)
const conflictBannerEl = ref<HTMLElement | null>(null)

function remindToReload() {
  showToast('請先複製你的內容，再按提示列的「重新載入」', 'error')
  conflictBannerEl.value?.focus()
}

async function reloadLatestArticle(): Promise<boolean> {
  const latest = await loadArticle()
  if (!latest) return false
  setContent(latest.content)
  baselineContent.value = markdownContent.value
  return true
}

async function reloadAfterConflict() {
  try {
    if (await reloadLatestArticle()) {
      hasUnresolvedConflict.value = false
      showToast('已重新載入最新內容', 'success')
      return
    }
  } catch {
    // 落到下方錯誤提示
  }
  showToast('重新載入失敗，請稍後再試', 'error')
}

async function handleSaveConflict() {
  if (!window.confirm(CONFLICT_MESSAGE)) {
    hasUnresolvedConflict.value = true
    showToast('尚未儲存：這篇文章已在其他地方被修改', 'error')
    return
  }
  await reloadAfterConflict()
}

/** 存檔前預檢；回傳要給使用者看的訊息，通過則回傳 null */
function findLimitViolation(): string | null {
  if (exceedsLength(title.value, MAX_ARTICLE_TITLE_LENGTH)) {
    return `標題最多 ${MAX_ARTICLE_TITLE_LENGTH} 字（目前 ${title.value.length} 字），請刪減後再儲存`
  }
  if (exceedsLength(summary.value, MAX_ARTICLE_SUMMARY_LENGTH)) {
    return `摘要最多 ${MAX_ARTICLE_SUMMARY_LENGTH} 字（目前 ${summary.value.length} 字），請刪減後再儲存`
  }
  if (contentExceeded.value) return contentLimitHint.value
  return null
}

// ── Save draft ─────────────────────────────────────────────────────────────
async function onSaveDraft() {
  const violation = findLimitViolation()
  if (violation) {
    showToast(violation, 'error')
    return
  }
  if (hasUnresolvedConflict.value) {
    remindToReload()
    return
  }
  try {
    const contentToSave = markdownContent.value
    const saved = await saveDraft(contentToSave)
    baselineContent.value = contentToSave
    showToast('草稿已儲存', 'success')
    if (!props.uuid && saved?.uuid) {
      await router.replace(`/editor/${saved.uuid}`)
    }
  } catch (err) {
    if (isConcurrentUpdateError(err)) {
      await handleSaveConflict()
      return
    }
    // 429 由 apiClient 的全域 toast 提示等待時間，不再疊自己的錯誤 toast
    if (!isRateLimited(err)) showToast('儲存失敗', 'error')
  }
}

// ── Submit for review ──────────────────────────────────────────────────────
async function onSubmitForReview() {
  const violation = findLimitViolation()
  if (violation) {
    showToast(violation, 'error')
    return
  }
  if (hasUnresolvedConflict.value) {
    remindToReload()
    return
  }
  try {
    const contentToSave = markdownContent.value
    await saveDraft(contentToSave)
    baselineContent.value = contentToSave
  } catch (err) {
    if (isConcurrentUpdateError(err)) {
      await handleSaveConflict()
      return
    }
    if (!isRateLimited(err)) showToast('儲存失敗', 'error')
    return
  }
  try {
    await submitForReview()
    showToast('已送出審核', 'success')
  } catch (err) {
    if (!isRateLimited(err)) showToast('送出失敗', 'error')
  }
}

// ── 版本還原接線 ───────────────────────────────────────────────────────────
// EditorMetaSidebar 的 History tab 在使用者確認後會呼叫 articleVersionService.restore()，
// 後端此時已把文章還原成舊版本，但編輯器畫面仍停在舊的（新）內容。
//
// 還原後的正確資料一律以「重抓文章」為準，不用 version detail 重設編輯器：
//   1. restore 端點回 ApiResponse<Void>，本來就不帶內容；
//   2. VersionDetailResponse.tags 是 List<UUID>（後端以 tagFacade.findTagIdsByArticleUuid()
//      賦值），是 tag ID 不是名稱——灌進 tagNames 再儲存會用 UUID 當標籤名，
//      在全站共用的標籤表建出垃圾標籤並丟失原標籤；且 VersionDetailResponse 也沒有 categoryId。
//   3. GET /api/v1/articles/{uuid}/edit 回的 EditorArticleResponse 才帶標籤名稱與分類。
// 不重設畫面則使用者接著按「儲存草稿」會把剛還原的版本立刻覆蓋回去，所以必須重抓。
function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : '請稍後再試'
}

async function onVersionRestored() {
  try {
    const restored = await loadArticle()
    if (!restored) throw new Error('讀不到還原後的文章')
    setContent(restored.content)
    baselineContent.value = markdownContent.value
    showToast('已套用還原版本的內容', 'success')
  } catch (err) {
    showToast(
      '無法同步還原後的內容，畫面可能與伺服器不一致：' + getErrorMessage(err),
      'error',
    )
  }
}
</script>

<template>
  <div
    class="editor-shell"
    data-testid="editor-root"
    :class="{ 'focus-mode': isFocusMode }"
  >

    <!-- Meta bar (hidden in focus mode) -->
    <div v-show="!isFocusMode" class="ed-topbar">
      <input
        v-model="title"
        class="ed-title-input"
        data-testid="editor-title-input"
        :maxlength="MAX_ARTICLE_TITLE_LENGTH"
        type="text"
        aria-label="文章標題"
        placeholder="文章標題..."
      />
      <span class="ed-status" data-testid="editor-word-count">{{ displayWordCount }} 字</span>

      <div class="ed-actions">
        <!-- Editor mode segmented control (Write / Split / Preview) -->
        <div class="ed-mode" data-testid="editor-mode-toggle">
          <button
            type="button"
            data-testid="editor-mode-write"
            :class="{ active: mode === 'write' }"
            title="只顯示編輯器"
            @click="setMode('write')"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
              <path d="M2 3h12M2 7h12M2 11h8" />
            </svg>
            Write
          </button>
          <button
            type="button"
            data-testid="editor-mode-split"
            :class="{ active: mode === 'split' }"
            title="左寫 · 右看"
            @click="setMode('split')"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
              <rect x="1.5" y="2" width="6" height="12" rx="1" />
              <rect x="8.5" y="2" width="6" height="12" rx="1" fill="currentColor" opacity="0.15" />
            </svg>
            Split
          </button>
          <button
            type="button"
            data-testid="editor-mode-preview"
            :class="{ active: mode === 'preview' }"
            title="只顯示預覽"
            @click="setMode('preview')"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
              <path d="M1.5 8s2.5-5 6.5-5 6.5 5 6.5 5-2.5 5-6.5 5S1.5 8 1.5 8z" />
              <circle cx="8" cy="8" r="2" />
            </svg>
            Preview
          </button>
        </div>

        <button
          type="button"
          class="ed-btn"
          data-testid="editor-save-btn"
          :disabled="isSaving || isLoadingArticle"
          @click="onSaveDraft"
        >
          {{ isSaving ? '儲存中...' : '儲存草稿' }}
        </button>
        <button
          type="button"
          class="ed-btn primary"
          data-testid="editor-publish-btn"
          :disabled="isSaving || isLoadingArticle"
          @click="onSubmitForReview"
        >
          送出審核
        </button>
        <button
          type="button"
          class="ed-btn"
          data-testid="editor-focus-btn"
          :class="{ 'btn--active': isFocusMode }"
          @click="toggleFocusMode"
          :title="isFocusMode ? 'Exit focus (ESC)' : 'Focus mode'"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
            <path d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3" />
          </svg>
          {{ isFocusMode ? 'Exit focus' : 'Focus' }}
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <EditorToolbar
      @wrap-selection="wrapSelection"
      @insert-text="insertText"
      @prefix-lines="prefixLines"
      @undo="undo"
      @redo="redo"
      @insert-images="onInsertImages"
    />

    <!-- 存檔衝突提示列（B2）：使用者取消重新載入後常駐，直到重新載入成功 -->
    <div
      v-if="hasUnresolvedConflict"
      ref="conflictBannerEl"
      class="ed-image-warning ed-conflict-banner"
      role="alert"
      tabindex="-1"
      data-testid="editor-conflict-banner"
    >
      <span>文章已在其他地方被修改，請先複製你的內容，再按「重新載入」</span>
      <button
        type="button"
        class="ed-btn"
        data-testid="editor-conflict-reload"
        :disabled="isLoadingArticle"
        @click="reloadAfterConflict"
      >
        重新載入
      </button>
    </div>

    <!-- 內文字數接近／超過上限（快照 content maxLength 200000）；超過時存檔與送審會被擋下 -->
    <div
      v-if="showContentLimitHint"
      :class="contentExceeded ? 'ed-image-warning' : 'ed-limit-hint'"
      :role="contentExceeded ? 'alert' : 'status'"
      data-testid="editor-content-limit-hint"
    >
      {{ contentLimitHint }}
    </div>

    <!-- 外部圖片警告（CSP 不放行外部圖片，發布後讀者端會破圖） -->
    <div
      v-if="externalImageCount > 0 && !isFocusMode"
      class="ed-image-warning"
      role="status"
      data-testid="editor-external-image-warning"
    >
      內文含 {{ externalImageCount }} 張外部或內嵌（data:）圖片，發布後讀者端無法顯示，請改用上傳插圖
    </div>

    <!-- Split pane body -->
    <div class="editor-body">
      <!-- Left: CodeMirror editor (v-show, not v-if — 保留 CodeMirror 實例，避免 mode 切換時重建) -->
      <div
        v-show="mode !== 'preview'"
        class="editor-pane"
        data-testid="editor-textarea"
        @dragenter.prevent="onEditorDragEnter"
        @dragover.prevent
        @dragleave.prevent="onEditorDragLeave"
        @drop.prevent="onEditorDrop"
        @paste="onEditorPaste"
      >
        <div ref="editorContainer" class="editor-pane-inner" />
        <div
          v-if="isDraggingImage"
          class="editor-drop-overlay"
          data-testid="editor-drop-overlay"
        >
          放開以插入圖片
        </div>
      </div>

      <!-- Center: Markdown preview (v-show, not v-if — 保留元素在 DOM 中，
           useAuthedImages 的 editorPreviewEl 才不會在 mode 切換時失效) -->
      <div
        v-show="mode !== 'write'"
        ref="editorPreviewEl"
        class="editor-preview prose"
        data-testid="editor-preview"
        v-html="renderedHtml"
      />

      <!-- Right: Meta sidebar -->
      <EditorMetaSidebar
        :summary="summary"
        :cover-image-url="coverImageUrl"
        :category-ids="categoryIds"
        :tag-names="tagNames"
        :categories="categories"
        :outline="outline"
        :active-heading-line-index="activeLineIndex"
        :article-uuid="article?.uuid ?? null"
        :article-status="article?.status ?? null"
        @update:summary="summary = $event"
        @update:cover-image-url="coverImageUrl = $event"
        @update:category-ids="categoryIds = $event"
        @update:tag-names="tagNames = $event"
        @jump-to-line="jumpToLine"
        @version-restored="onVersionRestored"
      />
    </div>

    <!-- Floating focus mode bar (visible only in focus mode) -->
    <div
      v-show="isFocusMode"
      class="editor-focus-bar"
    >
      <span class="editor-focus-hint">ESC · Exit focus</span>
      <span class="ed-status" data-testid="editor-focus-word-count">{{ displayWordCount }} 字</span>
      <button type="button" class="ed-btn btn--sm" @click="exitFocusMode">
        Exit focus
      </button>
    </div>

  </div>
</template>

<style scoped>
.editor-shell { height: 100vh; display: flex; flex-direction: column; }

/* .ed-topbar 覆寫：設計系統原生 4 欄（auto 1fr auto auto）第一欄留給「返回」連結，
   本頁沒有這段內容；若不覆寫，該欄會是空的 auto 軌道但仍佔一份 gap，
   把標題輸入框往右擠出多餘留白。收斂成 3 欄（1fr auto auto），
   讓標題輸入框直接吃下最左側的 1fr（Vue scoped style 會自動附加
   [data-v-*] 屬性選擇器，specificity 天生高於全域的 .ed-topbar，不受載入順序影響）。 */
.ed-topbar { grid-template-columns: 1fr auto auto; }
/* 設計系統原樣把 .ed-title-input 的 cursor 設為 none（等同隱藏插入點），
   套用在真的可輸入的欄位上會讓打字時看不到游標，體驗有問題，故覆寫回 text。 */
.ed-title-input { cursor: text; }
.ed-image-warning {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  color: var(--danger);
  background: color-mix(in srgb, var(--danger-strong) 10%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--danger-strong) 25%, transparent);
}
.ed-limit-hint {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  color: var(--ink-2);
  border-bottom: 1px solid var(--divider);
}
.ed-conflict-banner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.editor-body { flex: 1; display: flex; overflow: hidden; }
.editor-pane { position: relative; flex: 1; min-width: 0; overflow-y: auto; border-right: 1px solid var(--divider); }
.editor-pane-inner { height: 100%; }
.editor-drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass, rgba(255, 255, 255, 0.85));
  border: 2px dashed var(--accent);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--accent);
  pointer-events: none;
  z-index: 10;
}
.editor-preview { flex: 1; min-width: 0; overflow-y: auto; padding: 2rem; font-family: var(--f-body); }

/* Focus mode: dim all lines, highlight active */
.editor-shell.focus-mode :deep(.cm-line) { opacity: 0.3; transition: opacity 0.2s; }
.editor-shell.focus-mode :deep(.cm-activeLine) { opacity: 1; }

/* Floating mini-bar */
.editor-focus-bar {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 999px;
  box-shadow: var(--shadow-md);
  z-index: 100;
  font-size: 0.8125rem;
}
.editor-focus-hint {
  font-family: var(--f-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  color: var(--muted);
  text-transform: uppercase;
}
/* .ed-btn 尺寸／作用態的工具類：設計系統的 .ed-btn 只有預設／.primary 兩種樣式，
   這兩個 modifier 補齊「小尺寸」（浮動 focus bar 用）與「切換鈕作用態」（Focus 按鈕開啟時）。 */
.btn--sm { padding: 0.25rem 0.75rem; font-size: 0.75rem; }
.btn--active { background: var(--ink); color: var(--bg); }
</style>
