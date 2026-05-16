<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CreateHighlightRequest } from '../../api/highlightService'
import type {
  ArticleSelectionAnchor,
  ArticleSelectionPayload,
} from '../../composables/useArticleTextSelection'

const props = defineProps<{
  selectionPayload: ArticleSelectionPayload | null
  selectionError?: string | null
  selectionAnchor?: ArticleSelectionAnchor | null
  isPending: boolean
}>()

const emit = defineEmits<{
  create: [request: CreateHighlightRequest]
}>()

type HighlightColor = CreateHighlightRequest['color']

const colors = [
  { label: '使用黃色劃線', value: '#FFEB3B' },
  { label: '使用綠色劃線', value: '#C8E6C9' },
  { label: '使用藍色劃線', value: '#BBDEFB' },
] satisfies Array<{ label: string; value: HighlightColor }>
const selectedColor = ref<HighlightColor>('#FFEB3B')
const toolbarStyle = computed(() => props.selectionAnchor
  ? {
      top: `${props.selectionAnchor.top}px`,
      left: `${props.selectionAnchor.left}px`,
    }
  : undefined)

function submit() {
  if (!props.selectionPayload || props.isPending) return
  emit('create', {
    ...props.selectionPayload,
    color: selectedColor.value,
  })
}
</script>

<template>
  <div
    v-if="selectionPayload || selectionError"
    class="article-highlight-toolbar"
    :class="{ 'is-floating': selectionAnchor }"
    :style="toolbarStyle"
    data-testid="article-highlight-toolbar"
  >
    <p v-if="selectionError" class="highlight-error" role="alert">{{ selectionError }}</p>
    <template v-if="selectionPayload">
      <button
        v-for="(color, index) in colors"
        :key="color.value"
        type="button"
        class="highlight-color"
        :class="{ active: selectedColor === color.value }"
        :style="{ backgroundColor: color.value }"
        :aria-label="color.label"
        :aria-pressed="selectedColor === color.value"
        :data-testid="`highlight-color-${index}`"
        @click="selectedColor = color.value"
      />
      <button
        type="button"
        class="highlight-create"
        data-testid="highlight-create-button"
        :disabled="isPending"
        @click="submit"
      >
        新增劃線
      </button>
    </template>
  </div>
</template>

<style scoped>
.article-highlight-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
}
.article-highlight-toolbar.is-floating {
  position: fixed;
  z-index: 40;
  margin: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .14);
  transform: translate(-50%, calc(-100% - 10px));
}
.highlight-color {
  width: 22px;
  height: 22px;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
}
.highlight-color.active {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}
.highlight-error {
  margin: 0;
  color: #c54235;
  font-size: 13px;
}
.highlight-create {
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--ink);
  color: var(--bg);
  padding: 6px 10px;
  cursor: pointer;
}
.highlight-create:disabled {
  cursor: wait;
  opacity: .6;
}
</style>
