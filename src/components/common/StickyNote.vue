<script setup lang="ts">
import { defineProps } from 'vue';

interface Note {
  id: string;
  author: string;
  content: string;
  date: string;
  rotation: number;     // 隨機旋轉角度
  colorKey: number;     // 隨機顏色索引
}

const props = defineProps<{
  note: Note;
}>();

// 改用更低調、更適應毛玻璃冷調風格的配色，避免太突兀的粉彩
const noteColors = [
  'var(--glass-panel)', // 預設毛玻璃背景
  'rgba(255, 141, 40, 0.15)', // 帶有一點網站主輔色 (Accent) 的微光
  'rgba(20, 20, 20, 0.05)',   // 較深的玻璃灰
  'rgba(255, 255, 255, 0.2)', // 較亮的白透
  'rgba(150, 150, 150, 0.1)'  // 中性沈穩的灰色透光
];

const getNoteStyle = (note: Note) => {
  return {
    transform: `rotate(${note.rotation}deg)`,
    backgroundColor: noteColors[note.colorKey % noteColors.length],
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--glass-border)',
  };
};
</script>

<template>
  <div 
    class="relative w-48 h-48 md:w-56 md:h-56 p-4 rounded-xl shadow-sm cursor-pointer transition-all duration-300 ease-out hover:!rotate-0 hover:scale-[1.08] hover:shadow-2xl hover:-translate-y-2 hover:z-50 select-none group flex flex-col"
    style="color: var(--text-main);"  
    :style="getNoteStyle(note)"
  >
    <!-- 圖釘/膠帶裝飾 -->
    <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/40 shadow-sm rotate-[-2deg] opacity-70"></div>
    
    <!-- 內容 -->
    <p class="text-sm md:text-base font-medium leading-relaxed leading-snug flex-grow whitespace-pre-wrap overflow-hidden">
      {{ note.content }}
    </p>

    <!-- 作者與時間 -->
    <div class="flex flex-col mt-auto text-xs opacity-70 border-t border-black/10 pt-2 font-medium">
      <span class="font-bold">- {{ note.author }}</span>
      <span class="text-[10px] mt-0.5">{{ note.date }}</span>
    </div>
  </div>
</template>
