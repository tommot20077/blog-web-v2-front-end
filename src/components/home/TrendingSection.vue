<script setup lang="ts">
import type { RecommendArticleResponse } from '../../api/recommendService';
import ArticleCardSkeleton from '../article/ArticleCardSkeleton.vue';

defineProps<{
  articles: RecommendArticleResponse[];
  isLoading: boolean;
}>();

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}
</script>

<template>
  <section class="trending" data-testid="trending-root">
    <div class="section-head">
      <span class="swiss-label">§ 01</span>
      <h2 data-testid="trending-heading">Trending</h2>
    </div>

    <!-- Loading skeletons -->
    <div v-if="isLoading" class="trend-grid">
      <ArticleCardSkeleton v-for="i in 3" :key="i" />
    </div>

    <!-- Article cards -->
    <div v-else class="trend-grid">
      <RouterLink
        v-for="(article, i) in articles"
        :key="article.uuid"
        :to="'/articles/' + article.uuid"
        class="trend-card-link"
      >
        <article
          class="trend-card"
          :data-testid="'trending-card-' + i"
        >
          <div class="card-cover">
            <img
              v-if="(article as any).coverImageUrl"
              :src="(article as any).coverImageUrl"
              :alt="article.title"
              class="card-cover-img"
            />
          </div>
          <div class="card-body">
            <span class="card-cat">{{ article.tags?.[0] || 'General' }}</span>
            <h3 class="card-title">{{ article.title }}</h3>
            <p class="card-meta">{{ article.authorNickname }} · {{ formatDate(article.publishedAt) }}</p>
          </div>
        </article>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.trending {
  padding: 96px 0 40px;
}

.section-head {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  border-bottom: 1px solid var(--divider, rgba(10,10,11,0.08));
  margin-bottom: 2rem;
  padding-bottom: 0.75rem;
}

.section-head h2 {
  font-family: var(--f-display, system-ui, sans-serif);
  font-weight: 500;
  font-size: 36px;
  letter-spacing: -0.022em;
  margin: 0;
  line-height: 1.1;
  color: var(--ink, inherit);
}

.swiss-label {
  font-family: var(--f-mono, monospace);
  font-size: 0.75rem;
  color: var(--muted, #6b6b70);
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.trend-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .trend-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .trend-grid {
    grid-template-columns: 1fr;
  }
}

.trend-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.trend-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border, rgba(10,10,11,0.10));
  border-radius: 4px;
  overflow: hidden;
  background: var(--surface, #fbfbfb);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
  transition: transform 0.3s var(--ease, cubic-bezier(.22,1,.36,1)), box-shadow 0.3s;
}

.trend-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, 0 20px 40px -22px rgba(0,0,0,0.18));
}

.card-cover {
  aspect-ratio: 16 / 10;
  background:
    repeating-linear-gradient(135deg, rgba(0,0,0,0.035) 0 2px, transparent 2px 14px),
    var(--bg-sub, #ededed);
  border-bottom: 1px solid var(--border, rgba(10,10,11,0.10));
  overflow: hidden;
  position: relative;
}

.card-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.card-cat {
  font-family: var(--f-mono, monospace);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted, #6b6b70);
}

.card-title {
  font-family: var(--f-display, system-ui, sans-serif);
  font-weight: 500;
  font-size: 18px;
  line-height: 1.3;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--ink, inherit);
  transition: color 0.25s;
}

.trend-card:hover .card-title {
  color: var(--accent, #5B8DEF);
}

.card-meta {
  font-family: var(--f-mono, monospace);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: var(--muted, #6b6b70);
  margin: 0;
}
</style>
