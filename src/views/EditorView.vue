<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import EditorToolbar from '../components/editor/EditorToolbar.vue'
import EditorPane from '../components/editor/EditorPane.vue'
import EditorPreview from '../components/editor/EditorPreview.vue'
import EditorMetaSidebar from '../components/editor/EditorMetaSidebar.vue'
import { useEditorForm } from '../composables/useEditorForm'
import { categoryService } from '../api/categoryService'
import { useToast } from '../composables/useToast'
import type { CategoryOption } from '../types/editor'
import type { Ref } from 'vue'

const props = defineProps<{
  uuid?: string
}>()

// ── 編輯器面板 ref ─────────────────────────────────────────────────────────
const editorPane = ref<InstanceType<typeof EditorPane> | null>(null)
const markdownContent = ref('')

// 等 EditorPane 掛載後追蹤其 markdownContent；使用 onCleanup 確保舊 watcher 被停止
watch(editorPane, (pane, _prev, onCleanup) => {
  if (!pane) return
  const exposed = (pane as unknown as { markdownContent: Ref<string> }).markdownContent
  if (!exposed) return
  const stop = watch(exposed, (val) => { markdownContent.value = val }, { immediate: true })
  onCleanup(stop)
})

// ── 分類 ──────────────────────────────────────────────────────────────────
const categories = ref<CategoryOption[]>([])

// ── 表單狀態 ──────────────────────────────────────────────────────────────
const {
  title, summary, coverImageUrl, categoryIds, tagNames,
  isNew, isSaving, article, loadArticle, saveDraft, submitForReview,
} = useEditorForm(props.uuid)

const { showToast } = useToast()

const wordCount = computed(() => markdownContent.value.trim().length)

// ── 掛載：載入分類 + 編輯模式填入表單 ──────────────────────────────────────
onMounted(async () => {
  categories.value = await categoryService.getCategories()

  if (!isNew.value) {
    await loadArticle()
    if (article.value?.content) {
      editorPane.value?.setContent(article.value.content)
    }
  }
})

// ── 儲存草稿 ──────────────────────────────────────────────────────────────
async function onSaveDraft() {
  try {
    await saveDraft(markdownContent.value)
    showToast('草稿已儲存', 'success')
  } catch (error) {
    showToast('儲存失敗', 'error')
    throw error
  }
}

// ── 送出審核 ──────────────────────────────────────────────────────────────
// 直接呼叫 saveDraft()，失敗時顯示錯誤並中止；不透過 onSaveDraft() 以避免雙重 toast
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

// ── 工具列事件 ────────────────────────────────────────────────────────────
function onWrapSelection(before: string, after: string) {
  editorPane.value?.wrapSelection(before, after)
}
function onInsertText(text: string) {
  editorPane.value?.insertText(text)
}
function onPrefixLines(prefix: string) {
  editorPane.value?.prefixLines(prefix)
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">

    <!-- 標題列 -->
    <div class="shrink-0 px-6 py-3 border-b border-white/80 dark:border-white/15 bg-white/60 backdrop-blur-md dark:bg-white/8">
      <input
        v-model="title"
        type="text"
        placeholder="文章標題..."
        class="w-full text-2xl font-bold bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-600"
      />
    </div>

    <!-- 主體 -->
    <div class="flex flex-1 min-h-0 overflow-hidden">

      <!-- 左側：工具列 + 編輯 / 預覽 -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <EditorToolbar
          @wrap-selection="onWrapSelection"
          @insert-text="onInsertText"
          @prefix-lines="onPrefixLines"
          @undo="editorPane?.undo?.()"
          @redo="editorPane?.redo?.()"
        />

        <Splitpanes class="flex-1 min-h-0">
          <Pane :min-size="20" class="min-h-0 overflow-hidden">
            <EditorPane ref="editorPane" class="h-full" />
          </Pane>
          <Pane :min-size="20" class="min-h-0 overflow-hidden">
            <EditorPreview :content="markdownContent" class="h-full" />
          </Pane>
        </Splitpanes>
      </div>

      <!-- 右側 Meta 側欄 -->
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

    <!-- 底部 ActionBar -->
    <div class="shrink-0 flex items-center justify-between px-6 py-2 border-t border-white/80 dark:border-white/15 bg-white/60 backdrop-blur-md dark:bg-white/8">
      <span class="text-sm text-gray-500">{{ wordCount }} 字</span>
      <div class="flex gap-2">
        <button
          type="button"
          class="px-4 py-1.5 rounded-full text-sm bg-white/60 border border-white/80 hover:bg-white/80 transition-colors disabled:opacity-50"
          :disabled="isSaving"
          @click="onSaveDraft"
        >
          {{ isSaving ? '儲存中...' : '儲存草稿' }}
        </button>
        <button
          type="button"
          class="px-4 py-1.5 rounded-full text-sm bg-[var(--accent-color)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          :disabled="isSaving"
          @click="onSubmitForReview"
        >
          送出審核
        </button>
      </div>
    </div>

  </div>
</template>

<style>
@import 'splitpanes/dist/splitpanes.css';

.splitpanes__splitter {
  background: rgba(255, 255, 255, 0.5);
  border: none;
  width: 4px;
  cursor: col-resize;
  transition: background 0.2s;
}
.splitpanes__splitter:hover {
  background: var(--accent-color);
}
</style>
