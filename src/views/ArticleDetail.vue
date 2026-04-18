<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useArticleDetail } from '../composables/useArticleDetail';
import { useMarkdownRenderer } from '../composables/useMarkdownRenderer';
import { useWordCount } from '../composables/useWordCount';

const route = useRoute();
const router = useRouter();
const uuid = route.params.uuid as string;

const { article, isLoading } = useArticleDetail(uuid);

// Markdown 原始字串的 computed ref，供 useMarkdownRenderer 與 useWordCount 消費
const markdownSource = computed(() => article.value?.content ?? '');

// 使用 composable 將 Markdown 渲染為安全 HTML
const { renderedHtml, isReady: isShikiReady } = useMarkdownRenderer(markdownSource);

// 動態閱讀時間
const { readingTimeMinutes } = useWordCount(markdownSource);

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'auto' });
});

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/articles');
  }
};
</script>

<template>
  <div class="w-full flex-1 pt-8 md:pt-16 pb-32">
    
    <!-- 全局加載中動畫 -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center pt-32 pb-64 min-h-[60vh]">
      <div class="flex gap-3 items-center opacity-80">
        <div class="w-4 h-4 rounded-full bg-[var(--text-main)] animate-bounce"></div>
        <div class="w-4 h-4 rounded-full bg-[var(--text-main)] animate-bounce" style="animation-delay: 0.15s"></div>
        <div class="w-4 h-4 rounded-full bg-[var(--text-main)] animate-bounce" style="animation-delay: 0.3s"></div>
      </div>
      <p class="mt-8 font-bold tracking-widest opacity-60">萃取文章細節中...</p>
    </div>

    <!-- 找不到文章 (404) -->
    <div v-else-if="!article" class="flex flex-col items-center justify-center pt-32 pb-64 min-h-[60vh]">
      <div class="text-6xl mb-6">🏜️</div>
      <p class="font-bold tracking-widest opacity-60 text-xl text-center leading-relaxed">這是一片荒蕪之地<br>找不到該篇文章（404）</p>
      <button @click="router.push('/articles')" class="mt-8 px-8 py-3 rounded-full border border-[var(--glass-border)] bg-[var(--glass-panel)] backdrop-blur-md opacity-80 hover:opacity-100 transition-all font-bold tracking-widest text-sm hover:scale-105 shadow-sm">
        返回列表頁面
      </button>
    </div>

    <!-- 實際文章渲染層 -->
    <article v-else class="max-w-4xl mx-auto px-6 w-full animate-fade-in-up">
      
      <!-- 返回按鈕列 -->
      <div class="mb-10 w-full flex items-center">
        <button
          @click="goBack"
          class="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity font-bold text-xs tracking-widest px-4 py-2 -ml-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          回列表
        </button>
      </div>

      <!-- 封面圖 -->
      <img
        v-if="article.coverImageUrl"
        data-testid="article-cover-image"
        :src="article.coverImageUrl"
        :alt="article.title"
        class="w-full aspect-video object-cover rounded-none md:rounded-3xl shadow-lg mb-10"
      />

      <!-- 開頭 Hero 資訊 -->
      <header class="mb-16 border-b pb-12" style="border-color: var(--glass-border)">
        <!-- 分類 pills（與 tags 視覺區分，使用 accent-color） -->
        <div v-if="article.categories?.length > 0" class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="cat in article.categories ?? []"
            :key="cat"
            class="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-white"
            style="background: var(--accent-color);"
          >
            {{ cat }}
          </span>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap gap-2 mb-8">
          <span v-for="tag in article.tags" :key="tag" class="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-[var(--text-main)] text-[var(--bg-color)] shadow-md">
            # {{ tag }}
          </span>
        </div>

        <h1 class="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight tracking-tight" style="color: var(--text-main)">
          {{ article.title }}
        </h1>

        <!-- metadata 行 -->
        <div class="flex flex-wrap items-center gap-4 text-sm font-bold opacity-50 tracking-wide uppercase">
          <!-- 作者 -->
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <span>{{ article.authorNickname }}</span>
          </div>
          <span class="opacity-30">|</span>
          <!-- 發布日期 -->
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span>{{ article.publishedAt }}</span>
          </div>
          <span class="opacity-30">|</span>
          <!-- 觀看數 -->
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            <span>{{ article.viewCount }} 觀看次數</span>
          </div>
          <span class="opacity-30">|</span>
          <!-- 閱讀時間（動態） -->
          <div class="flex items-center gap-2">
            <span>約 {{ readingTimeMinutes }} 分鐘閱讀時間</span>
          </div>
          <span class="opacity-30">|</span>
          <!-- 讚數 -->
          <div class="flex items-center gap-2" data-testid="like-count">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span>{{ article.likeCount }}</span>
          </div>
          <span class="opacity-30">|</span>
          <!-- 留言數 -->
          <div class="flex items-center gap-2" data-testid="comment-count">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>
            <span>{{ article.commentCount }}</span>
          </div>
        </div>
      </header>

      <!-- 文章本文 -->
      <!-- markdown-it + Shiki 渲染 → DOMPurify 消毒 → Typography .prose 排版 -->
      <section 
        class="article-content prose prose-lg dark:prose-invert max-w-none leading-relaxed tracking-wide"
        v-html="renderedHtml">
      </section>
      
      <!-- 結尾操作區塊 -->
      <footer class="mt-24 pt-12 border-t flex flex-col md:flex-row items-center justify-between gap-6" style="border-color: var(--glass-border)">
        <p class="font-bold text-xs opacity-40 tracking-widest uppercase">END OF ARTICLE.</p>
        <button 
          @click="scrollToTop"
          class="flex items-center justify-center w-12 h-12 rounded-full border bg-[var(--glass-panel)] backdrop-blur-md opacity-70 hover:opacity-100 hover:-translate-y-2 transition-all shadow-sm group"
          style="border-color: var(--glass-border);"
        >
          <svg class="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
        </button>
      </footer>
      
    </article>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* BUG-003：防止寬內容（table / pre）在 320px 時造成水平溢出 */
