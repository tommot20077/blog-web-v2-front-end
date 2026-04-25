<script setup lang="ts">
import type { RecommendArticleResponse } from '../../api/recommendService';

defineProps<{
  articles: RecommendArticleResponse[];
  isLoading: boolean;
}>();

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = dateStr.slice(0, 10).split('-');
  if (d.length !== 3) return dateStr.slice(0, 10);
  return `${d[0]} · ${d[1]} · ${d[2]}`;
}

function padIndex(i: number): string {
  return String(i + 1).padStart(2, '0');
}
</script>

<template>
  <section class="trending wrap" data-testid="trending-root">
    <!-- sec-head -->
    <div class="sec-head">
      <span class="tag">§ 01 — Trending</span>
      <h2 data-testid="trending-heading">本週最多人讀的五篇。</h2>
      <RouterLink class="tag r" to="/articles">所有文章 →</RouterLink>
    </div>

    <!-- Loading skeletons -->
    <div v-if="isLoading" class="trending-grid">
      <div v-for="i in 5" :key="i" class="sk-pulse"></div>
    </div>

    <!-- Article list -->
    <div v-else class="trending-grid">
      <RouterLink
        v-for="(article, index) in articles"
        :key="article.uuid"
        :to="'/articles/' + article.uuid"
        class="t-card reveal"
        :data-testid="'trending-card-' + index"
      >
        <div class="row">
          <span class="no">{{ padIndex(index) }}</span>
          <span class="ttl">{{ article.title }}</span>
          <span class="cat">{{ article.tags?.[0] || 'General' }}</span>
          <span class="date">{{ formatDate(article.publishedAt) }}</span>
          <span class="arrow">→</span>
        </div>
      </RouterLink>
    </div>

    <!-- Featured card (first article) -->
    <div v-if="articles[0]" class="featured reveal">
      <div class="hero-art">
        <span class="big-no">№001</span>
      </div>
      <div class="col-r">
        <h3 class="f-title">{{ articles[0].title }}</h3>
        <p class="f-lede">{{ articles[0].summary }}</p>
        <div class="author-meta">
          <span class="author">{{ articles[0].authorNickname }}</span>
          <span class="f-date">{{ formatDate(articles[0].publishedAt) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
