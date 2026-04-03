<script setup lang="ts">
import { toRef } from 'vue'
import { useMarkdownRenderer } from '../../composables/useMarkdownRenderer'

const props = defineProps<{
  content: string
}>()

const contentRef = toRef(props, 'content')
const { renderedHtml } = useMarkdownRenderer(contentRef)
</script>

<template>
  <div class="h-full overflow-auto px-6 py-4 bg-white/40 dark:bg-white/5">
    <div
      data-testid="preview-content"
      class="prose prose-sm max-w-none dark:prose-invert"
      v-html="renderedHtml"
    />
  </div>
</template>
