<script setup lang="ts">
import type { ArticleItem } from '../../api/articleService';
import { RouterLink } from 'vue-router';

const props = defineProps<{
  articles: ArticleItem[];
  isLoading: boolean;
}>();

function formatDate(dateStr: string): string {
  return dateStr ? dateStr.slice(0, 10) : '';
}
</script>

<template>
  <section class="latest wrap" data-testid="latest-root">
    <div class="sec reveal">
      <!-- Section header -->
      <div class="sec-head">
        <span class="tag">§ 02 — Latest</span>
        <h2 data-testid="latest-heading">最近在寫的東西。</h2>
        <RouterLink class="tag r" to="/articles">全部文章 →</RouterLink>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="sk-pulse" />

      <!-- Article grid -->
      <div v-else class="latest-grid">
        <article
          v-for="(article, index) in articles"
          :key="article.uuid"
          class="l-card reveal"
          :data-testid="'latest-card-' + index"
        >
          <div
            class="thumb"
            :data-tag="article.coverImageUrl ? '' : 'IMG · 0' + (index + 1)"
            :style="article.coverImageUrl ? {
              backgroundImage: `url(${article.coverImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {}"
          />
          <div class="meta">
            <span>{{ article.tags[0] }}</span>
            <span>·</span>
            <span>{{ formatDate(article.publishedAt) }}</span>
          </div>
          <h4>
            <RouterLink :to="'/articles/' + article.uuid">{{ article.title }}</RouterLink>
          </h4>
          <p>{{ article.summary }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
