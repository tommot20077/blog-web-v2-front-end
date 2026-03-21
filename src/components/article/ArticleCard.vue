<script setup lang="ts">
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';

interface ArticleItem {
  uuid: string;
  title: string;
  summary: string;
  viewCount: number;
  publishedAt: string;
  tags: string[];
}

const props = defineProps<{
  article: ArticleItem;
}>();

const router = useRouter();
const goToDetail = () => {
  router.push(`/articles/${props.article.uuid}`);
};
</script>

<template>
  <!-- 卡片：使用 Figma 規劃的 24px 圓角與毛玻璃背景 -->
  <article 
    @click="goToDetail"
    class="flex flex-col p-6 rounded-[24px] border cursor-pointer group hover:scale-[1.02] transition-transform duration-300 w-full min-h-[300px]"
    style="background: var(--glass-panel); border-color: var(--glass-border); backdrop-filter: blur(12px);"
  >
    <!-- 上半部：標題與時間 -->
    <div class="mb-4">
      <h3 class="text-xl font-bold mb-2 group-hover:opacity-80 transition-opacity" style="color: var(--text-main)">
        {{ article.title }}
      </h3>
      <div class="flex items-center gap-3 text-xs opacity-50 font-medium">
        <span>{{ article.publishedAt }}</span>
        <span>·</span>
        <span>{{ article.viewCount }} 次觀看</span>
      </div>
    </div>
    
    <!-- 摘要 -->
    <p class="text-sm opacity-70 mb-8 line-clamp-3 leading-loose flex-grow">
      {{ article.summary }}
    </p>
    
    <!-- 底部：標籤 -->
    <div class="flex flex-wrap gap-2 mt-auto">
      <span 
        v-for="tag in article.tags" 
        :key="tag" 
        class="text-xs px-3 py-1 rounded-full border opacity-60 border-current hover:opacity-100 transition-opacity"
      >
        # {{ tag }}
      </span>
    </div>
  </article>
</template>
