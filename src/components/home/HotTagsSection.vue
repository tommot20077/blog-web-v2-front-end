<script setup lang="ts">
import { computed } from 'vue';

interface TagItem {
  name: string;
  count: number;
}

const props = defineProps<{
  tags: TagItem[];
  isLoading: boolean;
}>();

const totalTopics = computed(() => props.tags.length);
const totalPosts = computed(() => props.tags.reduce((sum, t) => sum + t.count, 0));
</script>

<template>
  <section class="tags wrap" data-testid="hot-tags-root">
    <div class="sec reveal">
      <!-- Section header -->
      <div class="sec-head">
        <span class="tag">§ 03 — Topics</span>
        <h2 data-testid="tags-heading">依主題瀏覽。</h2>
        <span class="tag r">{{ totalTopics }} topics / {{ totalPosts }} posts</span>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="sk-pulse" />

      <!-- Tags cloud -->
      <div v-else class="tags-cloud reveal">
        <a
          v-for="(tag, index) in tags"
          :key="tag.name"
          class="tag-pill"
          :data-testid="'tag-pill-' + index"
          href="#"
        >
          {{ tag.name }} <span class="n">{{ tag.count }}</span>
        </a>
      </div>
    </div>
  </section>
</template>