.article-content {
  overflow-x: hidden;
}

/* Shiki 程式碼區塊：覆寫 Typography 的預設樣式，讓 Shiki 全權處理 */
.article-content :deep(pre) {
  background: transparent !important;
  padding: 0 !important;
  margin: 1.5em 0 !important;
  max-width: 100%;
  overflow-x: auto;
}
.article-content :deep(pre code) {
  display: block;
  padding: 1.25em 1.5em;
  border-radius: 1rem;
  font-size: 0.875em;
  line-height: 1.7;
  overflow-x: auto;
  border: 1px solid var(--glass-border);
}

/* Shiki 雙主題 CSS Variables 切換 */
.article-content :deep(.shiki) {
  background-color: var(--shiki-light-bg, #f6f8fa) !important;
}
.article-content :deep(.shiki span) {
  color: var(--shiki-light, inherit);
}
html.dark .article-content :deep(.shiki) {
  background-color: var(--shiki-dark-bg, #24292e) !important;
}
html.dark .article-content :deep(.shiki span) {
  color: var(--shiki-dark, inherit);
}

/* blockquote 客製化，與整體設計語言保持一致 */
.article-content :deep(blockquote) {
  border-left-color: var(--text-main);
  background: var(--glass-panel);
  padding: 0.75em 1.5em;
  border-radius: 0 0.75rem 0.75rem 0;
  opacity: 0.85;
}

/* 連結顏色 */
.article-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 圖片圓角 + 陰影 */
.article-content :deep(img) {
  border-radius: 1.5rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

/* 確保刪除線顯示正確 */
.article-content :deep(del),
.article-content :deep(s),
.article-content :deep(strike) {
  text-decoration: line-through;
}

/* 行內程式碼樣式（非 pre 區塊），讓其更明顯 */
.article-content :deep(:not(pre) > code) {
  background-color: var(--glass-panel);
  border: 1px solid var(--glass-border);
  padding: 0.15em 0.4em;
  border-radius: 0.375rem;
  font-size: 0.85em;
  color: #d23669;
}
html.dark .article-content :deep(:not(pre) > code) {
  color: #ff7b72;
}

/* 表格樣式優化 */
.article-content :deep(table) {
  display: block;
  overflow-x: auto;
  width: 100%;
  border-collapse: collapse;
  margin: 2em 0;
  font-size: 0.9em;
}
.article-content :deep(th),
.article-content :deep(td) {
  border: 1px solid var(--glass-border);
  padding: 0.75em 1em;
}
.article-content :deep(th) {
  background-color: var(--glass-panel);
  font-weight: 700;
  text-align: left;
}
.article-content :deep(tr:nth-child(even)) {
  background-color: rgba(0, 0, 0, 0.02);
}
html.dark .article-content :deep(tr:nth-child(even)) {
  background-color: rgba(255, 255, 255, 0.02);
}

/* 任務清單樣式（markdown-it-task-lists） */
.article-content :deep(.task-list-item) {
  list-style-type: none;
  position: relative;
  margin-left: -1.5rem; /* 微調縮進與一般列表對齊 */
}
.article-content :deep(.task-list-item input[type="checkbox"]) {
  position: absolute;
  left: -1.5rem;
  top: 0.35rem;
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--text-main);
  cursor: pointer;
}
</style>
