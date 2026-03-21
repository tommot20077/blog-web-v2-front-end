<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import ArticleCard from '../components/article/ArticleCard.vue';
import FilterBar from '../components/article/FilterBar.vue';
import { articleService, type ArticleItem } from '../api/articleService';

const articles = ref<ArticleItem[]>([]);
const viewMode = ref<'grid' | 'list'>('grid');

const gridPage = ref(1);
const itemsPerPageGrid = 6;
const maxGridPages = ref(1);

const listPage = ref(1);
const itemsPerPageList = 5;

const isLoading = ref(false);     // 首次或切換過濾時的加載
const isLoadingMore = ref(false); // 無限滾動的加載
const noMoreData = ref(false);

const filterParams = ref({ category: '全部', keyword: '' });

// 取資料的核心邏輯 (串接 API Service)
const fetchArticles = async (isLoadMore = false) => {
  const currentMode = viewMode.value;
  const page = currentMode === 'grid' ? gridPage.value : listPage.value;
  const size = currentMode === 'grid' ? itemsPerPageGrid : itemsPerPageList;

  if (isLoadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
  }

  try {
    const result = await articleService.getArticles(page, size, filterParams.value.category, filterParams.value.keyword);
    
    if (currentMode === 'grid') {
      articles.value = result.records;
      maxGridPages.value = result.pages;
    } else {
      // List Mode (Append)
      if (isLoadMore) {
        articles.value.push(...result.records);
      } else {
        articles.value = result.records;
      }
      noMoreData.value = page >= result.pages || result.records.length === 0;
    }
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

const handleFilter = (category: string, keyword: string, mode: 'grid' | 'list') => {
  viewMode.value = mode;
  filterParams.value = { category, keyword };
  gridPage.value = 1;
  listPage.value = 1;
  noMoreData.value = false;
  
  fetchArticles(); // 切換時觸發新的 Fetch
};

const goToPage = (pageNumber: number) => {
  if (pageNumber < 1 || pageNumber > maxGridPages.value) return;
  gridPage.value = pageNumber;
  fetchArticles();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const loadNextPage = () => {
  if (isLoadingMore.value || noMoreData.value || viewMode.value === 'grid') return;
  listPage.value += 1;
  fetchArticles(true);
};

const observerTarget = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  fetchArticles(); // 初始加載

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading.value && !isLoadingMore.value) {
      loadNextPage();
    }
  }, { rootMargin: '150px' });
  
  if (observerTarget.value) {
    observer.observe(observerTarget.value);
  }
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<template>
  <div class="w-full flex flex-col items-center flex-1">
    <!-- 最外層移除 pt，因為頂部空間交由 sticky 背板提供 -->
    <div class="w-full max-w-7xl mx-auto mb-32 flex flex-col items-center">
      
      <!-- Sticky 背景牆與 FilterBar -->
      <!-- 讓這塊容器貼住 top-0，並用超厚的 pt 擔任導航欄的防護遮罩 -->
      <div 
        class="sticky top-0 z-40 w-full pt-[100px] pb-4 transition-all duration-300 px-4 md:px-8 border-b"
        style="background: var(--bg-color); border-color: var(--glass-border);"
      >
        <FilterBar @filter="handleFilter" class="w-full max-w-7xl mx-auto !mb-0" />
      </div>

      <!-- 內容區增加左右 padding -->
      <div class="w-full px-4 md:px-8">
        
        <!-- Loading 狀態 -->
        <div v-if="isLoading" class="w-full py-20 flex justify-center">
          <div class="flex gap-2 items-center opacity-60">
            <div class="w-3 h-3 rounded-full bg-[var(--text-main)] animate-bounce"></div>
            <div class="w-3 h-3 rounded-full bg-[var(--text-main)] animate-bounce" style="animation-delay: 0.15s"></div>
            <div class="w-3 h-3 rounded-full bg-[var(--text-main)] animate-bounce" style="animation-delay: 0.3s"></div>
          </div>
        </div>

        <!-- 文章呈現區塊：網格(Grid) or 清單(List) -->
        <div 
          v-else-if="articles.length > 0"
          class="w-full transition-all duration-500 pt-8"
          :class="[
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch' 
              : 'grid grid-cols-1 gap-6'
          ]"
        >
          <ArticleCard 
            v-for="item in articles" 
            :key="item.uuid" 
            :article="item" 
            class="h-full w-full"
          />
        </div>

        <!-- 找不到文章 -->
        <div v-else class="w-full py-24 text-center opacity-50 font-medium tracking-widest">
          沒有找到符合條件的文章。
        </div>

        <!-- 分頁器 (僅在 Grid 模式下顯示) -->
        <div v-if="viewMode === 'grid' && maxGridPages > 1 && !isLoading" class="mt-20 flex gap-2 justify-center">
          <button 
            @click="goToPage(gridPage - 1)" 
            :disabled="gridPage === 1"
            class="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed" style="border-color: var(--glass-border);"
          >
            <span class="opacity-60">←</span>
          </button>
          
          <button 
            v-for="page in maxGridPages"
            :key="page"
            @click="goToPage(page)"
            class="w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200 font-bold"
            :class="[
              gridPage === page 
                ? 'bg-[var(--text-main)] text-[var(--bg-color)] shadow-md border-transparent' 
                : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100'
            ]"
            :style="gridPage !== page ? 'border-color: var(--glass-border);' : ''"
          >
            {{ page }}
          </button>

          <button 
            @click="goToPage(gridPage + 1)"
            :disabled="gridPage === maxGridPages" 
            class="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed" style="border-color: var(--glass-border);"
          >
            <span class="opacity-60">→</span>
          </button>
        </div>

        <!-- 無限載入偵測點 (僅在 List 模式下顯示) -->
        <div v-show="viewMode === 'list' && articles.length > 0" ref="observerTarget" class="mt-16 w-full flex justify-center items-center h-24">
          <div v-if="isLoadingMore" class="flex gap-3 items-center opacity-80 bg-[var(--glass-panel)] px-6 py-3 rounded-full border border-[var(--glass-border)] shadow-sm backdrop-blur-md">
            <div class="w-2.5 h-2.5 rounded-full bg-current animate-bounce"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-current animate-bounce" style="animation-delay: 0.15s"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-current animate-bounce" style="animation-delay: 0.3s"></div>
            <span class="ml-2 font-bold text-sm tracking-widest">載入下一頁中...</span>
          </div>
          <div v-else-if="noMoreData" class="opacity-50 text-sm tracking-widest font-bold bg-[var(--glass-panel)] px-6 py-3 rounded-full border border-[var(--glass-border)] shadow-sm backdrop-blur-md">
            🎉 已經到底囉！
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
