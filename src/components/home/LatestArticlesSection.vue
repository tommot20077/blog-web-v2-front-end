<script setup lang="ts">
import type { ArticleItem } from '../../api/articleService';
import ArticleCard from '../article/ArticleCard.vue';
import ArticleCardSkeleton from '../article/ArticleCardSkeleton.vue';

defineProps<{
  articles: ArticleItem[];
  isLoading: boolean;
}>();
</script>

<template>
  <section>
    <div class="flex justify-between items-end border-b pb-4 mb-6" style="border-color: var(--glass-border);">
      <h2 class="text-2xl font-bold tracking-wider" style="color: var(--text-main);">最新發布</h2>
      <router-link to="/articles" class="text-sm opacity-60 hover:opacity-100 font-medium transition-opacity">
        查看全部文章 →
      </router-link>
    </div>

    <!-- 載入中骨架 -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <ArticleCardSkeleton v-for="i in 6" :key="i" />
    </div>

    <!-- 文章卡片 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <ArticleCard
        v-for="article in articles"
        :key="article.uuid"
        :article="article"
      />
    </div>
  </section>
</template>
