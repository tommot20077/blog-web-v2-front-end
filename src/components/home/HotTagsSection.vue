<script setup lang="ts">
import type { TagDetailResponse } from '../../api/tagService';

defineProps<{
  tags: TagDetailResponse[];
  isLoading: boolean;
}>();
</script>

<template>
  <section class="hot-tags" data-testid="hot-tags-root">
    <div class="section-head">
      <span class="swiss-label">§ 03</span>
      <h2 data-testid="hot-tags-heading">Hot Tags</h2>
    </div>

    <ul class="tag-list">
      <li v-for="(tag, i) in tags" :key="tag.uuid">
        <RouterLink :to="'/articles?tag=' + tag.name">
          <span class="tag-pill outlined" :data-testid="'hot-tag-' + i">
            {{ tag.name }}
            <span class="tag-count">{{ tag.articleCount }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.hot-tags {
  padding: 2rem 0;
}

.section-head {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.swiss-label {
  font-family: var(--f-mono);
  font-size: 0.75rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.section-head h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.tag-list a {
  text-decoration: none;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--border-strong);
  border-radius: 9999px;
  padding: 0.5rem 1.25rem;
  font-family: var(--f-mono);
  font-size: 0.875rem;
  color: var(--ink);
  transition: background 0.15s ease, color 0.15s ease;
  cursor: pointer;
}

.tag-pill:hover {
  background: var(--ink);
  color: var(--bg);
}

.tag-pill:hover .tag-count {
  color: inherit;
}

.tag-count {
  color: var(--muted);
  font-size: 0.75rem;
}
</style>
