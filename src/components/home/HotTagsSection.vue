<script setup lang="ts">
import type { TagDetailResponse } from '../../api/tagService';

defineProps<{
  tags: TagDetailResponse[];
  isLoading: boolean;
}>();

// 根據 articleCount 計算標籤的相對大小
function getTagSize(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio > 0.7) return 'text-base px-4 py-1.5';
  if (ratio > 0.4) return 'text-sm px-3 py-1';
  return 'text-xs px-2.5 py-0.5';
}
</script>

<template>
  <section>
    <h2 class="text-2xl font-bold tracking-wider mb-6" style="color: var(--text-main);">熱門標籤</h2>

    <!-- 載入中 -->
    <div v-if="isLoading" class="flex flex-wrap gap-3">
      <div
        v-for="i in 10"
        :key="i"
        class="animate-pulse rounded-full"
        :style="{
          width: `${50 + Math.random() * 40}px`,
          height: '28px',
          backgroundColor: 'var(--skeleton-base)',
        }"
      />
    </div>

    <!-- 標籤雲 -->
    <div v-else class="flex flex-wrap gap-3">
      <span
        v-for="tag in tags"
        :key="tag.uuid"
        class="rounded-full border font-medium opacity-70 hover:opacity-100 transition-all cursor-pointer hover:scale-105"
        :class="getTagSize(tag.articleCount, Math.max(...tags.map(t => t.articleCount)))"
        style="border-color: var(--glass-border);"
      >
        {{ tag.name }}
      </span>
    </div>
  </section>
</template>
