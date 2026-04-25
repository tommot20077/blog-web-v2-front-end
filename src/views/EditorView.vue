<script setup lang="ts">
import { shallowRef, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorForm } from '../composables/useEditorForm'
import { useMarkdownEditor } from '../composables/useMarkdownEditor'
import { useMarkdownRenderer } from '../composables/useMarkdownRenderer'
import { useWordCount } from '../composables/useWordCount'
import { useToast } from '../composables/useToast'
import { useEditorFocusMode } from '../composables/useEditorFocusMode'
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
const { markdownContent, wrapSelection, insertText, prefixLines, setContent, undo, redo } = useMarkdownEditor(editorContainer)

// ── Markdown preview ───────────────────────────────────────────────────────
const { renderedHtml } = useMarkdownRenderer(markdownContent)

// ── Word count ─────────────────────────────────────────────────────────────
const { wordCount } = useWordCount(markdownContent)

// ── Form state ─────────────────────────────────────────────────────────────
const {
  title, summary, coverImageUrl, categoryIds, tagNames,
  isNew, isSaving, article, loadArticle, saveDraft, submitForReview,
} = useEditorForm(props.uuid)

// ── Categories ─────────────────────────────────────────────────────────────
const categories = ref<CategoryOption[]>([])

const router = useRouter()
const { showToast } = useToast()

// ── Focus mode ─────────────────────────────────────────────────────────────
const { isFocusMode, toggleFocusMode, exitFocusMode } = useEditorFocusMode()

// ── Mount: load article in edit mode + load categories ────────────────────
onMounted(async () => {
  categories.value = await categoryService.getCategories()
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
</script>

<template>
  <div
    class="editor-shell"
    data-testid="editor-root"
    :class="{ 'focus-mode': isFocusMode }"
    @keydown.escape="exitFocusMode"
  >

    <!-- Meta bar (hidden in focus mode) -->
    <div v-show="!isFocusMode" class="editor-meta">
      <input
        v-model="title"
        class="editor-title-input"
        data-testid="editor-title-input"
        type="text"
        placeholder="文章標題..."
      />
      <span class="editor-word-count">{{ wordCount }} 字</span>
      <button
        type="button"
        class="btn btn--ghost"
        data-testid="editor-save-btn"
        :disabled="isSaving"
        @click="onSaveDraft"
      >
        {{ isSaving ? '儲存中...' : '儲存草稿' }}
      </button>
      <button
        type="button"
        class="btn btn--primary"
        data-testid="editor-publish-btn"
        :disabled="isSaving"
        @click="onSubmitForReview"
      >
        送出審核
      </button>
      <button
        type="button"
        class="btn btn--ghost"
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

    <!-- Toolbar -->
    <EditorToolbar
      @wrap-selection="wrapSelection"
      @insert-text="insertText"
      @prefix-lines="prefixLines"
      @undo="undo"
      @redo="redo"
    />

    <!-- Split pane body -->
    <div class="editor-body">
      <!-- Left: CodeMirror editor -->
      <div
        ref="editorContainer"
        class="editor-pane"
        data-testid="editor-textarea"
      />

      <!-- Center: Markdown preview -->
      <div
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
        @update:summary="summary = $event"
        @update:cover-image-url="coverImageUrl = $event"
        @update:category-ids="categoryIds = $event"
        @update:tag-names="tagNames = $event"
      />
    </div>

    <!-- Floating focus mode bar (visible only in focus mode) -->
    <div
      v-show="isFocusMode"
      class="editor-focus-bar"
    >
      <span class="editor-focus-hint">ESC · Exit focus</span>
      <span class="editor-word-count">{{ wordCount }} 字</span>
      <button type="button" class="btn btn--ghost btn--sm" @click="exitFocusMode">
        Exit focus
      </button>
    </div>

  </div>
</template>

<style scoped>
.editor-shell { height: 100vh; display: flex; flex-direction: column; }
.editor-meta { display: flex; gap: 1rem; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--divider); }
.editor-title-input { flex: 1; font-family: var(--f-display); font-size: 1.5rem; background: none; border: none; color: var(--ink); outline: none; }
.editor-word-count { font-size: 0.875rem; color: var(--ink-muted, #888); white-space: nowrap; }
.editor-body { flex: 1; display: flex; overflow: hidden; }
.editor-pane { flex: 1; min-width: 0; overflow-y: auto; border-right: 1px solid var(--divider); }
.editor-preview { flex: 1; min-width: 0; overflow-y: auto; padding: 2rem; font-family: var(--f-body); }

/* Focus mode: dim all lines, highlight active */
.editor-shell.focus-mode .cm-line { opacity: 0.3; transition: opacity 0.2s; }
.editor-shell.focus-mode .cm-activeLine { opacity: 1; }

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
.btn--sm { padding: 0.25rem 0.75rem; font-size: 0.75rem; }
.btn--active { background: var(--ink); color: var(--bg); }
</style>
