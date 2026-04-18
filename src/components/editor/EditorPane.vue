<script setup lang="ts">
import { shallowRef, onMounted, watch } from 'vue'
import { useMarkdownEditor } from '../../composables/useMarkdownEditor'

const props = defineProps<{
  initialContent?: string
}>()

const containerRef = shallowRef<HTMLElement | null>(null)
const { editorView, markdownContent, wrapSelection, insertText, prefixLines, setContent, undo, redo } =
  useMarkdownEditor(containerRef)

onMounted(() => {
  if (props.initialContent) {
    setContent(props.initialContent)
  }
})

watch(
  () => props.initialContent,
  (val) => {
    if (val !== undefined && editorView.value) {
      setContent(val)
    }
  },
)

defineExpose({ wrapSelection, insertText, prefixLines, setContent, markdownContent, undo, redo })
</script>

<template>
  <div
    ref="containerRef"
    data-testid="editor-container"
    class="h-full overflow-auto font-mono text-sm"
  />
</template>
