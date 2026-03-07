<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isDarkMode = ref(false);

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  if(isDarkMode.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
</script>

<template>
  <div class="min-h-screen bg-background dark:bg-zinc-900 transition-colors duration-500 relative overflow-hidden font-sans">
    
    <!-- Header / Navigation -->
    <header class="absolute top-0 w-full flex justify-between items-center px-6 py-5 z-50">
      <!-- Logo -->
      <div class="flex items-center gap-2 cursor-pointer group">
        <div class="w-6 h-6 bg-black dark:bg-white rounded transition-transform group-hover:rotate-12"></div>
        <span class="font-medium text-black dark:text-white tracking-widest text-sm sm:text-base">MY BLOG WEB.</span>
      </div>

      <!-- Center Pill Navigation -->
      <nav class="hidden md:flex items-center gap-6 bg-white/60 dark:bg-black/60 backdrop-blur-md px-6 py-4 rounded-full shadow-sm">
        <a href="#" class="text-black dark:text-white font-medium hover:text-accent transition-colors">首頁</a>
        <a href="#" class="text-black dark:text-white font-medium hover:text-accent transition-colors">文章</a>
        <span class="text-black dark:text-white font-medium">你好,TOM!</span>
        <a href="#" class="text-black dark:text-white font-medium hover:text-accent transition-colors">登入 / 註冊</a>
      </nav>

      <!-- Theme Switcher -->
      <button 
        @click="toggleDarkMode"
        class="flex items-center w-14 h-8 bg-accent rounded-full p-1 transition-colors duration-300"
        :class="isDarkMode ? 'justify-end' : 'justify-start'"
      >
        <div class="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transform transition-transform duration-300">
          <span v-if="!isDarkMode" class="text-xs">☀️</span>
          <span v-else class="text-xs">🌙</span>
        </div>
      </button>
    </header>

    <!-- Mobile Navigation (bottom/fixed or simplified) -->
    <div class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <nav class="flex items-center gap-8 bg-white/80 dark:bg-black/80 backdrop-blur-md px-8 py-4 rounded-full shadow-lg border border-white/20">
        <a href="#" class="text-black dark:text-white hover:text-accent transition-colors">首頁</a>
        <a href="#" class="text-black dark:text-white hover:text-accent transition-colors">文章</a>
        <a href="#" class="text-black dark:text-white hover:text-accent transition-colors">登入</a>
      </nav>
    </div>

    <!-- Main Content -->
    <main class="relative pt-24 pb-32 px-6 flex flex-col items-center min-h-screen">
      
      <!-- Background Giant Text Removed as per user request -->


      <!-- Hero Section Hint -->
      <div class="mt-8 mb-16 relative z-10 flex flex-col items-center">
        <p class="text-xl md:text-2xl font-medium text-black dark:text-white mb-8 tracking-wide">
          太暗嗎？點個燈
        </p>
        <!-- A decorative circle matching the design idea -->
        <div class="w-28 h-28 md:w-32 md:h-32 bg-accent rounded-full mb-12 shadow-[0_0_60px_rgba(255,141,40,0.5)] animate-pulse cursor-pointer"></div>
      </div>

      <!-- Content Cards Display (Posts layout reference) -->
      <div class="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
        <div class="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-3xl aspect-[3/4] p-6 hover:-translate-y-2 transition-transform duration-300 border border-white/40 dark:border-white/10 shadow-sm flex flex-col group cursor-pointer">
          <div class="w-full h-1/2 bg-gray-200 dark:bg-zinc-700 rounded-2xl mb-4 overflow-hidden relative">
             <div class="absolute inset-0 bg-black/5 dark:bg-white/5 group-hover:bg-transparent transition-colors"></div>
          </div>
          <h3 class="text-xl font-bold dark:text-white mb-2">文章標題範例 1</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">這是一段文章摘要描述，用於展示大致的排版效果與比例，提供簡潔而精緻的視覺亮點。</p>
        </div>
        <div class="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-3xl aspect-[3/4] p-6 hover:-translate-y-2 transition-transform duration-300 border border-white/40 dark:border-white/10 shadow-sm flex flex-col group cursor-pointer">
          <div class="w-full h-1/2 bg-gray-200 dark:bg-zinc-700 rounded-2xl mb-4 overflow-hidden relative">
            <div class="absolute inset-0 bg-black/5 dark:bg-white/5 group-hover:bg-transparent transition-colors"></div>
          </div>
          <h3 class="text-xl font-bold dark:text-white mb-2">文章標題範例 2</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">結合便利貼留言的有趣點子還有巨大的裝飾字，讓簡單的畫面擁有一絲活力與設計感。</p>
        </div>
        <div class="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-3xl aspect-[3/4] p-6 hover:-translate-y-2 transition-transform duration-300 border border-white/40 dark:border-white/10 shadow-sm flex flex-col group cursor-pointer">
          <div class="w-full h-1/2 bg-gray-200 dark:bg-zinc-700 rounded-2xl mb-4 overflow-hidden relative">
             <div class="absolute inset-0 bg-black/5 dark:bg-white/5 group-hover:bg-transparent transition-colors"></div>
          </div>
          <h3 class="text-xl font-bold dark:text-white mb-2">排版參考與設計思考</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">如果我能夠用 ”有趣” 的動態把使用者留住那就太好了！這是當前設計想嘗試的方向。</p>
        </div>
      </div>
      
    </main>

    <!-- Footer -->
    <footer class="w-full py-12 flex flex-col items-center justify-center border-t border-black/10 dark:border-white/10 relative z-10 bg-background dark:bg-zinc-900">
      <div class="flex gap-4">
        <div class="border border-black dark:border-white rounded-full px-6 py-2 text-black dark:text-white text-sm font-medium hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer">
          0900 123 456
        </div>
        <div class="border border-black dark:border-white rounded-full px-6 py-2 text-black dark:text-white text-sm font-medium hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer">
          lucaisgoat@gmail.com
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* CSS Reset included in standard tailwind setup */
</style>
