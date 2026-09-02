<script setup lang="ts">
import { shallowRef, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorForm } from '../composables/useEditorForm'
import { useMarkdownEditor } from '../composables/useMarkdownEditor'
import { useMarkdownRenderer } from '../composables/useMarkdownRenderer'
import { useWordCount } from '../composables/useWordCount'
import { useEditorMode } from '../composables/useEditorMode'
import { useEditorWordUnit } from '../composables/useEditorWordUnit'
import { useToast } from '../composables/useToast'
import { useEditorFocusMode } from '../composables/useEditorFocusMode'
import { useEditorOutline } from '../composables/useEditorOutline'
import { useEditorImageUpload } from '../composables/useEditorImageUpload'
import { categoryService } from '../api/categoryService'
import { articleVersionService } from '../api/real/articleVersionService'
import type { VersionSummaryResponse } from '../api/real/articleVersionService'
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

const { editorView, markdownContent, wrapSelection, insertText, prefixLines, setContent, undo, redo } = useMarkdownEditor(editorContainer, onCursorChange)

// ── 內文圖片上傳（選檔 / 拖曳 / 貼上，皆走同一套上傳邏輯） ───────────────────
const { uploadImages } = useEditorImageUpload({
  insertText,
  getContent: () => markdownContent.value,
  setContent,
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

// ── Word count ─────────────────────────────────────────────────────────────
const { wordCount, characterCount } = useWordCount(markdownContent)
const { wordUnit } = useEditorWordUnit()
const displayWordCount = computed(() => (wordUnit.value === 'words' ? wordCount.value : characterCount.value))

// ── Editor mode (Write / Split / Preview) ───────────────────────────────────
const { mode, setMode } = useEditorMode()

// ── Form state ─────────────────────────────────────────────────────────────
const {
  title, summary, coverImageUrl, categoryIds, tagNames,
  isNew, isSaving, isLoadingArticle, article, loadArticle, saveDraft, submitForReview,
} = useEditorForm(props.uuid)

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
  }
})

// ── Save draft ─────────────────────────────────────────────────────────────
async function onSaveDraft() {
  try {
    const saved = await saveDraft(markdownContent.value)
    showToast('草稿已儲存', 'success')
    if (!props.uuid && saved?.uuid) {
      await router.replace(`/editor/${saved.uuid}`)
    }
  } catch {
    showToast('儲存失敗', 'error')
  }
}

// ── Submit for review ──────────────────────────────────────────────────────
async function onSubmitForReview() {
  try {
    await saveDraft(markdownContent.value)
  } catch {
    showToast('儲存失敗', 'error')
    return
  }
  try {
    await submitForReview()
    showToast('已送出審核', 'success')
  } catch {
    showToast('送出失敗', 'error')
  }
}

// ── 版本還原接線 ───────────────────────────────────────────────────────────
// EditorMetaSidebar 的 History tab 在使用者確認後會呼叫 articleVersionService.restore()，
// 後端此時已把文章還原成舊版本，但編輯器畫面仍停在舊的（新）內容。
// 這裡收到 version-restored 後，改呼叫 getDetail() 取得完整內容並套用到編輯器狀態，
// 讓畫面與伺服器保持一致；否則使用者接著按「儲存草稿」會把剛還原的版本立刻覆蓋回去。
function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : '請稍後再試'
}

async function onVersionRestored(version: VersionSummaryResponse) {
  const targetUuid = article.value?.uuid
  if (!targetUuid) return

  try {
    const detail = await articleVersionService.getDetail(targetUuid, version.uuid)
    title.value = detail.title
    summary.value = detail.summary ?? ''
    coverImageUrl.value = detail.coverImageUrl ?? null
    // VersionDetailResponse 沒有 categoryId 欄位（後端契約），保留使用者當前選擇，不清空。
    tagNames.value = detail.tags ?? []
    setContent(detail.content)
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
        type="text"
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

      <!-- Center: Markdown preview -->
      <div
        v-show="mode !== 'write'"
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
