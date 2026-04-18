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
  <section class="latest" data-testid="latest-root">
    <!-- Section header -->
    <div class="section-head">
      <span class="swiss-label">§ 02</span>
      <h2 data-testid="latest-heading">最新發布</h2>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="latest-grid latest-grid--skeleton">
      <div class="latest-card latest-card--lead skeleton-block" />
      <div v-for="n in 4" :key="n" class="latest-card skeleton-block" />
    </div>

    <!-- Article grid -->
    <div v-else class="latest-grid">
      <!-- Lead card (first article) -->
      <article
        v-if="articles[0]"
        class="latest-card latest-card--lead"
        data-testid="latest-card-lead"
      >
        <RouterLink :to="'/articles/' + articles[0].uuid" class="card-link">
          <div class="card-thumb" />
          <div class="card-body">
            <div class="card-meta">
              <span class="card-author">{{ articles[0].authorNickname }}</span>
              <span class="card-sep">·</span>
              <span class="card-date">{{ formatDate(articles[0].publishedAt) }}</span>
            </div>
            <h3 class="card-title card-title--lead">{{ articles[0].title }}</h3>
            <p class="card-excerpt">{{ articles[0].summary }}</p>
          </div>
        </RouterLink>
      </article>

      <!-- Secondary cards (articles 1–4) -->
      <article
        v-for="(article, i) in articles.slice(1, 5)"
        :key="article.uuid"
        class="latest-card"
        :data-testid="'latest-card-' + i"
      >
        <RouterLink :to="'/articles/' + article.uuid" class="card-link">
          <div class="card-body">
            <div class="card-meta">
              <span class="card-author">{{ article.authorNickname }}</span>
              <span class="card-sep">·</span>
              <span class="card-date">{{ formatDate(article.publishedAt) }}</span>
            </div>
            <h4 class="card-title">{{ article.title }}</h4>
            <p class="card-excerpt">{{ article.summary }}</p>
          </div>
        </RouterLink>
      </article>
    </div>
  </section>
</template>

<style scoped>
/* ===== Section wrapper ===== */
.latest {
  padding: 96px 0 40px;
  border-top: 1px solid var(--border-strong, rgba(10,10,11,0.18));
}

/* ===== Section header (Swiss rule) ===== */
.section-head {
  display: flex;
  align-items: baseline;
  gap: 20px;
  margin-bottom: 48px;
}

.swiss-label {
  font-family: var(--f-mono, ui-monospace, monospace);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted, #6b6b70);
  white-space: nowrap;
}

.section-head h2 {
  font-family: var(--f-display, system-ui, sans-serif);
  font-weight: 500;
  font-size: 36px;
  letter-spacing: -0.022em;
  margin: 0;
  line-height: 1.1;
  color: var(--ink, #0a0a0b);
}

/* ===== Asymmetric grid ===== */
.latest-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: repeat(2, auto);
  gap: 1.5rem;
}

/* Lead card spans both rows on the left */
.latest-card--lead {
  grid-row: span 2;
}

/* ===== Card base ===== */
.latest-card {
  border-bottom: 1px solid var(--divider, rgba(10,10,11,0.08));
  padding-bottom: 1rem;
}

.card-link {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

/* ===== Thumbnail placeholder ===== */
.card-thumb {
  aspect-ratio: 16 / 10;
  background:
    repeating-linear-gradient(135deg, rgba(0,0,0,0.035) 0 2px, transparent 2px 14px),
    var(--bg-sub, #ededed);
  border: 1px solid var(--border, rgba(10,10,11,0.10));
  border-radius: 2px;
  transition: transform 0.5s var(--ease, cubic-bezier(.22,1,.36,1));
}

.latest-card--lead .card-thumb {
  aspect-ratio: 16 / 11;
}

.card-link:hover .card-thumb {
  transform: scale(1.01);
}

/* ===== Card body ===== */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ===== Meta line ===== */
.card-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  font-family: var(--f-mono, ui-monospace, monospace);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted, #6b6b70);
}

.card-sep {
  color: var(--muted-2, #9a9aa0);
}

/* ===== Titles ===== */
.card-title {
  font-family: var(--f-display, system-ui, sans-serif);
  font-weight: 500;
  font-size: 20px;
  line-height: 1.25;
  letter-spacing: -0.012em;
  margin: 0;
  color: var(--ink, #0a0a0b);
  border-bottom: 1px solid transparent;
  transition: border-color 0.25s, color 0.25s;
}

.card-link:hover .card-title {
  border-bottom-color: var(--accent, #5B8DEF);
  color: var(--accent, #5B8DEF);
}

.card-title--lead {
  font-size: 32px;
  letter-spacing: -0.024em;
  line-height: 1.08;
}

/* ===== Excerpt ===== */
.card-excerpt {
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-2, #2a2a2c);
  margin: 0;
  max-width: 52ch;
}

/* ===== Skeleton ===== */
.skeleton-block {
  background: var(--bg-sub, #ededed);
  border-radius: 4px;
  min-height: 200px;
  animation: pulse 1.5s ease-in-out infinite;
}

.latest-card--lead.skeleton-block {
  min-height: 400px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
