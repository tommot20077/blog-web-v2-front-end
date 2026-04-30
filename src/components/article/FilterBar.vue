<script setup lang="ts">
import { ref } from 'vue';

const categories = ['全部', 'Frontend', 'Backend', 'DevOps', 'UI/UX', 'Life'];
const activeCategory = ref('全部');
const viewMode = ref<'grid'|'list'>('grid');

const emit = defineEmits<{
  (e: 'filter', category: string, keyword: string, mode: 'grid'|'list'): void
}>();

const keyword = ref('');

const selectCategory = (cat: string) => {
  activeCategory.value = cat;
  emitFilter();
};

const toggleMode = (mode: 'grid'|'list') => {
  viewMode.value = mode;
  emitFilter();
};

const onSearch = () => {
  emitFilter();
};

const emitFilter = () => {
  emit('filter', activeCategory.value, keyword.value, viewMode.value);
};
</script>

<template>
  <div class="w-full flex justify-between items-center mb-12 flex-wrap gap-4">

    <!-- 分類切換 (Glassmorphism Pill) -->
    <div
      class="flex overflow-x-auto no-scrollbar gap-2 p-1.5 rounded-full border w-full lg:w-auto"
      style="background: var(--glass); border-color: var(--glass-border); backdrop-filter: blur(12px);"
    >
      <button
        v-for="cat in categories"
        :key="cat"
        @click="selectCategory(cat)"
        class="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap"
        :class="activeCategory === cat ? 'bg-[var(--ink)] text-[var(--bg)] shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:text-[var(--ink)]'"
      >
        {{ cat }}
      </button>
    </div>

    <!-- 右側：佈局切換 & 搜尋框 -->
    <div class="flex items-center gap-4 w-full lg:w-auto justify-end">

      <!-- 佈局切換 -->
      <div class="flex items-center p-1 rounded-full border" style="background: var(--glass); border-color: var(--glass-border); backdrop-filter: blur(12px);">
        <!-- Grid Icon -->
        <button
          class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
          :class="viewMode === 'grid' ? 'bg-[var(--ink)] text-[var(--bg)] shadow-md' : 'text-neutral-500 dark:text-neutral-400 hover:text-[var(--ink)]'"
          @click="toggleMode('grid')"
          title="網格與分頁模式"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
          </svg>
        </button>
        <!-- List Icon -->
        <button
          class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
          :class="viewMode === 'list' ? 'bg-[var(--ink)] text-[var(--bg)] shadow-md' : 'text-neutral-500 dark:text-neutral-400 hover:text-[var(--ink)]'"
          @click="toggleMode('list')"
          title="無限捲動清單模式"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <!-- 搜尋框 (Glassmorphism Input) -->
      <div
        class="relative flex-1 lg:w-64 rounded-full border flex items-center px-4 py-2 transition-colors focus-within:border-accent"
        style="background: var(--glass); border-color: var(--glass-border); backdrop-filter: blur(12px);"
      >
        <svg class="w-4 h-4 opacity-50 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input
          v-model="keyword"
          @keyup.enter="onSearch"
          type="text"
          placeholder="搜尋文章..."
          class="bg-transparent border-none outline-none w-full text-sm placeholder-gray-400 font-medium"
          style="color: var(--ink);"
        />
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 隱藏原生滾動條但保留功能 */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
