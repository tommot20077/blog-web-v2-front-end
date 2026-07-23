<script setup lang="ts">
import type { TocEntry } from '../../types/article'

// 文章章節導覽（TOC）側欄。
// 純展示元件：不自行捲動、不碰路由，點擊時只 emit 錨點 id，交由呼叫端（ArticleDetail）處理。
defineProps<{
  toc: TocEntry[]
  activeId?: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <nav
    v-if="toc.length > 0"
    class="article-toc"
    aria-label="文章章節導覽"
    data-testid="article-toc"
  >
    <ul class="toc-list">
      <li
        v-for="entry in toc"
        :key="entry.id"
        class="toc-item"
        :class="{ 'toc-item--h3': entry.level === 3 }"
        :data-testid="`toc-entry-${entry.id}`"
      >
        <button
          type="button"
          class="toc-link"
          :class="{ active: entry.id === activeId }"
          :aria-current="entry.id === activeId ? 'true' : undefined"
          :data-testid="`toc-link-${entry.id}`"
          @click="emit('select', entry.id)"
        >
          {{ entry.text }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.article-toc {
  padding: 12px;
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  background: var(--glass);
  backdrop-filter: blur(12px);
}
.toc-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.toc-item--h3 {
  padding-left: 16px;
}
.toc-link {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-size: 13.5px;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  transition:
    color 0.2s,
    background-color 0.2s;
}
.toc-link:hover {
  color: var(--ink);
  background: var(--bg-sub);
}
.toc-link.active {
  color: var(--accent);
  background: color-mix(in oklch, var(--accent) 14%, transparent);
  font-weight: 600;
}
</style>
