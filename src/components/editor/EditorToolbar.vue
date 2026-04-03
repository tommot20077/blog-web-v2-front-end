<script setup lang="ts">
const emit = defineEmits<{
  'wrap-selection': [before: string, after: string]
  'insert-text': [text: string]
  'prefix-lines': [prefix: string]
  'undo': []
  'redo': []
}>()

const groups = [
  // 標題
  [
    { title: 'H1', icon: 'H₁', action: () => emit('prefix-lines', '# ') },
    { title: 'H2', icon: 'H₂', action: () => emit('prefix-lines', '## ') },
    { title: 'H3', icon: 'H₃', action: () => emit('prefix-lines', '### ') },
  ],
  // 行內格式
  [
    { title: '粗體', icon: 'B', action: () => emit('wrap-selection', '**', '**') },
    { title: '斜體', icon: 'I', action: () => emit('wrap-selection', '*', '*') },
    { title: '刪除線', icon: 'S̶', action: () => emit('wrap-selection', '~~', '~~') },
  ],
  // 區塊
  [
    { title: '程式碼區塊', icon: '<>', action: () => emit('insert-text', '```\n\n```') },
    { title: '引用', icon: '❝', action: () => emit('prefix-lines', '> ') },
    { title: '分隔線', icon: '—', action: () => emit('insert-text', '\n---\n') },
  ],
  // 列表
  [
    { title: '有序列表', icon: '1.', action: () => emit('prefix-lines', '1. ') },
    { title: '無序列表', icon: '•', action: () => emit('prefix-lines', '- ') },
  ],
  // 媒體
  [
    { title: '連結', icon: '🔗', action: () => emit('insert-text', '[連結文字](https://)') },
    { title: '圖片', icon: '🖼', action: () => emit('insert-text', '![替代文字](https://)') },
  ],
  // 歷史
  [
    { title: '復原', icon: '↩', action: () => emit('undo') },
    { title: '重做', icon: '↪', action: () => emit('redo') },
  ],
]
</script>

<template>
  <div class="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-white/60 backdrop-blur-md border-b border-white/80 dark:bg-white/8 dark:border-white/15">
    <template v-for="(group, gi) in groups" :key="gi">
      <button
        v-for="btn in group"
        :key="btn.title"
        :title="btn.title"
        type="button"
        class="px-2 py-1 rounded-lg text-sm font-medium hover:bg-white/40 dark:hover:bg-white/10 transition-colors min-w-[2rem] text-center"
        @click="btn.action"
      >
        {{ btn.icon }}
      </button>
      <div
        v-if="gi < groups.length - 1"
        class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5"
      />
    </template>
  </div>
</template>
