<script setup lang="ts">
import { ref } from 'vue'
import type { CreateHighlightRequest } from '../../api/highlightService'
import type { ArticleSelectionPayload } from '../../composables/useArticleTextSelection'

const props = defineProps<{
  selectionPayload: ArticleSelectionPayload | null
  isPending: boolean
}>()

const emit = defineEmits<{
  create: [request: CreateHighlightRequest]
}>()

const colors = ['#FFEB3B', '#C8E6C9', '#BBDEFB']
const selectedColor = ref(colors[0])

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
    v-if="selectionPayload"
    class="article-highlight-toolbar"
    data-testid="article-highlight-toolbar"
  >
    <button
      v-for="(color, index) in colors"
      :key="color"
      type="button"
      class="highlight-color"
      :class="{ active: selectedColor === color }"
      :style="{ backgroundColor: color }"
      :data-testid="`highlight-color-${index}`"
      @click="selectedColor = color"
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
