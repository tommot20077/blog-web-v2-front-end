<script setup lang="ts">
import { ref } from 'vue';
import StickyNote from './StickyNote.vue';

// 隨機生成工具
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

// 模擬從後端撈回來的留言
const generateMockNotes = () => {
  const contents = [
    '網站的毛玻璃效果太美了！\n很喜歡這個切換動畫 ✨',
    '可以敲碗 Kubernetes 的實戰教學系列嗎？\n最好有 GitLab CI!',
    '嗨 Tom，很開心發現你的部落格，文章很有料！',
    '測試留言版～～\n這個便利貼設計讓我想到以前用過的真實白板！',
    'Elasticsearch 分詞那篇幫了我大忙，感謝！🙏'
  ];
  
  const authors = ['Alex99', 'CloudNativeBoy', 'FrontendDev', 'Sara', 'DevEngineer'];

  return contents.map((content, index) => ({
    id: `note-${index}`,
    author: authors[index],
    content: content,
    date: '2026-03-21',
    rotation: randomBetween(-6, 6),
    colorKey: index
  }));
};

const notes = ref(generateMockNotes());
</script>

<template>
  <div class="w-full relative py-12 flex flex-col items-center">
    <div class="text-center mb-10 w-full max-w-7xl px-8 flex justify-between items-end border-b pb-4" style="border-color: var(--glass-border)">
      <h2 class="text-2xl font-bold tracking-wider" style="color: var(--ink)">留言板 (Guestbook)</h2>
      <button class="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10 border border-current">
        我要留言
      </button>
    </div>

    <!-- 留言分佈區 -->
    <div class="w-full max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-6 md:gap-10">
      <StickyNote 
        v-for="note in notes" 
        :key="note.id" 
        :note="note" 
      />
    </div>
  </div>
</template>
