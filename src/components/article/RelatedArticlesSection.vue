<script setup lang="ts">
import { toRef } from 'vue'
import { useRouter } from 'vue-router'
import { useRelatedArticles } from '../../composables/useRelatedArticles'

const props = defineProps<{ articleUuid: string }>()
const articleUuidRef = toRef(props, 'articleUuid')
const { articles, isLoading } = useRelatedArticles(articleUuidRef)
const router = useRouter()

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()} · ${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getDate()).padStart(2, '0')}`
}

function goToArticle(slug: string) {
  router.push(`/articles/${slug}`)
}
</script>

<template>
  <section
    v-if="!isLoading && articles.length > 0"
    class="related-block wrap"
    data-testid="related-articles-section"
  >
    <div class="h-row">
      <h3>繼續讀。</h3>
    </div>
    <div class="related-grid">
      <a
        v-for="a in articles"
        :key="a.uuid"
        class="rel-card"
        href="#"
        :data-testid="`related-article-card-${a.uuid}`"
        @click.prevent="goToArticle(a.slug)"
      >
        <div class="thumb" />
        <div class="meta">{{ a.tags[0] || '—' }} · {{ formatDate(a.publishedAt) }}</div>
        <h4>{{ a.title }}</h4>
      </a>
    </div>
  </section>
</template>

<style scoped>
.related-block {
  margin: 48px auto;
}
.h-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
}
.h-row h3 {
  margin: 0;
  font-family: var(--f-display, sans-serif);
  font-size: 24px;
  letter-spacing: -.02em;
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.rel-card {
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}
.rel-card .thumb {
  aspect-ratio: 16 / 10;
  background: var(--bg-sub, #ededed);
  border-radius: 8px;
  margin-bottom: 12px;
  transition: opacity 120ms ease;
}
.rel-card:hover .thumb {
  opacity: 0.85;
}
.rel-card .meta {
  font-family: var(--f-mono, monospace);
  font-size: 11px;
  letter-spacing: .12em;
  color: var(--muted, #6b6b70);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.rel-card h4 {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  color: var(--ink, #0a0a0b);
  font-weight: 500;
}
.rel-card:hover h4 {
  color: var(--accent, #5b8def);
}
@media (max-width: 768px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
