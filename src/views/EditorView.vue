<script setup lang="ts">
import { shallowRef, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorForm } from '../composables/useEditorForm'
import { useMarkdownEditor } from '../composables/useMarkdownEditor'
import { useMarkdownRenderer } from '../composables/useMarkdownRenderer'
import { useWordCount } from '../composables/useWordCount'
import { useToast } from '../composables/useToast'
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
  <div class="editor-shell" data-testid="editor-root">

    <!-- Meta bar -->
    <div class="editor-meta">
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
</style>
