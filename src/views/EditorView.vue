<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorForm } from '../composables/useEditorForm'
import { useMarkdownEditor } from '../composables/useMarkdownEditor'
import { useMarkdownRenderer } from '../composables/useMarkdownRenderer'
import { useToast } from '../composables/useToast'

const props = defineProps<{
  uuid?: string
}>()

// ── CodeMirror mount target ────────────────────────────────────────────────
const editorContainer = shallowRef<HTMLElement | null>(null)

// ── CodeMirror editor (PRESERVE: composable + ref name) ───────────────────
const { markdownContent, setContent } = useMarkdownEditor(editorContainer)

// ── Markdown preview ───────────────────────────────────────────────────────
const { renderedHtml } = useMarkdownRenderer(markdownContent)

// ── Form state ─────────────────────────────────────────────────────────────
const {
  title, tagNames,
  isNew, isSaving, article, loadArticle, saveDraft, submitForReview,
} = useEditorForm(props.uuid)

const router = useRouter()
const { showToast } = useToast()

// ── Mount: load article in edit mode ──────────────────────────────────────
onMounted(async () => {
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
      <input
        :value="tagNames.join(', ')"
        class="editor-tags-input"
        data-testid="editor-tags-input"
        type="text"
        placeholder="標籤（逗號分隔）..."
        @change="tagNames = ($event.target as HTMLInputElement).value.split(',').map(t => t.trim()).filter(Boolean)"
      />
      <button
        type="button"
        class="btn btn--ghost"
        data-testid="editor-save-btn"
        :disabled="isSaving"
        @click="onSaveDraft"
      >
        {{ isSaving ? '儲存中...' : 'Save Draft' }}
      </button>
      <button
        type="button"
        class="btn btn--primary"
        data-testid="editor-publish-btn"
        :disabled="isSaving"
        @click="onSubmitForReview"
      >
        Publish
      </button>
    </div>

    <!-- Split pane body -->
    <div class="editor-body">
      <!-- Left: CodeMirror editor -->
      <div
        ref="editorContainer"
        class="editor-pane"
        data-testid="editor-textarea"
      />

      <!-- Right: Markdown preview -->
      <div
        class="editor-preview prose"
        data-testid="editor-preview"
        v-html="renderedHtml"
      />
    </div>

  </div>
</template>

<style scoped>
.editor-shell { height: 100vh; display: flex; flex-direction: column; }
.editor-meta { display: flex; gap: 1rem; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--divider); }
.editor-title-input { flex: 1; font-family: var(--f-display); font-size: 1.5rem; background: none; border: none; color: var(--ink); outline: none; }
.editor-body { flex: 1; display: flex; overflow: hidden; }
.editor-pane { flex: 1; overflow-y: auto; border-right: 1px solid var(--divider); }
.editor-preview { flex: 1; overflow-y: auto; padding: 2rem; font-family: var(--f-body); }
</style>
